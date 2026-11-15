/**
 * @file backend/utils/logger.js
 * @description Clean, environment-aware logger for development and production.
 * Prints verbose debug logs only in development mode or when DEBUG_LOGS=true.
 */

const ENV = process.env.NODE_ENV || "development";
const IS_PROD = ENV === "production";

const isDebugEnabled = () => !IS_PROD || process.env.DEBUG_LOGS === "true";

const getTimestamp = () => new Date().toISOString();

const logger = {
  env: ENV,
  isProd: IS_PROD,
  isDebugEnabled,

  // Standard operational milestones (Always printed)
  info: (tag, message, meta = "") => {
    console.log(`[${getTimestamp()}] [INFO] [${tag}] ${message}`, meta);
  },

  // Verbose payload/step tracing (Only printed in dev OR when DEBUG_LOGS=true)
  debug: (tag, message, data = "") => {
    if (isDebugEnabled()) {
      console.log(`[${getTimestamp()}] [DEBUG] [${tag}] ${message}`, data);
    }
  },

  // Non-fatal warnings or fallback triggers (Always printed)
  warn: (tag, message, meta = "") => {
    console.warn(`[${getTimestamp()}] [WARN] [${tag}] ${message}`, meta);
  },

  // Errors (Full stack in dev/debug mode; concise message in production)
  error: (tag, message, err) => {
    if (isDebugEnabled() && err) {
      console.error(`[${getTimestamp()}] [ERROR] [${tag}] ${message}:`, err);
    } else {
      console.error(`[${getTimestamp()}] [ERROR] [${tag}] ${message}:`, err?.message || err || "");
    }
  },
};

module.exports = logger;
