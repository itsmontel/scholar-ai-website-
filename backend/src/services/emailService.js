const nodemailer = require('nodemailer');

/* ═══════════════════════════════════════════════════════════════
   Email service — WriteScholar purple brand templates.

   Design tokens match the web app:
   - Dominant purple (#A560E8 / #7733B5 / #8A48C7 / #B57AF0)
   - Soft lavender page wash (#FAF7FF) + white cards
   - Nunito heading font (with web-safe fallbacks)
   - Chunky border-bottom 4px borders for buttons + cards
   - Feature-row "green/blue/orange" keys are purple shade aliases
     so older call sites stay purple-only without rainbow accents
   ═══════════════════════════════════════════════════════════════ */

const EMAIL_COLORS = {
  /* Page + cards — soft lavender wash, matches onboarding/dashboard */
  bg: '#FAF7FF',
  white: '#FFFFFF',
  surfaceSoft: '#FBF8FF',
  /* Primary brand purple */
  purple: '#A560E8',
  purpleDark: '#7733B5',
  purpleSoft: '#F3EAFF',
  /* Mid / light purple shades (legacy keys → purple-only palette) */
  green: '#8A48C7',
  greenDark: '#7733B5',
  greenSoft: '#E9DBFF',
  blue: '#B57AF0',
  blueDark: '#8A48C7',
  blueSoft: '#F7F0FF',
  orange: '#A560E8',
  orangeDark: '#7733B5',
  orangeSoft: '#F3EAFF',
  /* Red reserved for genuine error states only */
  red: '#FF4B4B',
  redDark: '#E04343',
  redSoft: '#FFE8E8',
  /* Text + borders */
  text: '#3C3C3C',
  textMuted: '#78716c',
  textFaint: '#a8a29e',
  border: '#E5D4F5',
  borderDark: '#D4B8ED',
};

/* Web-safe Nunito stack (Gmail / Outlook ignore @import; we still
   include a Google Fonts link for clients that honour it). */
const NUNITO_STACK = "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/**
 * Email assets need a publicly-reachable URL — recipients on Gmail / Outlook
 * can't load `localhost:5173/mascot.png`. We separate:
 *   - `frontendUrl` (used for clickable links in the email body — localhost
 *     is fine in dev, recipients are usually the developer themselves)
 *   - `assetBase`  (used for <img src=...> — must be public; falls back to
 *     production if FRONTEND_URL points at localhost or isn't set)
 *
 * Also use `mascot-sm.png` (138 KB) instead of `mascot.png` (1.4 MB) — many
 * email clients silently fail to render images >1 MB.
 */
const PUBLIC_ASSET_FALLBACK = 'https://writescholar.com';

function getEmailAssets() {
  const rawFrontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const explicitAsset = (process.env.EMAIL_ASSET_URL || '').replace(/\/$/, '');

  /* Pick a host that the recipient can actually reach. */
  let assetBase = explicitAsset || rawFrontend;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(assetBase)) {
    assetBase = PUBLIC_ASSET_FALLBACK;
  }

  return {
    frontendUrl: rawFrontend,
    assetBase,
    /* WriteScholar mascot logo — branded image users recognise from the app. */
    mascotUrl: `${assetBase}/main-logo.png`,
  };
}

/**
 * Top-of-email mascot block — coloured top accent bar, white card with
 * the mascot in a coloured ring frame, then the eyebrow tagline.
 */
function emailHeaderBlock(titleTagline, { mascotUrl, accentColor, accentSoft }) {
  const color = accentColor || EMAIL_COLORS.purple;
  const soft = accentSoft || EMAIL_COLORS.purpleSoft;
  return `
                    <tr>
                      <td style="padding: 0; height: 8px; line-height: 8px; font-size: 0; background-color: ${color};">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color: ${EMAIL_COLORS.white}; padding: 32px 32px 22px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 14px;">
                          <tr>
                            <td align="center" style="background-color: ${soft}; border: 4px solid ${color}; border-radius: 64px; padding: 8px;">
                              <img src="${mascotUrl}" alt="WriteScholar mascot" width="80" height="80" style="display: block; border-radius: 50%; background-color: ${EMAIL_COLORS.white};" />
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0; font-size: 11px; font-weight: 800; color: ${color}; letter-spacing: 0.2em; text-transform: uppercase; font-family: ${NUNITO_STACK};">${titleTagline}</p>
                      </td>
                    </tr>`;
}

/**
 * Reusable chunky CTA button. Accent defaults to brand purple.
 */
