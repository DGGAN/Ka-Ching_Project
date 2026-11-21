/**
 * @file backend/utils/emailSender.js
 * @description Sends branded pure-HTML OTP emails (Password Reset & New Account Registration Verification) via Brevo HTTPS REST API (Port 443) with zero file/image attachments and structured logger support.
 * @exports isEmailServiceConfigured, sendPasswordResetEmail, sendRegistrationOtpEmail
 */

const axios = require("axios");
const logger = require("./logger");

/**
 * Shared Retro-Modern Khaki pure-HTML Email Template Builder (Zero image attachments)
 * @param {object} options
 * @param {string} options.pageTitle - HTML document title
 * @param {string} options.headerSubtitle - Uppercase subtitle under the KA-CHING! badge
 * @param {string} options.username - Recipient's display name
 * @param {string} options.introText - Primary instruction paragraph
 * @param {string} options.otpCode - 6-digit numeric verification code
 * @param {string} options.securityNotice - Bottom security disclaimer
 */
const buildOtpEmailHtml = ({ pageTitle, headerSubtitle, username, introText, otpCode, securityNotice }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
</head>
<body style="margin:0;padding:24px;background-color:#F1ECE5;font-family:'Courier New',Courier,monospace;color:#2C2519;">
  <div style="max-width:460px;margin:0 auto;background-color:#FAF7F2;border:2px solid #2C2519;border-radius:14px;padding:24px;">

    <!-- Top Pure-CSS Brand Header (Zero Image Attachments) -->
    <div style="border-bottom:2px dashed #C7B9A5;padding-bottom:16px;margin-bottom:18px;text-align:center;">
      <div style="display:inline-block;background-color:#FDF2C5;border:2px solid #2C2519;border-radius:14px;padding:8px 16px;margin-bottom:10px;font-size:18px;font-weight:bold;letter-spacing:1px;color:#2C2519;">
        KA-CHING!
      </div>
      <p style="margin:0;font-size:11px;color:#7A6C58;font-weight:bold;letter-spacing:0.8px;">
        ${headerSubtitle}
      </p>
    </div>

    <!-- Greeting & Instructions -->
    <p style="font-size:13px;line-height:1.6;margin:0 0 12px;color:#2C2519;">
      Hi <strong>${username}</strong>,
    </p>
    <p style="font-size:12px;line-height:1.6;color:#5F4E34;margin:0 0 18px;">
      ${introText}
    </p>

    <!-- 6-Digit OTP Box -->
    <div style="background-color:#F1ECE5;border:2px solid #5F4E34;border-radius:10px;padding:16px;text-align:center;margin:0 0 18px;">
      <div style="font-size:10px;color:#7A6C58;letter-spacing:1.5px;margin-bottom:6px;font-weight:bold;">
        VERIFICATION CODE (VALID FOR 10 MINS)
      </div>
      <div style="font-size:28px;font-weight:bold;letter-spacing:8px;color:#2C2519;">
        ${otpCode}
      </div>
    </div>

    <!-- Security Notice -->
    <p style="font-size:11px;line-height:1.5;color:#7A6C58;margin:0 0 16px;">
      ${securityNotice}
    </p>

    <!-- Footer -->
    <div style="border-top:1.5px dashed #C7B9A5;padding-top:12px;text-align:center;font-size:10px;color:#7A6C58;">
      Automated security message from Ka-Ching! &bull; Please do not reply to this email
    </div>
  </div>
</body>
</html>
`;

/**
 * Checks whether Brevo HTTPS API is configured in environment variables.
 */
exports.isEmailServiceConfigured = () => {
  return Boolean(process.env.BREVO_API_KEY?.trim());
};

/**
 * Unified email dispatcher via Brevo HTTPS REST API (Port 443 — works on both localhost and Render Free Tier).
 */
const dispatchEmail = async ({ toEmail, subject, html, unavailableMsg, logLabel }) => {
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.APP_SUPPORT_EMAIL.trim();

  if (!brevoKey) {
    logger.warn("EMAIL_OTP", "BREVO_API_KEY is missing in environment variables");
    const configErr = new Error(unavailableMsg);
    configErr.code = "EMAIL_SERVICE_UNAVAILABLE";
    throw configErr;
  }

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Ka-Ching!", email: senderEmail },
        to: [{ email: toEmail }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": brevoKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        timeout: 10000,
      },
    );

    logger.info("EMAIL_OTP", `${logLabel} sent via Brevo HTTPS API to ${toEmail}`);
    return { deliveredVia: "BREVO_HTTPS_API" };
  } catch (apiErr) {
    const apiDetail = apiErr.response?.data || apiErr.message;
    logger.error("EMAIL_OTP", `Brevo HTTPS API failed for ${toEmail}`, apiDetail);
    throw apiErr;
  }
};

/**
 * Sends the 6-digit password reset OTP email.
 */
exports.sendPasswordResetEmail = async ({ toEmail, username, otpCode }) => {
  const html = buildOtpEmailHtml({
    pageTitle: "Ka-Ching! Password Reset",
    headerSubtitle: "ACCOUNT SECURITY &amp; PASSWORD RECOVERY",
    username,
    introText: "We received a request to reset the password for your Ka-Ching! account. Enter the 6-digit verification code below inside the app:",
    otpCode,
    securityNotice: "If you did not request a password reset, you can safely ignore this email. Your account and financial records remain secure.",
  });

  return dispatchEmail({
    toEmail,
    subject: `[Ka-Ching!] ${otpCode} is your password reset code`,
    html,
    unavailableMsg: "Password recovery email service is currently unavailable.",
    logLabel: "Password reset OTP email",
  });
};

/**
 * Sends the 6-digit email verification OTP for new user registration.
 */
exports.sendRegistrationOtpEmail = async ({ toEmail, username, otpCode }) => {
  const html = buildOtpEmailHtml({
    pageTitle: "Welcome to Ka-Ching! — Verify Your Email",
    headerSubtitle: "WELCOME TO KA-CHING! &bull; EMAIL VERIFICATION",
    username,
    introText:
      "Thanks for signing up for Ka-Ching! To finish creating your account and verify your email address, enter the 6-digit code below inside the app:",
    otpCode,
    securityNotice: "If you did not attempt to create a Ka-Ching! account, you can safely ignore this email and no account will be created.",
  });

  return dispatchEmail({
    toEmail,
    subject: `[Ka-Ching!] ${otpCode} is your verification code`,
    html,
    unavailableMsg: "Verification email service is currently unavailable.",
    logLabel: "Registration OTP email",
  });
};
