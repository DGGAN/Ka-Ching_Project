/**
 * @file frontend/plugins/withAndroidNotificationListener.js
 * @layer Expo Config Plugin (Android Native NotificationListenerService & Bridge Injector)
 * @description Self-contained Expo Config Plugin that injects a pure Android Java NotificationListenerService (KaChingNotificationListener) AND a React Native bridge module (KaChingAutoCaptureModule) with strict Malaysian eWallet/bank whitelist filtering and zero third-party npm dependencies.
 */

const { withAndroidManifest, withDangerousMod, withMainApplication } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const KACHING_LISTENER_JAVA = `package com.dggan.kaching;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Parcelable;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

public class KaChingNotificationListener extends NotificationListenerService {
    private static final String TAG = "KaChingNotifListener";
    private static final String BACKEND_URL = "https://kaching-backend-27o2.onrender.com/api/transactions/auto-capture";
    private static final String PREFS_NAME = "KaChingAutoCapturePrefs";
    private static final String QUEUE_KEY = "pendingNotifQueue";
    private static final String CHANNEL_ID = "kaching_autocapture_alerts";
    private static final Set<String> PROCESSED_KEYS = Collections.synchronizedSet(new HashSet<>());
    private static final Pattern RM_AMOUNT_PATTERN = Pattern.compile("(?i)(?:RM|MYR)\\s*[0-9]");

    // Strict Whitelist: ONLY capture notifications from these Malaysian eWallets & Banking apps
    private static final String[] ALLOWED_FINANCE_PACKAGES = new String[]{
        "my.com.tngdigital.ewallet",             // Touch 'n Go eWallet
        "com.maybank2u.life",                    // MAE by Maybank2u
        "com.grabtaxi.passenger",                // Grab / GrabPay
        "com.cimbmalaysia.clicks",               // CIMB Clicks
        "com.cimbmalaysia.cimbclicks",           // CIMB Clicks / OCTO
        "com.pbbank.PBeM",                       // Public Bank PB engage
        "com.pbbank.mypb",                       // Public Bank MyPB
        "com.rhbgroup.rhbmobilebanking",         // RHB Mobile Banking
        "my.com.hongleongconnect.mobileconnect", // HLB Connect
        "my.com.boost",                          // Boost eWallet
        "com.shopee.my",                         // Shopee / ShopeePay
        "com.gxbank.app"                         // GXBank
    };

    public static KaChingNotificationListener instance = null;

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        instance = this;
        Log.i(TAG, "Ka-Ching! Native NotificationListenerService CONNECTED");
        flushPendingQueueAsync();
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        if (instance == this) {
            instance = null;
        }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        extractAndForwardNotification(sbn);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {}

    public void scanCurrentActiveNotifications() {
        flushPendingQueueAsync();
    }

    private boolean isAllowedFinancePackage(String pkgLower) {
        if (pkgLower == null || pkgLower.isEmpty()) return false;
        for (String allowed : ALLOWED_FINANCE_PACKAGES) {
            if (pkgLower.equals(allowed.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    private void extractFromBundle(Bundle extras, StringBuilder titleHolder, StringBuilder textBuilder) {
        if (extras == null) return;

        Object rawTitle = extras.get(Notification.EXTRA_TITLE);
        if (rawTitle != null && titleHolder.length() == 0) {
            titleHolder.append(String.valueOf(rawTitle).trim());
        }

        Object rawTitleBig = extras.get(Notification.EXTRA_TITLE_BIG);
        if (rawTitleBig != null && titleHolder.length() == 0) {
            titleHolder.append(String.valueOf(rawTitleBig).trim());
        }

        String[] textKeys = new String[]{
            Notification.EXTRA_TEXT,
            Notification.EXTRA_BIG_TEXT,
            Notification.EXTRA_SUB_TEXT,
            Notification.EXTRA_SUMMARY_TEXT,
            Notification.EXTRA_INFO_TEXT
        };
        for (String key : textKeys) {
            Object val = extras.get(key);
            if (val != null) {
                String str = String.valueOf(val).trim();
                if (!str.isEmpty() && !textBuilder.toString().contains(str)) {
                    textBuilder.append(str).append(" ");
                }
            }
        }

        CharSequence[] lines = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
        if (lines != null) {
            for (CharSequence line : lines) {
                if (line != null) {
                    String lineStr = line.toString().trim();
                    if (!lineStr.isEmpty() && !textBuilder.toString().contains(lineStr)) {
                        textBuilder.append(lineStr).append(" ");
                    }
                }
            }
        }

        try {
            Parcelable[] msgParcelables = extras.getParcelableArray("android.messages");
            if (msgParcelables != null) {
                for (Parcelable p : msgParcelables) {
                    if (p instanceof Bundle) {
                        Bundle msgBundle = (Bundle) p;
                        Object msgText = msgBundle.get("text");
                        if (msgText != null) textBuilder.append(String.valueOf(msgText)).append(" ");
                    }
                }
            }
        } catch (Exception ignored) {}

        for (String k : extras.keySet()) {
            Object v = extras.get(k);
            if (v instanceof CharSequence || v instanceof String) {
                String s = String.valueOf(v).trim();
                if (!s.isEmpty() && !s.equals(titleHolder.toString()) && !textBuilder.toString().contains(s)) {
                    textBuilder.append(s).append(" ");
                }
            }
        }
    }

    private void extractAndForwardNotification(StatusBarNotification sbn) {
        try {
            Notification notif = sbn.getNotification();
            if (notif == null) return;

            if ((notif.flags & Notification.FLAG_ONGOING_EVENT) != 0) {
                return;
            }

            String pkg = sbn.getPackageName() != null ? sbn.getPackageName() : "";
            String pkgLower = pkg.toLowerCase();

            // Strict Whitelist Check: Only process notifications from our target finance apps
            if (!isAllowedFinancePackage(pkgLower)) {
                return;
            }

            // Deduplicate by notification key + postTime so an unswiped notification is NEVER sent twice
            String uniqueNotifId = sbn.getKey() + "_" + sbn.getPostTime();
            if (PROCESSED_KEYS.contains(uniqueNotifId)) {
                return;
            }

            StringBuilder titleHolder = new StringBuilder();
            StringBuilder textBuilder = new StringBuilder();

            extractFromBundle(notif.extras, titleHolder, textBuilder);

            if (notif.publicVersion != null) {
                extractFromBundle(notif.publicVersion.extras, titleHolder, textBuilder);
            }

            if (notif.tickerText != null) {
                String ticker = notif.tickerText.toString().trim();
                if (!ticker.isEmpty() && !textBuilder.toString().contains(ticker)) {
                    textBuilder.append(ticker).append(" ");
                }
            }

            String title = titleHolder.toString().trim();
            String text = textBuilder.toString().trim();
            String combined = (title + " " + text).trim();

            if (combined.isEmpty() || title.toLowerCase().contains("ka-ching")) {
                return;
            }

            if (!RM_AMOUNT_PATTERN.matcher(combined).find()) {
                return;
            }

            PROCESSED_KEYS.add(uniqueNotifId);
            if (PROCESSED_KEYS.size() > 200) {
                PROCESSED_KEYS.clear();
                PROCESSED_KEYS.add(uniqueNotifId);
            }

            SharedPreferences prefs = getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String savedUserId = prefs.getString("userId", "AUTO_ACTIVE_USER");

            final String finalUserId = (savedUserId == null || savedUserId.isEmpty()) ? "AUTO_ACTIVE_USER" : savedUserId;
            final String finalTitle = title.isEmpty() ? "Payment Notification" : title;
            final String finalText = text.isEmpty() ? combined : text;
            final String finalPkg = pkg;

            // Briefly hold a partial WakeLock so Xiaomi/Android doesn't suspend the background socket before POST completes
            android.os.PowerManager.WakeLock wakeLock = null;
            try {
                android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    wakeLock = pm.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "KaChing::AutoCapturePost");
                    wakeLock.acquire(15000L);
                }
            } catch (Exception ignored) {}

            final android.os.PowerManager.WakeLock finalWakeLock = wakeLock;
            new Thread(() -> {
                try {
                    boolean ok = postToRenderBackend(finalUserId, finalTitle, finalText, finalPkg);
                    if (!ok) {
                        enqueueFailedNotification(finalUserId, finalTitle, finalText, finalPkg);
                    }
                } finally {
                    if (finalWakeLock != null && finalWakeLock.isHeld()) {
                        try { finalWakeLock.release(); } catch (Exception ignored) {}
                    }
                }
            }).start();
        } catch (Exception e) {
            Log.e(TAG, "extractAndForwardNotification error", e);
        }
    }

    private synchronized void enqueueFailedNotification(String userId, String title, String text, String packageName) {
        try {
            SharedPreferences prefs = getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString(QUEUE_KEY, "[]");
            JSONArray arr = new JSONArray(raw);

            JSONObject item = new JSONObject();
            item.put("userId", userId);
            item.put("title", title);
            item.put("text", text);
            item.put("packageName", packageName);

            JSONArray nextArr = new JSONArray();
            int start = Math.max(0, arr.length() - 19);
            for (int i = start; i < arr.length(); i++) {
                nextArr.put(arr.getJSONObject(i));
            }
            nextArr.put(item);

            prefs.edit().putString(QUEUE_KEY, nextArr.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "enqueueFailedNotification error", e);
        }
    }

    public void flushPendingQueueAsync() {
        new Thread(() -> {
            try {
                SharedPreferences prefs = getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String raw = prefs.getString(QUEUE_KEY, "[]");
                JSONArray arr = new JSONArray(raw);
                if (arr.length() == 0) return;

                prefs.edit().putString(QUEUE_KEY, "[]").apply();

                String activeUserId = prefs.getString("userId", "AUTO_ACTIVE_USER");
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject item = arr.getJSONObject(i);
                    String uid = item.optString("userId", activeUserId);
                    if (uid.equals("AUTO_ACTIVE_USER") && activeUserId != null && !activeUserId.isEmpty()) {
                        uid = activeUserId;
                    }
                    String t = item.optString("title", "Payment Notification");
                    String txt = item.optString("text", "");
                    String p = item.optString("packageName", "");
                    boolean sent = postToRenderBackend(uid, t, txt, p);
                    if (!sent) {
                        enqueueFailedNotification(uid, t, txt, p);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "flushPendingQueueAsync error", e);
            }
        }).start();
    }

    private boolean postToRenderBackend(String userId, String title, String text, String packageName) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(BACKEND_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(45000);
            conn.setReadTimeout(45000);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);

            JSONObject payload = new JSONObject();
            payload.put("userId", userId);
            payload.put("title", title);
            payload.put("text", text);
            payload.put("packageName", packageName);
            payload.put("platform", "ANDROID_LISTENER");

            byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            Log.i(TAG, "POST /transactions/auto-capture response: " + code);

            if (code == 201) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        sb.append(line);
                    }
                    JSONObject respJson = new JSONObject(sb.toString());
                    boolean duplicateSkipped = respJson.optBoolean("duplicateSkipped", false);
                    JSONObject txData = respJson.optJSONObject("data");
                    if (!duplicateSkipped && txData != null) {
                        double amt = txData.optDouble("amount", 0.0);
                        String merchant = txData.optString("merchantName", "Payment");
                        String category = txData.optString("category", "OTHER_EXPENSE").replace("_", " ");
                        final String bannerTitle = String.format("Ka-Ching! Auto-Captured RM %.2f", amt);
                        final String bannerBody = merchant + " (" + category + ") was automatically logged via " + title + ".";

                        // Wait 3.5 seconds so it does not collide with TNG/MAE's own payment banner & sound
                        new Handler(Looper.getMainLooper()).postDelayed(
                            () -> showDelayedAutoCaptureBanner(bannerTitle, bannerBody),
                            3500
                        );
                    }
                } catch (Exception parseEx) {
                    Log.w(TAG, "Could not parse 201 response for confirmation banner", parseEx);
                }
            }

            return code >= 200 && code < 500;
        } catch (Exception e) {
            Log.e(TAG, "POST /transactions/auto-capture network error (will retry)", e);
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private void showDelayedAutoCaptureBanner(String bannerTitle, String bannerBody) {
        try {
            Context ctx = getApplicationContext();
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Ka-Ching! Auto-Capture Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Confirms when eWallet or bank payments are auto-logged.");
                nm.createNotificationChannel(channel);
            }

            Intent launchIntent = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
            PendingIntent pendingIntent = null;
            if (launchIntent != null) {
                int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                    ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    : PendingIntent.FLAG_UPDATE_CURRENT;
                pendingIntent = PendingIntent.getActivity(ctx, 1001, launchIntent, flags);
            }

            Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(ctx, CHANNEL_ID)
                : new Notification.Builder(ctx);

            builder.setSmallIcon(ctx.getApplicationInfo().icon)
                .setContentTitle(bannerTitle)
                .setContentText(bannerBody)
                .setStyle(new Notification.BigTextStyle().bigText(bannerBody))
                .setAutoCancel(true);

            if (pendingIntent != null) {
                builder.setContentIntent(pendingIntent);
            }

            nm.notify((int) (System.currentTimeMillis() % 100000), builder.build());
        } catch (Exception e) {
            Log.e(TAG, "showDelayedAutoCaptureBanner error", e);
        }
    }
}
`;