function ctaButton(href, label, accentColor, accentDark) {
  const bg = accentColor || EMAIL_COLORS.purple;
  const border = accentDark || EMAIL_COLORS.purpleDark;
  return `
                            <a href="${href}"
                               style="display: inline-block;
                                      background-color: ${bg};
                                      color: ${EMAIL_COLORS.white};
                                      font-size: 15px;
                                      font-weight: 800;
                                      font-family: ${NUNITO_STACK};
                                      text-decoration: none;
                                      padding: 14px 36px;
                                      border-radius: 14px;
                                      border: 2px solid ${border};
                                      border-bottom: 4px solid ${border};
                                      letter-spacing: 0.04em;
                                      text-transform: uppercase;
                                      mso-padding-alt: 14px 36px;">
                              ${label}
                            </a>`;
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const hasValidConfig = process.env.EMAIL_HOST &&
                          process.env.EMAIL_USER &&
                          process.env.EMAIL_PASS &&
                          process.env.EMAIL_USER !== 'your_email@gmail.com' &&
                          process.env.EMAIL_PASS !== 'your_app_password';

    console.log('📧 Email Configuration Check:');
    console.log(`   HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
    console.log(`   PORT: ${process.env.EMAIL_PORT || '587 (default)'}`);
    console.log(`   USER: ${process.env.EMAIL_USER ? '*** (hidden)' : 'NOT SET'}`);
    console.log(`   PASS: ${process.env.EMAIL_PASS ? '****' : 'NOT SET'}`);
    console.log(`   FROM: ${process.env.EMAIL_FROM || (process.env.EMAIL_USER ? '*** (hidden)' : 'NOT SET')}`);
    console.log(`   REPLY_TO: ${process.env.EMAIL_REPLY_TO || 'support@writescholar.com'}`);
    console.log(`   Valid Config: ${hasValidConfig ? 'YES' : 'NO'}`);

    if (hasValidConfig) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      this.transporter.verify((error, _success) => {
        if (error) {
          console.log('❌ Email service configuration error:', error.message);
          console.log('   Full error:', error);
          console.log('📧 Email verification links will be logged to console instead');
          this.transporter = null;
        } else {
          console.log('✅ Email service is ready to send messages');
        }
      });
    } else {
      console.log('📧 Email service not configured. Verification links will be logged to console.');
      console.log('💡 To enable email sending, update EMAIL_* variables in .env file');
      console.log('📖 See EMAIL_SETUP.md for configuration instructions');
    }
  }

  async sendVerificationEmail(email, verificationToken) {
    console.log(`📧 Attempting to send verification email to: ${email}`);

    if (!this.transporter) {
      const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/verify-email?token=${verificationToken}`;

      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL VERIFICATION (Development Mode - No transporter)');
      console.log('='.repeat(80));
      console.log(`📬 To: ${email}`);
      console.log(`🔗 Verification Link: ${verificationUrl}`);
      console.log(`⏰ Token: ${verificationToken}`);
      console.log('='.repeat(80));
      console.log('💡 To enable real email sending, configure EMAIL_* variables in .env');
      console.log('📖 See EMAIL_SETUP.md for setup instructions');
      console.log('='.repeat(80) + '\n');

      return { success: true, message: 'Email service not configured - verification link logged to console' };
    }

    try {
      const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/verify-email?token=${verificationToken}`;
      console.log(`📧 Verification URL: ${verificationUrl}`);
      const { mascotUrl } = getEmailAssets();

      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const replyToAddress = process.env.EMAIL_REPLY_TO || 'support@writescholar.com';
      const mailOptions = {
        from: `"WriteScholar" <${fromAddress}>`,
        to: email,
        replyTo: replyToAddress,
        subject: 'Verify Your WriteScholar Account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.bg}; font-family: ${NUNITO_STACK};">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.bg};">
              <tr>
                <td align="center" style="padding: 36px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: ${EMAIL_COLORS.white}; border-radius: 18px; overflow: hidden; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                    ${emailHeaderBlock('Verify your email', { mascotUrl, accentColor: EMAIL_COLORS.purple, accentSoft: EMAIL_COLORS.purpleSoft })}

                    <!-- Main content -->
                    <tr>
                      <td style="padding: 8px 32px 28px;">
                        <h1 style="margin: 0 0 10px 0; font-family: ${NUNITO_STACK}; font-size: 26px; font-weight: 800; color: ${EMAIL_COLORS.text}; text-align: center; letter-spacing: -0.01em; line-height: 1.2;">Almost there!</h1>
                        <p style="margin: 0 0 24px 0; font-size: 15px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.55;">
                          Confirm your email and unlock your full WriteScholar toolkit — essay analysis, study packs, citations, and games.
                        </p>

                        <!-- Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 4px 0 26px 0;">
                              ${ctaButton(verificationUrl, 'Verify email')}
                            </td>
                          </tr>
                        </table>

                        <!-- Fallback link -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="border-top: 2px solid ${EMAIL_COLORS.border}; padding-top: 20px;">
                              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: ${EMAIL_COLORS.textMuted}; text-align: center; text-transform: uppercase; letter-spacing: 0.12em;">Or copy this link</p>
                              <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; word-break: break-all; text-align: center; background-color: ${EMAIL_COLORS.surfaceSoft}; padding: 12px 14px; border-radius: 12px; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 3px solid ${EMAIL_COLORS.border};">
                                ${verificationUrl}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Expiry / dismiss -->
                    <tr>
                      <td style="background-color: ${EMAIL_COLORS.surfaceSoft}; padding: 20px 32px; border-top: 2px solid ${EMAIL_COLORS.border};">
                        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: ${EMAIL_COLORS.textMuted}; text-align: center;">
                          ⏳ This link expires in 24 hours.
                        </p>
                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center;">
                          Didn't sign up for WriteScholar? You can ignore this email.
                        </p>
                      </td>
                    </tr>

                    <!-- Brand footer -->
                    <tr>
                      <td style="padding: 16px 32px 22px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: ${EMAIL_COLORS.textFaint}; letter-spacing: 0.04em;">
                          © 2026 WriteScholar · AI toolkit for students
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      console.log(`📧 Sending email from: ${process.env.EMAIL_FROM ? `WriteScholar <${fromAddress}>` : '*** (hidden)'}`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully!');
      console.log(`   📬 To: ${email}`);
      console.log(`   📨 Message ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:');
      console.error(`   Error: ${error.message}`);
      console.error(`   Code: ${error.code || 'N/A'}`);
      console.error(`   Response: ${error.response || 'N/A'}`);
      if (error.responseCode) {
        console.error(`   Response Code: ${error.responseCode}`);
      }
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email, resetToken) {
    if (!this.transporter) {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      console.log('\n' + '='.repeat(80));
      console.log('🔐 PASSWORD RESET (Development Mode)');
      console.log('='.repeat(80));
      console.log(`📬 To: ${email}`);
      console.log(`🔗 Reset Link: ${resetUrl}`);
      console.log(`⏰ Token: ${resetToken}`);
      console.log('='.repeat(80));
      console.log('💡 To enable real email sending, configure EMAIL_* variables in .env');
      console.log('='.repeat(80) + '\n');

      return { success: true, message: 'Email service not configured - reset link logged to console' };
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      const { mascotUrl } = getEmailAssets();

      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const replyToAddress = process.env.EMAIL_REPLY_TO || 'support@writescholar.com';
      const mailOptions = {
        from: `"WriteScholar" <${fromAddress}>`,
        to: email,
        replyTo: replyToAddress,
        subject: 'Reset Your WriteScholar Password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.bg}; font-family: ${NUNITO_STACK};">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.bg};">
              <tr>
                <td align="center" style="padding: 36px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: ${EMAIL_COLORS.white}; border-radius: 18px; overflow: hidden; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                    ${emailHeaderBlock('Password reset', { mascotUrl, accentColor: EMAIL_COLORS.purple, accentSoft: EMAIL_COLORS.purpleSoft })}

                    <!-- Main content -->
                    <tr>
                      <td style="padding: 8px 32px 28px;">
                        <!-- Secure-link badge -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                          <tr>
                            <td align="center">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="background-color: ${EMAIL_COLORS.purpleSoft}; border: 2px solid ${EMAIL_COLORS.purple}; border-radius: 999px; padding: 6px 14px;">
                                    <span style="font-family: ${NUNITO_STACK}; font-size: 11px; font-weight: 800; color: ${EMAIL_COLORS.purpleDark}; letter-spacing: 0.14em; text-transform: uppercase;">🔒 Secure link</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <h1 style="margin: 0 0 10px 0; font-family: ${NUNITO_STACK}; font-size: 26px; font-weight: 800; color: ${EMAIL_COLORS.text}; text-align: center; letter-spacing: -0.01em; line-height: 1.2;">Reset your password</h1>
                        <p style="margin: 0 0 24px 0; font-size: 15px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.55;">
                          We got a request to reset your password. Tap below to choose a new one — should only take a sec.
                        </p>

                        <!-- Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 4px 0 26px 0;">
                              ${ctaButton(resetUrl, 'Reset password', EMAIL_COLORS.purple, EMAIL_COLORS.purpleDark)}
                            </td>
                          </tr>
                        </table>

                        <!-- Fallback link -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="border-top: 2px solid ${EMAIL_COLORS.border}; padding-top: 20px;">
                              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: ${EMAIL_COLORS.textMuted}; text-align: center; text-transform: uppercase; letter-spacing: 0.12em;">Or copy this link</p>
                              <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; word-break: break-all; text-align: center; background-color: ${EMAIL_COLORS.surfaceSoft}; padding: 12px 14px; border-radius: 12px; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 3px solid ${EMAIL_COLORS.border};">
                                ${resetUrl}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Expiry / safety note -->
                    <tr>
                      <td style="background-color: ${EMAIL_COLORS.surfaceSoft}; padding: 20px 32px; border-top: 2px solid ${EMAIL_COLORS.border};">
                        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: ${EMAIL_COLORS.textMuted}; text-align: center;">
                          ⏳ This link expires in 1 hour.
                        </p>
                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center;">
                          Didn't request this? Your password is safe — just ignore this email.
                        </p>
                      </td>
                    </tr>

                    <!-- Brand footer -->
                    <tr>
                      <td style="padding: 16px 32px 22px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: ${EMAIL_COLORS.textFaint}; letter-spacing: 0.04em;">
                          © 2026 WriteScholar · AI toolkit for students
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent to:', email);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email) {
    if (!this.transporter) {
      console.log('📧 Welcome email would be sent to:', email);
      return { success: true, message: 'Email service not configured - welcome email logged to console' };
    }

    try {
      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const replyToAddress = process.env.EMAIL_REPLY_TO || 'support@writescholar.com';
      const { frontendUrl, mascotUrl } = getEmailAssets();
      const pdfUrl = `${frontendUrl}/downloads/writescholar-ultimate-study-tips-guide.pdf`;
      const loginUrl = `${frontendUrl}/login`;

      /* Feature row palette — each tool gets its own Duolingo colour. */
      const features = [
        { emoji: '📝', title: 'Essay analysis',  desc: 'Line-by-line feedback & rubric scores',     color: EMAIL_COLORS.purple, soft: EMAIL_COLORS.purpleSoft, dark: EMAIL_COLORS.purpleDark },
        { emoji: '📚', title: 'Daily Review',    desc: 'Personalised quizzes from your notes',     color: EMAIL_COLORS.green,  soft: EMAIL_COLORS.greenSoft,  dark: EMAIL_COLORS.greenDark },
        { emoji: '🧠', title: 'Study packs',     desc: 'Flashcards, quizzes, crosswords & games',  color: EMAIL_COLORS.blue,   soft: EMAIL_COLORS.blueSoft,   dark: EMAIL_COLORS.blueDark },
        { emoji: '📖', title: 'Citations',       desc: 'APA, MLA, Chicago — real peer-reviewed',   color: EMAIL_COLORS.orange, soft: EMAIL_COLORS.orangeSoft, dark: EMAIL_COLORS.orangeDark },
      ];

      const featureRowsHtml = features.map((f) => `
                          <tr>
                            <td style="padding: 5px 0;">
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.white}; border-radius: 14px; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                                <tr>
                                  <td width="48" style="padding: 10px 12px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0">
                                      <tr>
                                        <td style="background-color: ${f.soft}; border: 2px solid ${f.color}; border-bottom: 3px solid ${f.dark}; border-radius: 12px; width: 44px; height: 44px; text-align: center; font-size: 22px; line-height: 44px; vertical-align: middle;">
                                          ${f.emoji}
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td style="padding: 10px 14px 10px 4px;">
                                    <p style="margin: 0 0 2px 0; font-family: ${NUNITO_STACK}; font-size: 14px; font-weight: 800; color: ${EMAIL_COLORS.text};">${f.title}</p>
                                    <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; line-height: 1.45;">${f.desc}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>`).join('');

      const mailOptions = {
        from: `"WriteScholar" <${fromAddress}>`,
        to: email,
        replyTo: replyToAddress,
        subject: 'Welcome to WriteScholar! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.bg}; font-family: ${NUNITO_STACK};">
            <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Welcome to WriteScholar — sign in for essay feedback, study packs, citations, and games.</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.bg};">
              <tr>
                <td align="center" style="padding: 36px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: ${EMAIL_COLORS.white}; border-radius: 18px; overflow: hidden; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                    ${emailHeaderBlock('Account ready', { mascotUrl, accentColor: EMAIL_COLORS.purple, accentSoft: EMAIL_COLORS.purpleSoft })}

                    <!-- Main content -->
                    <tr>
                      <td style="padding: 8px 32px 26px;">
                        <h1 style="margin: 0 0 8px 0; font-family: ${NUNITO_STACK}; font-size: 30px; font-weight: 900; color: ${EMAIL_COLORS.text}; text-align: center; letter-spacing: -0.02em; line-height: 1.15;">
                          Welcome to <span style="color: ${EMAIL_COLORS.purple};">WriteScholar!</span>
                        </h1>
                        <p style="margin: 0 0 24px 0; font-size: 15px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.55;">
                          Your AI study toolkit is ready — let's level up your grades. 🎉
                        </p>

                        <!-- Feature rows (chunky cards) -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                          ${featureRowsHtml}
                        </table>

                        <!-- Primary CTA -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 0 0 22px 0;">
                              ${ctaButton(loginUrl, 'Open my dashboard')}
                            </td>
                          </tr>
                        </table>

                        <!-- Free PDF gift -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="background-color: ${EMAIL_COLORS.orangeSoft}; border: 2px solid ${EMAIL_COLORS.orange}; border-bottom: 4px solid ${EMAIL_COLORS.orangeDark}; border-radius: 16px; padding: 0; overflow: hidden;">
                              <div style="padding: 18px 22px 20px;">
                                <p style="margin: 0 0 4px 0; font-family: ${NUNITO_STACK}; font-size: 11px; font-weight: 800; color: ${EMAIL_COLORS.orangeDark}; text-transform: uppercase; letter-spacing: 0.14em; text-align: center;">🎁 Free gift</p>
                                <p style="margin: 0 0 6px 0; font-family: ${NUNITO_STACK}; font-size: 19px; font-weight: 800; color: ${EMAIL_COLORS.text}; text-align: center;">Ultimate Study Tips Guide</p>
                                <p style="margin: 0 0 16px 0; font-size: 13px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.5;">
                                  Active recall, spaced repetition, and practical tips proven to raise grades.
                                </p>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td align="center">
                                      ${ctaButton(pdfUrl, 'Download PDF', EMAIL_COLORS.orange, EMAIL_COLORS.orangeDark)}
                                    </td>
                                  </tr>
                                </table>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Support footer -->
                    <tr>
                      <td style="background-color: ${EMAIL_COLORS.surfaceSoft}; padding: 20px 32px; border-top: 2px solid ${EMAIL_COLORS.border};">
                        <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.55;">
                          Questions? Reply to this email or contact<br>
                          <a href="mailto:support@writescholar.com" style="color: ${EMAIL_COLORS.purple}; font-weight: 800; text-decoration: none;">support@writescholar.com</a>
                        </p>
                      </td>
                    </tr>

                    <!-- Brand footer -->
                    <tr>
                      <td style="padding: 16px 32px 22px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: ${EMAIL_COLORS.textFaint}; letter-spacing: 0.04em;">
                          © 2026 WriteScholar · AI toolkit for students
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to:', email);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /* ─── Trial-ending reminder ───
   *  Fired by the hourly `notifyTrialsEndingSoon` cron in
   *  subscriptionService when a user's 7-day free trial has roughly
   *  24 hours left. Lets them either continue with the auto-renewing
   *  paid plan (no action) or cancel from their account before they
   *  get charged.
   *
   *  @param {string} email     recipient
   *  @param {Object} opts      { firstName, planName, billingLabel,
   *                              firstChargeAmount, firstChargeAt }
   */
  async sendTrialEndingEmail(email, opts = {}) {
    if (!this.transporter) {
      console.log('📧 Trial-ending email would be sent to:', email, opts);
      return { success: true, message: 'Email service not configured - trial-ending email logged to console' };
    }

    try {
      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const replyToAddress = process.env.EMAIL_REPLY_TO || 'support@writescholar.com';
      const { frontendUrl, mascotUrl } = getEmailAssets();
      const accountUrl = `${frontendUrl}/account`;

      const firstName = (opts.firstName || '').trim();
      const greetingName = firstName ? `, ${firstName}` : '';
      const planName = opts.planName || 'Pro';
      const billingLabel = opts.billingLabel || 'plan';
      const firstChargeAmount = opts.firstChargeAmount || '';
      const firstChargeAt = opts.firstChargeAt
        ? new Date(opts.firstChargeAt).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })
        : null;

      // Friendly subject — leads with value, not the charge. The
      // billing detail is in the footer block so it's visible without
      // dominating the message.
      const subjectLine = firstName
        ? `One day left, ${firstName} — let's keep your streak going`
        : `One day left — let's keep your streak going`;

      const dashboardUrl = `${frontendUrl}/dashboard`;

      // What they keep with Pro — short list, all benefits-framed.
      const valueRows = [
        { emoji: '📝', title: 'Full essay rubric',     desc: 'Every analysis stays unlocked — annotations, grade, the lot.', color: EMAIL_COLORS.purple, soft: EMAIL_COLORS.purpleSoft, dark: EMAIL_COLORS.purpleDark },
        { emoji: '🔁', title: 'One-click revisions',   desc: 'Accept a suggested rewrite and it lands in your draft.',       color: EMAIL_COLORS.green,  soft: EMAIL_COLORS.greenSoft,  dark: EMAIL_COLORS.greenDark },
        { emoji: '📚', title: 'Unlimited study packs', desc: 'Notes → flashcards, quizzes and crosswords on tap.',           color: EMAIL_COLORS.blue,   soft: EMAIL_COLORS.blueSoft,   dark: EMAIL_COLORS.blueDark },
      ];
      const valueRowsHtml = valueRows.map((f) => `
                          <tr>
                            <td style="padding: 5px 0;">
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.white}; border-radius: 14px; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                                <tr>
                                  <td width="48" style="padding: 10px 12px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0">
                                      <tr>
                                        <td style="background-color: ${f.soft}; border: 2px solid ${f.color}; border-bottom: 3px solid ${f.dark}; border-radius: 12px; width: 44px; height: 44px; text-align: center; font-size: 22px; line-height: 44px; vertical-align: middle;">
                                          ${f.emoji}
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td style="padding: 10px 14px 10px 4px;">
                                    <p style="margin: 0 0 2px 0; font-family: ${NUNITO_STACK}; font-size: 14px; font-weight: 800; color: ${EMAIL_COLORS.text};">${f.title}</p>
                                    <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; line-height: 1.45;">${f.desc}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>`).join('');

      const mailOptions = {
        from: `"WriteScholar" <${fromAddress}>`,
        to: email,
        replyTo: replyToAddress,
        subject: subjectLine,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.bg}; font-family: ${NUNITO_STACK};">
            <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
              One day left of your WriteScholar trial — keep your full rubric, one-click revisions, and study packs going. Manage or pause anytime.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.bg};">
              <tr>
                <td align="center" style="padding: 36px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: ${EMAIL_COLORS.white}; border-radius: 18px; overflow: hidden; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                    ${emailHeaderBlock('A note about your trial', { mascotUrl, accentColor: EMAIL_COLORS.purple, accentSoft: EMAIL_COLORS.purpleSoft })}

                    <tr>
                      <td style="padding: 8px 32px 26px;">
                        <h1 style="margin: 0 0 10px 0; font-family: ${NUNITO_STACK}; font-size: 28px; font-weight: 900; color: ${EMAIL_COLORS.text}; text-align: center; letter-spacing: -0.02em; line-height: 1.2;">
                          One more day${greetingName} 🎉
                        </h1>
                        <p style="margin: 0 0 22px 0; font-size: 15px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.55;">
                          You&apos;ve been on Pro for almost a week — nice work. Here&apos;s what stays unlocked when your ${planName} ${billingLabel} kicks in tomorrow:
                        </p>

                        <!-- Value-focused rows — what they KEEP, not what we charge -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                          ${valueRowsHtml}
                        </table>

                        <!-- Primary CTA — drives them back into the product -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 0 0 18px 0;">
                              ${ctaButton(dashboardUrl, 'Open WriteScholar')}
                            </td>
                          </tr>
                        </table>

                        <!-- Quiet billing line — legally required notice + reassurance,
                             but framed as info you control, not a demand. -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="background-color: ${EMAIL_COLORS.bg}; border: 2px solid ${EMAIL_COLORS.border}; border-radius: 14px; padding: 14px 16px;">
                              <p style="margin: 0; font-size: 12.5px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; line-height: 1.55; text-align: center;">
                                Just so you know: your trial wraps up in 24 hours${firstChargeAmount ? `, and your ${billingLabel} renews at <strong style="color: ${EMAIL_COLORS.text};">${firstChargeAmount}</strong>` : ''}${firstChargeAt ? ` on <strong style="color: ${EMAIL_COLORS.text};">${firstChargeAt}</strong>` : ''}. Want a break instead? <a href="${accountUrl}" style="color: ${EMAIL_COLORS.purple}; font-weight: 800; text-decoration: underline;">Pause or cancel in one click</a> — no hard feelings.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 16px 0 0 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.5;">
                          Got a question? Just hit reply — a real person will get back to you.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 16px 0 0 0; font-size: 11px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center;">
                    WriteScholar · You received this because you started a free trial.
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Trial-ending email sent to:', email);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send trial-ending email:', error);
      return { success: false, error: error.message };
    }
  }

  /* ─── Day-5 trial value recap ───
   *  Fired by the hourly `notifyTrialValueRecap` cron ~48h before the
   *  trial ends (day 5 of 7). Sits ahead of the 24h reminder and does a
   *  different job: it reflects the user's OWN usage back at them
   *  ("3 essays analysed, 42 flashcards") so the upcoming charge lands
   *  against visible value rather than arriving cold.
   *
   *  It also doubles as the compliance notice — an unmissable, plainly
   *  worded heads-up that a card will be charged, with a one-click way
   *  out. That combination is the point: users who were going to churn
   *  cancel here instead of disputing the charge later, and cancelling
   *  routes them through the save offer in CancelRetentionModal, which
   *  is where the 50% discount now lives.
   *
   *  One per subscription (subscriptions.trial_recap_email_sent_at).
   *
   *  @param {string} email  recipient
   *  @param {Object} opts   { firstName, planName, firstChargeAmount,
   *                           firstChargeAt, stats } where stats is
   *                           { analyses, studyPacks, citations }
   */
  async sendTrialValueRecapEmail(email, opts = {}) {
    if (!this.transporter) {
      console.log('📧 Trial value-recap email would be sent to:', email, opts);
      return { success: true, message: 'Email service not configured - trial value-recap logged to console' };
    }

    try {
      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const replyToAddress = process.env.EMAIL_REPLY_TO || 'support@writescholar.com';
      const { frontendUrl, mascotUrl } = getEmailAssets();
      const accountUrl = `${frontendUrl}/account`;
      const dashboardUrl = `${frontendUrl}/dashboard`;

      const firstName = (opts.firstName || '').trim();
      const greetingName = firstName ? `, ${firstName}` : '';
      const planName = opts.planName || 'Pro';
      const firstChargeAmount = opts.firstChargeAmount || '';
      const firstChargeAt = opts.firstChargeAt
        ? new Date(opts.firstChargeAt).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })
        : null;

      const stats = opts.stats || {};
      const analyses = Number(stats.analyses) || 0;
      const studyPacks = Number(stats.studyPacks) || 0;
      const citations = Number(stats.citations) || 0;
      const usedAnything = analyses + studyPacks + citations > 0;

      // Only show counters the user actually put a number on — a row of
      // zeroes is an argument for cancelling.
      const statCards = [
        { n: analyses, label: analyses === 1 ? 'essay analysed' : 'essays analysed', color: EMAIL_COLORS.purple, soft: EMAIL_COLORS.purpleSoft, dark: EMAIL_COLORS.purpleDark },
        { n: studyPacks, label: studyPacks === 1 ? 'study pack built' : 'study packs built', color: EMAIL_COLORS.orange, soft: EMAIL_COLORS.orangeSoft, dark: EMAIL_COLORS.orangeDark },
        { n: citations, label: citations === 1 ? 'citation search' : 'citation searches', color: EMAIL_COLORS.blue, soft: EMAIL_COLORS.blueSoft, dark: EMAIL_COLORS.blueDark },
      ].filter((s) => s.n > 0);

      const statCardsHtml = statCards.length
        ? `
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                          <tr>
                            ${statCards.map((s) => `
                            <td width="${Math.floor(100 / statCards.length)}%" style="padding: 0 4px;">
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${s.soft}; border: 2px solid ${s.color}; border-bottom: 4px solid ${s.dark}; border-radius: 14px;">
                                <tr>
                                  <td align="center" style="padding: 14px 6px;">
                                    <p style="margin: 0; font-family: ${NUNITO_STACK}; font-size: 26px; font-weight: 900; color: ${s.dark}; line-height: 1;">${s.n}</p>
                                    <p style="margin: 4px 0 0 0; font-size: 11.5px; font-weight: 700; color: ${EMAIL_COLORS.text}; line-height: 1.35;">${s.label}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>`).join('')}
                          </tr>
                        </table>`
        : '';

      // Two openings: one celebrates what they did, one nudges the
      // never-activated user to try the single highest-value action
      // while the trial still covers it.
      const bodyCopy = usedAnything
        ? `Here&apos;s what you got done on ${planName} this week. Your ${planName} plan starts after the trial, so all of this keeps working.`
        : `Your trial has a couple of days left and you haven&apos;t run an essay through yet. It takes about a minute and it&apos;s the fastest way to tell whether ${planName} is worth keeping.`;

      const subjectLine = usedAnything
        ? (firstName ? `${firstName}, here's your week on WriteScholar` : 'Here\'s your week on WriteScholar')
        : (firstName ? `${firstName}, 2 days left — try one essay?` : '2 days left — try one essay?');

      const mailOptions = {
        from: `"WriteScholar" <${fromAddress}>`,
        to: email,
        replyTo: replyToAddress,
        subject: subjectLine,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.bg}; font-family: ${NUNITO_STACK};">
            <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
              Two days left on your WriteScholar trial — here's what you've done so far, and what happens next.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.bg};">
              <tr>
                <td align="center" style="padding: 36px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: ${EMAIL_COLORS.white}; border-radius: 18px; overflow: hidden; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                    ${emailHeaderBlock('Your trial so far', { mascotUrl, accentColor: EMAIL_COLORS.purple, accentSoft: EMAIL_COLORS.purpleSoft })}

                    <tr>
                      <td style="padding: 8px 32px 26px;">
                        <h1 style="margin: 0 0 10px 0; font-family: ${NUNITO_STACK}; font-size: 28px; font-weight: 900; color: ${EMAIL_COLORS.text}; text-align: center; letter-spacing: -0.02em; line-height: 1.2;">
                          ${usedAnything ? `Nice work${greetingName} 📈` : `Two days left${greetingName} ⏳`}
                        </h1>
                        <p style="margin: 0 0 22px 0; font-size: 15px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.55;">
                          ${bodyCopy}
                        </p>

                        ${statCardsHtml}

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 0 0 18px 0;">
                              ${ctaButton(dashboardUrl, usedAnything ? 'Open WriteScholar' : 'Analyse an essay', EMAIL_COLORS.purple, EMAIL_COLORS.purpleDark)}
                            </td>
                          </tr>
                        </table>

                        <!-- Compliance notice. Deliberately plain: the charge
                             date, the amount, and a one-click way out. -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="background-color: ${EMAIL_COLORS.bg}; border: 2px solid ${EMAIL_COLORS.border}; border-radius: 14px; padding: 14px 16px;">
                              <p style="margin: 0; font-size: 12.5px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; line-height: 1.55; text-align: center;">
                                Heads up: your free trial ends in 2 days${firstChargeAt ? ` on <strong style="color: ${EMAIL_COLORS.text};">${firstChargeAt}</strong>` : ''}${firstChargeAmount ? `, when your card is charged <strong style="color: ${EMAIL_COLORS.text};">${firstChargeAmount}</strong>` : ''}. Not for you? <a href="${accountUrl}" style="color: ${EMAIL_COLORS.purple}; font-weight: 800; text-decoration: underline;">Cancel in one click</a> — you won&apos;t be charged a penny.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 16px 0 0 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.5;">
                          Got a question? Just hit reply — a real person will get back to you.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 16px 0 0 0; font-size: 11px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center;">
                    WriteScholar · You received this because you started a free trial.
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Trial value-recap email sent to:', email);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send trial value-recap email:', error);
      return { success: false, error: error.message };
    }
  }

  /* ─── Post-lapse winback ───
   *  Fired by the daily `notifyWinbacks` cron ~14 days after a
   *  subscription actually lapsed (not when cancellation was requested
   *  — the user still had paid access until period end).
   *
   *  This is the second half of the discount move: the 50% code no
   *  longer greets new signups, it chases people who already left. A
   *  churned user who returns at half price is revenue we had written
   *  off, whereas the same discount at signup mostly reduces what
   *  already-converting users pay.
   *
   *  One per user, ever (users.winback_email_sent_at).
   *
   *  @param {string} email  recipient
   *  @param {Object} opts   { firstName, planName, promoCode, priceLabel }
   */
  async sendWinbackEmail(email, opts = {}) {
    if (!this.transporter) {
      console.log('📧 Winback email would be sent to:', email, opts);
      return { success: true, message: 'Email service not configured - winback logged to console' };
    }

    try {
      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const replyToAddress = process.env.EMAIL_REPLY_TO || 'support@writescholar.com';
      const { frontendUrl, mascotUrl } = getEmailAssets();

      const firstName = (opts.firstName || '').trim();
      const greetingName = firstName ? `, ${firstName}` : '';
      const planName = opts.planName || 'Pro';
      const promoCode = opts.promoCode || 'COMEBACK50';
      const priceLabel = opts.priceLabel || '$9.99';
      // Pre-applies the code on the pricing page so the user never has
      // to type it — the offer is only credible if the number they were
      // promised is the number Stripe shows.
      const returnUrl = `${frontendUrl}/pricing?promo=${encodeURIComponent(promoCode)}`;

      const valueRows = [
        { emoji: '📝', title: 'Your drafts are still here', desc: 'Nothing was deleted — pick up exactly where you stopped.', color: EMAIL_COLORS.purple, soft: EMAIL_COLORS.purpleSoft, dark: EMAIL_COLORS.purpleDark },
        { emoji: '🔁', title: 'One-click revisions', desc: 'Accept a suggested rewrite and it lands in your draft.', color: EMAIL_COLORS.green, soft: EMAIL_COLORS.greenSoft, dark: EMAIL_COLORS.greenDark },
        { emoji: '📚', title: 'Unlimited study packs', desc: 'Notes → flashcards, quizzes and games on tap.', color: EMAIL_COLORS.blue, soft: EMAIL_COLORS.blueSoft, dark: EMAIL_COLORS.blueDark },
      ];
      const valueRowsHtml = valueRows.map((f) => `
                          <tr>
                            <td style="padding: 5px 0;">
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.white}; border-radius: 14px; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                                <tr>
                                  <td width="48" style="padding: 10px 12px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0">
                                      <tr>
                                        <td style="background-color: ${f.soft}; border: 2px solid ${f.color}; border-bottom: 3px solid ${f.dark}; border-radius: 12px; width: 44px; height: 44px; text-align: center; font-size: 22px; line-height: 44px; vertical-align: middle;">
                                          ${f.emoji}
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td style="padding: 10px 14px 10px 4px;">
                                    <p style="margin: 0 0 2px 0; font-family: ${NUNITO_STACK}; font-size: 14px; font-weight: 800; color: ${EMAIL_COLORS.text};">${f.title}</p>
                                    <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; line-height: 1.45;">${f.desc}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>`).join('');

      const mailOptions = {
        from: `"WriteScholar" <${fromAddress}>`,
        to: email,
        replyTo: replyToAddress,
        subject: firstName
          ? `${firstName}, come back to ${planName} for ${priceLabel}`
          : `Come back to ${planName} for ${priceLabel}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.bg}; font-family: ${NUNITO_STACK};">
            <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
              Your WriteScholar work is still saved — come back to ${planName} for ${priceLabel} your first month.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.bg};">
              <tr>
                <td align="center" style="padding: 36px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: ${EMAIL_COLORS.white}; border-radius: 18px; overflow: hidden; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                    ${emailHeaderBlock('We saved your seat', { mascotUrl, accentColor: EMAIL_COLORS.purple, accentSoft: EMAIL_COLORS.purpleSoft })}

                    <tr>
                      <td style="padding: 8px 32px 26px;">
                        <h1 style="margin: 0 0 10px 0; font-family: ${NUNITO_STACK}; font-size: 28px; font-weight: 900; color: ${EMAIL_COLORS.text}; text-align: center; letter-spacing: -0.02em; line-height: 1.2;">
                          Come back for ${priceLabel}${greetingName}
                        </h1>
                        <p style="margin: 0 0 22px 0; font-size: 15px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.55;">
                          Essay season doesn&apos;t stop. Restart ${planName} at half price for your first month — everything you wrote is exactly where you left it.
                        </p>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                          ${valueRowsHtml}
                        </table>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 0 0 18px 0;">
                              ${ctaButton(returnUrl, `Restart for ${priceLabel}`, EMAIL_COLORS.purple, EMAIL_COLORS.purpleDark)}
                            </td>
                          </tr>
                        </table>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="background-color: ${EMAIL_COLORS.purpleSoft}; border: 2px solid ${EMAIL_COLORS.purple}; border-radius: 14px; padding: 14px 16px;">
                              <p style="margin: 0; font-size: 12.5px; font-weight: 700; color: ${EMAIL_COLORS.text}; line-height: 1.55; text-align: center;">
                                Code <strong style="letter-spacing: 0.08em;">${promoCode}</strong> is already on the link above — 50% off your first month, then the standard rate. Cancel anytime.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 16px 0 0 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.5;">
                          Not coming back? No hard feelings — just hit reply and tell us what was missing.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 16px 0 0 0; font-size: 11px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center;">
                    WriteScholar · You received this because you previously subscribed.
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Winback email sent to:', email);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send winback email:', error);
      return { success: false, error: error.message };
    }
  }

  /* ─── Preview follow-up (freemium recovery) ───
   *  Fired by the hourly `notifyPreviewFollowups` cron in
   *  subscriptionService ~24h after a free user ran a preview
   *  (analysis / citation search / study pack) but didn't upgrade.
   *  Their locked results are still sitting in the app — this email
   *  brings them back at the moment the assignment is still live.
   *  One per user, ever (users.preview_followup_email_sent_at).
   *
   *  @param {string} email   recipient
   *  @param {Object} opts    { firstName, feature } — feature is
   *                          'analysis' | 'citations' | 'study pack'
   */
  async sendPreviewFollowupEmail(email, opts = {}) {
    if (!this.transporter) {
      console.log('📧 Preview follow-up email would be sent to:', email, opts);
      return { success: true, message: 'Email service not configured - preview follow-up logged to console' };
    }

    try {
      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const replyToAddress = process.env.EMAIL_REPLY_TO || 'support@writescholar.com';
      const { frontendUrl, mascotUrl } = getEmailAssets();
      // ?upgrade=1 opens the soft paywall on arrival (EMAIL_UPGRADE_PENDING_KEY
      // in CompleteAcademicAIApp) so the CTA matches "unlock my results".
      const dashboardUrl = `${frontendUrl}/dashboard?upgrade=1`;

      const firstName = (opts.firstName || '').trim();
      const greetingName = firstName ? `, ${firstName}` : '';
      const feature = opts.feature || 'analysis';

      // Feature-aware hook: lead with the exact thing they left locked.
      const hooks = {
        analysis: {
          subject: firstName
            ? `${firstName}, your essay fixes are still waiting`
            : 'Your essay fixes are still waiting',
          headline: `Your fixes are ready${greetingName} 📝`,
          body: 'Yesterday WriteScholar graded your essay and found fixes that would raise it — they\'re still sitting in your draft, locked. One upgrade and you can apply every one before you submit.',
          preheader: 'WriteScholar found fixes for your essay — they\'re still waiting in your draft.',
        },
        citations: {
          subject: firstName
            ? `${firstName}, your sources are still waiting`
            : 'Your sources are still waiting',
          headline: `Your sources are ready${greetingName} 📚`,
          body: 'Yesterday WriteScholar found real, citable sources for your topic — most are still locked. Unlock the full list and your bibliography writes itself.',
          preheader: 'WriteScholar found sources for your topic — the full list is still waiting.',
        },
        'study pack': {
          subject: firstName
            ? `${firstName}, your study pack is still waiting`
            : 'Your study pack is still waiting',
          headline: `Your pack is ready${greetingName} 🃏`,
          body: 'Yesterday WriteScholar turned your notes into a lesson and flashcards — the quiz, games, and the rest of your deck are still locked. Unlock them and actually test yourself before the exam.',
          preheader: 'Your study pack is built — the quiz and full deck are still waiting.',
        },
      };
      const hook = hooks[feature] || hooks.analysis;

      const valueRows = [
        { emoji: '📝', title: 'Every fix, applied',     desc: 'Full line-by-line annotations + one-click apply into your draft.', color: EMAIL_COLORS.purple, soft: EMAIL_COLORS.purpleSoft, dark: EMAIL_COLORS.purpleDark },
        { emoji: '🃏', title: 'Full study packs',        desc: 'Quiz, arcade games, and the whole flashcard deck — unlocked.',     color: EMAIL_COLORS.orange, soft: EMAIL_COLORS.orangeSoft, dark: EMAIL_COLORS.orangeDark },
        { emoji: '📚', title: 'Complete source lists',   desc: 'Every citation for your topic, plus PDF & Word export.',           color: EMAIL_COLORS.blue,   soft: EMAIL_COLORS.blueSoft,   dark: EMAIL_COLORS.blueDark },
      ];
      const valueRowsHtml = valueRows.map((f) => `
                          <tr>
                            <td style="padding: 5px 0;">
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.white}; border-radius: 14px; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                                <tr>
                                  <td width="48" style="padding: 10px 12px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0">
                                      <tr>
                                        <td style="background-color: ${f.soft}; border: 2px solid ${f.color}; border-bottom: 3px solid ${f.dark}; border-radius: 12px; width: 44px; height: 44px; text-align: center; font-size: 22px; line-height: 44px; vertical-align: middle;">
                                          ${f.emoji}
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td style="padding: 10px 14px 10px 4px;">
                                    <p style="margin: 0 0 2px 0; font-family: ${NUNITO_STACK}; font-size: 14px; font-weight: 800; color: ${EMAIL_COLORS.text};">${f.title}</p>
                                    <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; line-height: 1.45;">${f.desc}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>`).join('');

      const mailOptions = {
        from: `"WriteScholar" <${fromAddress}>`,
        to: email,
        replyTo: replyToAddress,
        subject: hook.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.bg}; font-family: ${NUNITO_STACK};">
            <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
              ${hook.preheader}
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.bg};">
              <tr>
                <td align="center" style="padding: 36px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: ${EMAIL_COLORS.white}; border-radius: 18px; overflow: hidden; border: 2px solid ${EMAIL_COLORS.border}; border-bottom: 4px solid ${EMAIL_COLORS.border};">
                    ${emailHeaderBlock('Picking up where you left off', { mascotUrl, accentColor: EMAIL_COLORS.purple, accentSoft: EMAIL_COLORS.purpleSoft })}

                    <tr>
                      <td style="padding: 8px 32px 26px;">
                        <h1 style="margin: 0 0 10px 0; font-family: ${NUNITO_STACK}; font-size: 28px; font-weight: 900; color: ${EMAIL_COLORS.text}; text-align: center; letter-spacing: -0.02em; line-height: 1.2;">
                          ${hook.headline}
                        </h1>
                        <p style="margin: 0 0 22px 0; font-size: 15px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.55;">
                          ${hook.body}
                        </p>

                        <!-- What unlocks with Pro -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                          ${valueRowsHtml}
                        </table>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 0 0 14px 0;">
                              ${ctaButton(dashboardUrl, 'Unlock my results')}
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 0; font-size: 12.5px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.55;">
                          Pro starts at <strong style="color: ${EMAIL_COLORS.text};">$9.99 for your first month</strong> with the NEWCUSTOMER discount — cancel anytime.
                        </p>

                        <p style="margin: 16px 0 0 0; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center; line-height: 1.5;">
                          Got a question? Just hit reply — a real person will get back to you.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 16px 0 0 0; font-size: 11px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-align: center;">
                    WriteScholar · You received this because you tried WriteScholar on your own work.
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Preview follow-up email sent to:', email);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send preview follow-up email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
