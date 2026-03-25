const nodemailer = require('nodemailer');

/** Brand colors aligned with the web app (stone + violet + lime). */
const EMAIL_COLORS = {
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone500: '#78716c',
  stone600: '#57534e',
  stone900: '#1c1917',
  violet500: '#8b5cf6',
  violet600: '#7c3aed',
  violet700: '#6d28d9',
  lime400: '#a3e635',
  white: '#ffffff',
};

function getEmailAssets() {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return {
    frontendUrl,
    mascotUrl: `${frontendUrl}/mascot.png`,
  };
}

function emailHeaderBlock(titleTagline, { mascotUrl }) {
  return `
                    <tr>
                      <td style="background: linear-gradient(165deg, #18181b 0%, #27272a 42%, #1e1b4b 100%); padding: 28px 32px 24px; text-align: center; border-bottom: 3px solid ${EMAIL_COLORS.lime400};">
                        <img src="${mascotUrl}" alt="WriteScholar mascot" width="88" height="88" style="display: block; margin: 0 auto 14px; border-radius: 18px; background: rgba(255,255,255,0.06); padding: 6px;" />
                        <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 700; color: ${EMAIL_COLORS.stone50}; letter-spacing: -0.02em; font-family: Georgia, 'Times New Roman', serif;">WriteScholar</h1>
                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: ${EMAIL_COLORS.lime400}; letter-spacing: 0.14em; text-transform: uppercase;">${titleTagline}</p>
                      </td>
                    </tr>`;
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if email configuration is properly set (not placeholder values)
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
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.log('❌ Email service configuration error:', error.message);
          console.log('   Full error:', error);
          console.log('📧 Email verification links will be logged to console instead');
          this.transporter = null; // Disable if verification fails
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
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.stone100}; font-family: Nunito, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.stone100};">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: ${EMAIL_COLORS.white}; border-radius: 16px; overflow: hidden; border: 1px solid ${EMAIL_COLORS.stone200}; box-shadow: 0 10px 40px rgba(28, 25, 23, 0.08);">
                    ${emailHeaderBlock('Verify your email', { mascotUrl })}
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 36px 36px 32px;">
                        <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.stone900}; text-align: center;">Almost there</h2>
                        <p style="margin: 0 0 28px 0; font-size: 15px; color: ${EMAIL_COLORS.stone500}; text-align: center; line-height: 1.6;">
                          Thanks for signing up! Confirm your email and you can start using your AI toolkit for coursework.
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 4px 0 28px 0;">
                              <a href="${verificationUrl}" 
                                 style="display: inline-block; 
                                        background: linear-gradient(180deg, ${EMAIL_COLORS.violet600} 0%, ${EMAIL_COLORS.violet700} 100%); 
                                        color: ${EMAIL_COLORS.white}; 
                                        font-size: 16px; 
                                        font-weight: 700; 
                                        text-decoration: none; 
                                        padding: 14px 36px; 
                                        border-radius: 12px;
                                        box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">
                                Confirm your email
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Divider -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="border-top: 1px solid ${EMAIL_COLORS.stone200}; padding-top: 22px;">
                              <p style="margin: 0 0 10px 0; font-size: 13px; color: ${EMAIL_COLORS.stone600}; text-align: center;">
                                Or copy and paste this link:
                              </p>
                              <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.stone500}; word-break: break-all; text-align: center; background-color: ${EMAIL_COLORS.stone50}; padding: 14px 16px; border-radius: 10px; border: 1px solid ${EMAIL_COLORS.stone200};">
                                ${verificationUrl}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: ${EMAIL_COLORS.stone50}; padding: 22px 32px; border-top: 1px solid ${EMAIL_COLORS.stone200};">
                        <p style="margin: 0 0 6px 0; font-size: 12px; color: ${EMAIL_COLORS.stone600}; text-align: center;">
                          This link expires in 24 hours.
                        </p>
                        <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.stone600}; text-align: center;">
                          If you didn't sign up for WriteScholar, you can ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Brand Footer -->
                    <tr>
                      <td style="padding: 18px 32px 26px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #a8a29e;">
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
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.stone100}; font-family: Nunito, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.stone100};">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: ${EMAIL_COLORS.white}; border-radius: 16px; overflow: hidden; border: 1px solid ${EMAIL_COLORS.stone200}; box-shadow: 0 10px 40px rgba(28, 25, 23, 0.08);">
                    ${emailHeaderBlock('Password reset', { mascotUrl })}
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 36px 36px 32px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                          <tr>
                            <td align="center">
                              <span style="display: inline-block; padding: 8px 14px; border-radius: 999px; background: rgba(124, 58, 237, 0.08); color: ${EMAIL_COLORS.violet700}; font-size: 13px; font-weight: 700; border: 1px solid ${EMAIL_COLORS.violet500};">Secure link</span>
                            </td>
                          </tr>
                        </table>
                        
                        <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.stone900}; text-align: center;">Reset your password</h2>
                        <p style="margin: 0 0 28px 0; font-size: 15px; color: ${EMAIL_COLORS.stone500}; text-align: center; line-height: 1.6;">
                          We received a request to reset your password. Click below to choose a new one.
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 4px 0 28px 0;">
                              <a href="${resetUrl}" 
                                 style="display: inline-block; 
                                        background: linear-gradient(180deg, ${EMAIL_COLORS.violet600} 0%, ${EMAIL_COLORS.violet700} 100%); 
                                        color: ${EMAIL_COLORS.white}; 
                                        font-size: 16px; 
                                        font-weight: 700; 
                                        text-decoration: none; 
                                        padding: 14px 36px; 
                                        border-radius: 12px;
                                        box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">
                                Reset password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Divider -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="border-top: 1px solid ${EMAIL_COLORS.stone200}; padding-top: 22px;">
                              <p style="margin: 0 0 10px 0; font-size: 13px; color: ${EMAIL_COLORS.stone600}; text-align: center;">
                                Or copy and paste this link:
                              </p>
                              <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.stone500}; word-break: break-all; text-align: center; background-color: ${EMAIL_COLORS.stone50}; padding: 14px 16px; border-radius: 10px; border: 1px solid ${EMAIL_COLORS.stone200};">
                                ${resetUrl}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: ${EMAIL_COLORS.stone50}; padding: 22px 32px; border-top: 1px solid ${EMAIL_COLORS.stone200};">
                        <p style="margin: 0 0 6px 0; font-size: 12px; color: ${EMAIL_COLORS.stone600}; text-align: center;">
                          This link expires in 1 hour.
                        </p>
                        <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.stone600}; text-align: center;">
                          If you didn't request this, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Brand Footer -->
                    <tr>
                      <td style="padding: 18px 32px 26px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #a8a29e;">
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
      const mailOptions = {
        from: `"WriteScholar" <${fromAddress}>`,
        to: email,
        replyTo: replyToAddress,
        subject: 'Welcome to WriteScholar!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.stone100}; font-family: Nunito, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Welcome to WriteScholar — sign in for essay feedback, citations, summaries, and study tools.</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_COLORS.stone100};">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: ${EMAIL_COLORS.white}; border-radius: 16px; overflow: hidden; border: 1px solid ${EMAIL_COLORS.stone200}; box-shadow: 0 10px 40px rgba(28, 25, 23, 0.08);">
                    ${emailHeaderBlock('Welcome', { mascotUrl })}
                    <tr>
                      <td style="padding: 0; height: 4px; line-height: 4px; font-size: 0; background: linear-gradient(90deg, ${EMAIL_COLORS.violet600} 0%, #f97373 52%, ${EMAIL_COLORS.lime400} 100%);">&nbsp;</td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 32px 32px 10px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 18px;">
                          <tr>
                            <td align="center">
                              <span style="display: inline-block; padding: 7px 14px; border-radius: 999px; background: rgba(124, 58, 237, 0.08); color: ${EMAIL_COLORS.violet700}; font-size: 12px; font-weight: 700; border: 1px solid rgba(139, 92, 246, 0.45); letter-spacing: 0.02em;">Account ready</span>
                            </td>
                          </tr>
                        </table>
                        
                        <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 600; color: ${EMAIL_COLORS.stone900}; text-align: center; font-family: 'EB Garamond', Georgia, 'Times New Roman', serif; letter-spacing: -0.02em; line-height: 1.2;">Welcome to WriteScholar</h2>
                        <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: ${EMAIL_COLORS.violet600}; text-align: center;">You're all set</p>
                        <p style="margin: 0 0 26px 0; font-size: 15px; color: ${EMAIL_COLORS.stone500}; text-align: center; line-height: 1.65;">
                          Sign in to your dashboard—essay feedback, citations, summaries, quizzes, and more, in one place.
                        </p>
                        
                        <!-- Features List -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 26px;">
                          <tr>
                            <td style="background: linear-gradient(145deg, ${EMAIL_COLORS.stone50} 0%, #f4f4f5 100%); border-radius: 14px; padding: 20px 20px 20px 18px; border: 1px solid ${EMAIL_COLORS.stone200}; border-left: 4px solid ${EMAIL_COLORS.lime400};">
                              <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 700; color: ${EMAIL_COLORS.violet600}; text-transform: uppercase; letter-spacing: 0.14em;">What you can do</p>
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="padding: 5px 0; font-size: 14px; color: ${EMAIL_COLORS.stone600};">
                                    <span style="color: ${EMAIL_COLORS.lime400}; font-weight: 800; margin-right: 8px;">✓</span> Essay feedback &amp; analysis
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 5px 0; font-size: 14px; color: ${EMAIL_COLORS.stone600};">
                                    <span style="color: ${EMAIL_COLORS.lime400}; font-weight: 800; margin-right: 8px;">✓</span> Citation finder (APA, MLA, Chicago)
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 5px 0; font-size: 14px; color: ${EMAIL_COLORS.stone600};">
                                    <span style="color: ${EMAIL_COLORS.lime400}; font-weight: 800; margin-right: 8px;">✓</span> Summarize papers &amp; articles
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 5px 0; font-size: 14px; color: ${EMAIL_COLORS.stone600};">
                                    <span style="color: ${EMAIL_COLORS.lime400}; font-weight: 800; margin-right: 8px;">✓</span> Quiz &amp; flashcard generator
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 0 0 26px 0;">
                              <a href="${loginUrl}"
                                 style="display: inline-block; 
                                        background: linear-gradient(180deg, ${EMAIL_COLORS.violet600} 0%, ${EMAIL_COLORS.violet700} 100%); 
                                        color: ${EMAIL_COLORS.white}; 
                                        font-size: 16px; 
                                        font-weight: 700; 
                                        text-decoration: none; 
                                        padding: 14px 36px; 
                                        border-radius: 12px;
                                        box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">
                                Open your dashboard
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Gift Section -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="border: 2px dashed #c4b5fd; border-radius: 14px; padding: 0; text-align: center; background: ${EMAIL_COLORS.stone50}; overflow: hidden;">
                              <div style="height: 3px; background: linear-gradient(90deg, ${EMAIL_COLORS.violet500} 0%, ${EMAIL_COLORS.lime400} 100%);"></div>
                              <div style="padding: 20px 22px 22px;">
                              <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: ${EMAIL_COLORS.violet600}; text-transform: uppercase; letter-spacing: 0.12em;">Free PDF</p>
                              <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: ${EMAIL_COLORS.stone900}; font-family: 'EB Garamond', Georgia, serif;">Ultimate Study Tips Guide</p>
                              <p style="margin: 0 0 16px 0; font-size: 13px; color: ${EMAIL_COLORS.stone500}; line-height: 1.55;">
                                Active recall, spaced repetition, and practical tips to boost your grades—yours when you join.
                              </p>
                              <a href="${pdfUrl}"
                                 style="display: inline-block;
                                        background: linear-gradient(180deg, ${EMAIL_COLORS.violet500} 0%, ${EMAIL_COLORS.violet600} 100%);
                                        color: ${EMAIL_COLORS.white};
                                        font-size: 14px; 
                                        font-weight: 700; 
                                        text-decoration: none; 
                                        padding: 11px 22px; 
                                        border-radius: 10px;">
                                Download PDF →
                              </a>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: ${EMAIL_COLORS.stone50}; padding: 22px 32px; border-top: 1px solid ${EMAIL_COLORS.stone200};">
                        <p style="margin: 0; font-size: 13px; color: ${EMAIL_COLORS.stone500}; text-align: center; line-height: 1.55;">
                          Questions? Reply to this email or contact<br>
                          <a href="mailto:support@writescholar.com" style="color: ${EMAIL_COLORS.violet600}; font-weight: 600; text-decoration: underline;">support@writescholar.com</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Brand Footer -->
                    <tr>
                      <td style="padding: 18px 32px 26px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #a8a29e;">
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
}

module.exports = new EmailService();
