const nodemailer = require('nodemailer');

/* ═══════════════════════════════════════════════════════════════
   Email service — Duolingo-style transactional templates.

   Design tokens align with the WriteScholar web app:
   - Solid Duolingo hex colors (#58CC02 green, #A560E8 purple,
     #1CB0F6 blue, #FF9600 orange, #FF4B4B red)
   - Nunito heading font (with web-safe fallbacks)
   - Chunky border-bottom 4px borders for buttons + cards
   - White cards on cream background with thick coloured top accent
   ═══════════════════════════════════════════════════════════════ */

const EMAIL_COLORS = {
  /* Page + cards */
  bg: '#F7F7F7',
  white: '#FFFFFF',
  surfaceSoft: '#FAFAFA',
  /* Primary brand — green */
  green: '#58CC02',
  greenDark: '#46A302',
  greenSoft: '#E5F8D0',
  /* Purple */
  purple: '#A560E8',
  purpleDark: '#8A48C7',
  purpleSoft: '#F3EAFF',
  /* Blue (info / security) */
  blue: '#1CB0F6',
  blueDark: '#1899D6',
  blueSoft: '#DDF4FF',
  /* Orange (warmth / streak) */
  orange: '#FF9600',
  orangeDark: '#D97F00',
  orangeSoft: '#FFF4E0',
  /* Red (errors / urgent) */
  red: '#FF4B4B',
  redDark: '#E04343',
  redSoft: '#FFE8E8',
  /* Text + borders */
  text: '#3C3C3C',
  textMuted: '#78716c',
  textFaint: '#a8a29e',
  border: '#E5E5E5',
  borderDark: '#CECECE',
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
  const color = accentColor || EMAIL_COLORS.green;
  const soft = accentSoft || EMAIL_COLORS.greenSoft;
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
 * Reusable Duolingo-style CTA button. `accent` defaults to green.
 */
function ctaButton(href, label, accentColor, accentDark) {
  const bg = accentColor || EMAIL_COLORS.green;
  const border = accentDark || EMAIL_COLORS.greenDark;
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
                    ${emailHeaderBlock('Verify your email', { mascotUrl, accentColor: EMAIL_COLORS.green, accentSoft: EMAIL_COLORS.greenSoft })}

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
                    ${emailHeaderBlock('Password reset', { mascotUrl, accentColor: EMAIL_COLORS.blue, accentSoft: EMAIL_COLORS.blueSoft })}

                    <!-- Main content -->
                    <tr>
                      <td style="padding: 8px 32px 28px;">
                        <!-- Secure-link badge -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                          <tr>
                            <td align="center">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="background-color: ${EMAIL_COLORS.blueSoft}; border: 2px solid ${EMAIL_COLORS.blue}; border-radius: 999px; padding: 6px 14px;">
                                    <span style="font-family: ${NUNITO_STACK}; font-size: 11px; font-weight: 800; color: ${EMAIL_COLORS.blueDark}; letter-spacing: 0.14em; text-transform: uppercase;">🔒 Secure link</span>
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
                              ${ctaButton(resetUrl, 'Reset password', EMAIL_COLORS.blue, EMAIL_COLORS.blueDark)}
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
                    ${emailHeaderBlock('Account ready', { mascotUrl, accentColor: EMAIL_COLORS.green, accentSoft: EMAIL_COLORS.greenSoft })}

                    <!-- Main content -->
                    <tr>
                      <td style="padding: 8px 32px 26px;">
                        <h1 style="margin: 0 0 8px 0; font-family: ${NUNITO_STACK}; font-size: 30px; font-weight: 900; color: ${EMAIL_COLORS.text}; text-align: center; letter-spacing: -0.02em; line-height: 1.15;">
                          Welcome to <span style="color: ${EMAIL_COLORS.green};">WriteScholar!</span>
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
                          <a href="mailto:support@writescholar.com" style="color: ${EMAIL_COLORS.green}; font-weight: 800; text-decoration: none;">support@writescholar.com</a>
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
}

module.exports = new EmailService();
