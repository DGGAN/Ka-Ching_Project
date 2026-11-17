/**
 * @file frontend/plugins/withAndroidNotificationListener.js
 * @description Expo Config Plugin that registers RNAndroidNotificationListener service and BIND_NOTIFICATION_LISTENER_SERVICE permission in AndroidManifest.xml so Ka-Ching! appears directly in Android Settings -> Special App Access -> Notification Access.
 */

const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidNotificationListener(config) {
  return withAndroidManifest(config, async (modConfig) => {
    const androidManifest = modConfig.modResults;
    const mainApp = androidManifest.manifest.application?.[0];
    if (!mainApp) return modConfig;

    if (!mainApp.service) {
      mainApp.service = [];
    }

    const listenerServiceName = "com.lesimoes.androidnotificationlistener.RNAndroidNotificationListener";
    const headlessServiceName = "com.lesimoes.androidnotificationlistener.RNAndroidNotificationListenerHeadlessJsTaskService";

    // 1. Register the main NotificationListenerService so Ka-Ching! appears in Android "Notification Access" Settings
    const hasListenerService = mainApp.service.some((s) => s.$?.["android:name"] === listenerServiceName);

    if (!hasListenerService) {
      mainApp.service.push({
        $: {
          "android:name": listenerServiceName,
          "android:label": "Ka-Ching! Smart Auto-Capture",
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

    // 2. Register the HeadlessJS task service so background payment alerts are forwarded to JS
    const hasHeadlessService = mainApp.service.some((s) => s.$?.["android:name"] === headlessServiceName);

    if (!hasHeadlessService) {
      mainApp.service.push({
        $: {
          "android:name": headlessServiceName,
          "android:exported": "false",
        },
      });
    }

    return modConfig;
  });
};
