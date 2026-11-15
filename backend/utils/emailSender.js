/**
 * @file backend/utils/emailSender.js
 * @description Sends branded pure-HTML password-reset OTP emails via Nodemailer (Gmail SMTP) with zero file/image attachments. Throws a service-unavailable error if SMTP credentials are not configured.
 */

const nodemailer = require("nodemailer");

/**
 * @param {string} username - Recipient's display name
 * @param {string} otpCode - 6-digit verification code
 */
const buildResetOtpEmailHtml = (username, otpCode) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ka-Ching! Password Reset</title>
</head>
<body style="margin:0;padding:24px;background-color:#F1ECE5;font-family:'Courier New',Courier,monospace;color:#2C2519;">
  <div style="max-width:460px;margin:0 auto;background-color:#FAF7F2;border:2px solid #2C2519;border-radius:14px;padding:24px;">
    
    <!-- Top Pure-CSS Brand Header (No Image Attachment Required) -->
    <div style="border-bottom:2px dashed #C7B9A5;padding-bottom:16px;margin-bottom:18px;text-align:center;">
      <div style="display:inline-block;background-color:#FDF2C5;border:2px solid #2C2519;border-radius:14px;padding:8px 16px;margin-bottom:10px;font-size:18px;font-weight:bold;letter-spacing:1px;color:#2C2519;">
        KA-CHING!
      </div>
      <p style="margin:0;font-size:11px;color:#7A6C58;font-weight:bold;letter-spacing:0.8px;">
        ACCOUNT SECURITY &amp; PASSWORD RECOVERY
      </p>
    </div>

    <!-- Greeting & Instructions -->
    <p style="font-size:13px;line-height:1.6;margin:0 0 12px;color:#2C2519;">
      Hi <strong>${username}</strong>,
    </p>
    <p style="font-size:12px;line-height:1.6;color:#5F4E34;margin:0 0 18px;">
      We received a request to reset the password for your Ka-Ching! account. Enter the 6-digit verification code below inside the app:
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
      If you did not request a password reset, you can safely ignore this email. Your account and financial records remain secure.
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
 * Checks whether SMTP email service is configured in backend/.env.
 */
exports.isEmailServiceConfigured = () => {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  return Boolean(smtpUser && smtpPass);
};

/**
 * Sends the 6-digit password reset OTP email via Gmail SMTP.
 * Throws an error if SMTP is not configured or if delivery fails.
 */
exports.sendPasswordResetEmail = async ({ toEmail, username, otpCode }) => {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (!smtpUser || !smtpPass) {
    const configErr = new Error("Password recovery email service is currently unavailable.");
    configErr.code = "EMAIL_SERVICE_UNAVAILABLE";
    throw configErr;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: `"Ka-Ching!" <${smtpUser}>`,
    to: toEmail,
    subject: `[Ka-Ching!] ${otpCode} is your password reset code`,
    html: buildResetOtpEmailHtml(username, otpCode),
  });

  return {
    deliveredVia: "SMTP_EMAIL",
  };
};
