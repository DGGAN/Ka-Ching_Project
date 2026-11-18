/**
 * @file frontend/plugins/withAndroidNotificationListener.js
 * @description Self-contained Expo Config Plugin that injects a pure Android Java NotificationListenerService (KaChingNotificationListener) AND a React Native bridge module (KaChingAutoCaptureModule) with ZERO third-party npm dependencies.
 */

const { withAndroidManifest, withDangerousMod, withMainApplication } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const KACHING_LISTENER_JAVA = `package com.dggan.kaching;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class KaChingNotificationListener extends NotificationListenerService {
    private static final String TAG = "KaChingNotifListener";
    private static final String BACKEND_URL = "https://kaching-backend-27o2.onrender.com/api/transactions/auto-capture";
    public static KaChingNotificationListener instance = null;

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        instance = this;
        Log.i(TAG, "Ka-Ching! Native NotificationListenerService CONNECTED");
        scanCurrentActiveNotifications();
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
        try {
            StatusBarNotification[] activeList = getActiveNotifications();
            if (activeList == null) return;
            for (StatusBarNotification sbn : activeList) {
                extractAndForwardNotification(sbn);
            }
        } catch (Exception e) {
            Log.e(TAG, "scanCurrentActiveNotifications error", e);
        }
    }

    private void extractAndForwardNotification(StatusBarNotification sbn) {
        try {
            Notification notif = sbn.getNotification();
            if (notif == null) return;

            String pkg = sbn.getPackageName() != null ? sbn.getPackageName() : "";
            String pkgLower = pkg.toLowerCase();

            // Ignore Ka-Ching!'s own notifications
            if (pkgLower.contains("com.dggan.kaching")) {
                return;
            }

            Bundle extras = notif.extras;
            String title = "";
            StringBuilder textBuilder = new StringBuilder();

            if (extras != null) {
                CharSequence t1 = extras.getCharSequence(Notification.EXTRA_TITLE);
                if (t1 != null) title = t1.toString().trim();

                CharSequence t2 = extras.getCharSequence(Notification.EXTRA_TITLE_BIG);
                if (title.isEmpty() && t2 != null) title = t2.toString().trim();

                CharSequence csText = extras.getCharSequence(Notification.EXTRA_TEXT);
                if (csText != null) textBuilder.append(csText.toString()).append(" ");

                CharSequence csBig = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
                if (csBig != null) textBuilder.append(csBig.toString()).append(" ");

                CharSequence csSub = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);
                if (csSub != null) textBuilder.append(csSub.toString()).append(" ");

                CharSequence csSum = extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT);
                if (csSum != null) textBuilder.append(csSum.toString()).append(" ");

                CharSequence csInfo = extras.getCharSequence(Notification.EXTRA_INFO_TEXT);
                if (csInfo != null) textBuilder.append(csInfo.toString()).append(" ");

                CharSequence[] lines = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
                if (lines != null) {
                    for (CharSequence line : lines) {
                        if (line != null) textBuilder.append(line.toString()).append(" ");
                    }
                }
            }

            if (notif.tickerText != null) {
                textBuilder.append(notif.tickerText.toString()).append(" ");
            }

            String text = textBuilder.toString().trim();
            String combined = (title + " " + text).trim();
            if (combined.isEmpty() || title.toLowerCase().contains("ka-ching")) return;

            String combinedLower = combined.toLowerCase();
            boolean hasPaymentSignal = combinedLower.contains("rm") ||
                    combinedLower.contains("myr") ||
                    combinedLower.contains("paid") ||
                    combinedLower.contains("transfer") ||
                    combinedLower.contains("received") ||
                    combinedLower.contains("payment") ||
                    combinedLower.contains("duitnow") ||
                    combinedLower.matches(".*\\\\d+\\\\.\\\\d{2}.*");

            boolean isFinanceApp = pkgLower.contains("tng") ||
                    pkgLower.contains("touchngo") ||
                    pkgLower.contains("maybank") ||
                    pkgLower.contains("mae") ||
                    pkgLower.contains("grab") ||
                    pkgLower.contains("cimb") ||
                    pkgLower.contains("publicbank") ||
                    pkgLower.contains("pbengage") ||
                    pkgLower.contains("rhb") ||
                    pkgLower.contains("hlb") ||
                    pkgLower.contains("hongleong") ||
                    pkgLower.contains("ambank") ||
                    pkgLower.contains("bankislam") ||
                    pkgLower.contains("boost") ||
                    pkgLower.contains("shopee") ||
                    pkgLower.contains("bigpay") ||
                    pkgLower.contains("gxbank") ||
                    pkgLower.contains("aeon") ||
                    pkgLower.contains("duitnow");

            if (!hasPaymentSignal && !isFinanceApp) return;

            SharedPreferences prefs = getApplicationContext().getSharedPreferences("KaChingAutoCapturePrefs", Context.MODE_PRIVATE);
            String savedUserId = prefs.getString("userId", "AUTO_ACTIVE_USER");

            final String finalUserId = (savedUserId == null || savedUserId.isEmpty()) ? "AUTO_ACTIVE_USER" : savedUserId;
            final String finalTitle = title.isEmpty() ? "Payment Notification" : title;
            final String finalText = text.isEmpty() ? combined : text;
            final String finalPkg = pkg;

            new Thread(() -> postToRenderBackend(finalUserId, finalTitle, finalText, finalPkg)).start();
        } catch (Exception e) {
            Log.e(TAG, "extractAndForwardNotification error", e);
        }
    }

    private void postToRenderBackend(String userId, String title, String text, String packageName) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(BACKEND_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(60000);
            conn.setReadTimeout(60000);
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
        } catch (Exception e) {
            Log.e(TAG, "POST /transactions/auto-capture failed", e);
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
`;

const KACHING_MODULE_JAVA = `package com.dggan.kaching;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;

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

    @ReactMethod
    public void getPermissionStatus(Promise promise) {
        try {
            String pkgName = reactContext.getPackageName();
            String flat = Settings.Secure.getString(reactContext.getContentResolver(), "enabled_notification_listeners");
            boolean granted = flat != null && flat.contains(pkgName);
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
        } catch (Exception ignored) {
        }
    }

    @ReactMethod
    public void setActiveUser(String userId, boolean enabled, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("KaChingAutoCapturePrefs", Context.MODE_PRIVATE);
            prefs.edit()
                .putString("userId", userId != null ? userId : "AUTO_ACTIVE_USER")
                .putBoolean("enabled", enabled)
                .apply();

            if (enabled && KaChingNotificationListener.instance != null) {
                KaChingNotificationListener.instance.scanCurrentActiveNotifications();
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
  // 1. Write the 3 pure Java files into android/app/src/main/java/com/dggan/kaching/
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

  // 2. Register KaChingAutoCapturePackage in MainApplication.kt / MainApplication.java
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

  // 3. Register KaChingNotificationListener service in AndroidManifest.xml
  return withAndroidManifest(config, async (modConfig) => {
    const androidManifest = modConfig.modResults;
    const manifestRoot = androidManifest.manifest;
    const mainApp = manifestRoot?.application?.[0];
    if (!mainApp) return modConfig;

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