const KACHING_MODULE_JAVA = `package com.dggan.kaching;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class KaChingAutoCaptureModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public KaChingAutoCaptureModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "KaChingAutoCapture";
    }

    private void ensureListenerRebound() {
        try {
            ComponentName cn = new ComponentName(reactContext, KaChingNotificationListener.class);
            PackageManager pm = reactContext.getPackageManager();
            pm.setComponentEnabledSetting(cn, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
            pm.setComponentEnabledSetting(cn, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                NotificationListenerService.requestRebind(cn);
            }
        } catch (Exception ignored) {}
    }

    @ReactMethod
    public void getPermissionStatus(Promise promise) {
        try {
            String pkgName = reactContext.getPackageName();
            String flat = Settings.Secure.getString(reactContext.getContentResolver(), "enabled_notification_listeners");
            boolean granted = flat != null && flat.contains(pkgName);
            if (granted && KaChingNotificationListener.instance == null) {
                ensureListenerRebound();
            }
            promise.resolve(granted ? "authorized" : "denied");
        } catch (Exception e) {
            promise.resolve("denied");
        }
    }

    @ReactMethod
    public void requestPermission() {
        try {
            Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
        } catch (Exception ignored) {}
    }

    @ReactMethod
    public void setActiveUser(String userId, boolean enabled, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("KaChingAutoCapturePrefs", Context.MODE_PRIVATE);
            prefs.edit()
                .putString("userId", userId != null ? userId : "AUTO_ACTIVE_USER")
                .putBoolean("enabled", enabled)
                .apply();

            if (enabled) {
                if (KaChingNotificationListener.instance == null) {
                    ensureListenerRebound();
                } else {
                    KaChingNotificationListener.instance.scanCurrentActiveNotifications();
                }
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void scanActiveNotifications(Promise promise) {
        try {
            if (KaChingNotificationListener.instance != null) {
                KaChingNotificationListener.instance.scanCurrentActiveNotifications();
                promise.resolve(true);
            } else {
                ensureListenerRebound();
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.resolve(false);
        }
    }
}
`;

const KACHING_PACKAGE_JAVA = `package com.dggan.kaching;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class KaChingAutoCapturePackage implements ReactPackage {
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new KaChingAutoCaptureModule(reactContext));
        return modules;
    }
}
`;

module.exports = function withAndroidNotificationListener(config) {
  config = withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const pkgDir = path.join(modConfig.modRequest.platformProjectRoot, "app", "src", "main", "java", "com", "dggan", "kaching");
      fs.mkdirSync(pkgDir, { recursive: true });
      fs.writeFileSync(path.join(pkgDir, "KaChingNotificationListener.java"), KACHING_LISTENER_JAVA, "utf8");
      fs.writeFileSync(path.join(pkgDir, "KaChingAutoCaptureModule.java"), KACHING_MODULE_JAVA, "utf8");
      fs.writeFileSync(path.join(pkgDir, "KaChingAutoCapturePackage.java"), KACHING_PACKAGE_JAVA, "utf8");
      return modConfig;
    },
  ]);

  config = withMainApplication(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes("KaChingAutoCapturePackage")) {
      if (contents.includes("PackageList(this).packages.apply {")) {
        contents = contents.replace(
          "PackageList(this).packages.apply {",
          "PackageList(this).packages.apply {\n              add(KaChingAutoCapturePackage())",
        );
      } else if (contents.includes("List<ReactPackage> packages = new PackageList(this).getPackages();")) {
        contents = contents.replace(
          "List<ReactPackage> packages = new PackageList(this).getPackages();",
          "List<ReactPackage> packages = new PackageList(this).getPackages();\n      packages.add(new KaChingAutoCapturePackage());",
        );
      }
      modConfig.modResults.contents = contents;
    }
    return modConfig;
  });

  return withAndroidManifest(config, async (modConfig) => {
    const androidManifest = modConfig.modResults;
    const manifestRoot = androidManifest.manifest;
    const mainApp = manifestRoot?.application?.[0];
    if (!mainApp) return modConfig;

    if (!manifestRoot["uses-permission"]) {
      manifestRoot["uses-permission"] = [];
    }
    const hasQueryAll = manifestRoot["uses-permission"].some((p) => p.$?.["android:name"] === "android.permission.QUERY_ALL_PACKAGES");
    if (!hasQueryAll) {
      manifestRoot["uses-permission"].push({
        $: { "android:name": "android.permission.QUERY_ALL_PACKAGES" },
      });
    }

    const financePackages = [
      "my.com.tngdigital.ewallet",
      "com.maybank2u.life",
      "com.grabtaxi.passenger",
      "com.cimbmalaysia.clicks",
      "com.cimbmalaysia.cimbclicks",
      "com.pbbank.PBeM",
      "com.pbbank.mypb",
      "com.rhbgroup.rhbmobilebanking",
      "my.com.hongleongconnect.mobileconnect",
      "my.com.boost",
      "com.shopee.my",
      "com.gxbank.app",
    ];
    if (!manifestRoot.queries) {
      manifestRoot.queries = [{ package: [] }];
    }
    if (!manifestRoot.queries[0].package) {
      manifestRoot.queries[0].package = [];
    }
    for (const pkgName of financePackages) {
      const pkgExists = manifestRoot.queries[0].package.some((p) => p.$?.["android:name"] === pkgName);
      if (!pkgExists) {
        manifestRoot.queries[0].package.push({
          $: { "android:name": pkgName },
        });
      }
    }

    if (!mainApp.service) {
      mainApp.service = [];
    }
    const serviceName = ".KaChingNotificationListener";
    const exists = mainApp.service.some((s) => s.$?.["android:name"] === serviceName);
    if (!exists) {
      mainApp.service.push({
        $: {
          "android:name": serviceName,
          "android:label": "Ka-Ching!",
          "android:permission": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.service.notification.NotificationListenerService",
                },
              },
            ],
          },
        ],
      });
    }

    return modConfig;
  });
};
