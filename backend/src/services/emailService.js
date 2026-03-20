const nodemailer = require('nodemailer');

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
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f4;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: #262626; padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #8b5cf6; letter-spacing: -0.5px;">WriteScholar</h1>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #262626; text-align: center;">Verify your email</h2>
                        <p style="margin: 0 0 32px 0; font-size: 15px; color: #78716c; text-align: center; line-height: 1.5;">
                          Thanks for signing up! Please confirm your email address to get started.
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 8px 0 32px 0;">
                              <a href="${verificationUrl}" 
                                 style="display: inline-block; 
                                        background-color: #262626; 
                                        color: #ffffff; 
                                        font-size: 16px; 
                                        font-weight: 600; 
                                        text-decoration: none; 
                                        padding: 14px 32px; 
                                        border-radius: 50px;
                                        transition: background-color 0.2s;">
                                Confirm your email
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Divider -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="border-top: 1px solid #e7e5e4; padding-top: 24px;">
                              <p style="margin: 0 0 12px 0; font-size: 13px; color: #a8a29e; text-align: center;">
                                Or copy and paste this link:
                              </p>
                              <p style="margin: 0; font-size: 13px; color: #78716c; word-break: break-all; text-align: center; background-color: #fafaf9; padding: 12px 16px; border-radius: 8px;">
                                ${verificationUrl}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #fafaf9; padding: 24px 40px; border-top: 1px solid #e7e5e4;">
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #a8a29e; text-align: center;">
                          This link expires in 24 hours.
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #a8a29e; text-align: center;">
                          If you didn't sign up for WriteScholar, you can ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Brand Footer -->
                    <tr>
                      <td style="padding: 20px 40px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #d6d3d1;">
                          © 2026 WriteScholar · AI Toolkit for Students
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
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f4;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: #262626; padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #8b5cf6; letter-spacing: -0.5px;">WriteScholar</h1>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <!-- Lock Icon -->
                        <div style="text-align: center; margin-bottom: 24px;">
                          <div style="display: inline-block; width: 56px; height: 56px; background-color: #fef3c7; border-radius: 50%; line-height: 56px; font-size: 24px;">
                            🔐
                          </div>
                        </div>
                        
                        <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #262626; text-align: center;">Reset your password</h2>
                        <p style="margin: 0 0 32px 0; font-size: 15px; color: #78716c; text-align: center; line-height: 1.5;">
                          We received a request to reset your password. Click below to choose a new one.
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 8px 0 32px 0;">
                              <a href="${resetUrl}" 
                                 style="display: inline-block; 
                                        background-color: #262626; 
                                        color: #ffffff; 
                                        font-size: 16px; 
                                        font-weight: 600; 
                                        text-decoration: none; 
                                        padding: 14px 32px; 
                                        border-radius: 50px;">
                                Reset password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Divider -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="border-top: 1px solid #e7e5e4; padding-top: 24px;">
                              <p style="margin: 0 0 12px 0; font-size: 13px; color: #a8a29e; text-align: center;">
                                Or copy and paste this link:
                              </p>
                              <p style="margin: 0; font-size: 13px; color: #78716c; word-break: break-all; text-align: center; background-color: #fafaf9; padding: 12px 16px; border-radius: 8px;">
                                ${resetUrl}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #fafaf9; padding: 24px 40px; border-top: 1px solid #e7e5e4;">
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #a8a29e; text-align: center;">
                          This link expires in 1 hour.
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #a8a29e; text-align: center;">
                          If you didn't request this, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Brand Footer -->
                    <tr>
                      <td style="padding: 20px 40px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #d6d3d1;">
                          © 2026 WriteScholar · AI Toolkit for Students
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
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
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
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f4;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: #262626; padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #8b5cf6; letter-spacing: -0.5px;">WriteScholar</h1>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <!-- Checkmark Icon -->
                        <div style="text-align: center; margin-bottom: 24px;">
                          <div style="display: inline-block; width: 56px; height: 56px; background-color: #ede9fe; border-radius: 50%; line-height: 56px; font-size: 24px;">
                            ✓
                          </div>
                        </div>
                        
                        <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #262626; text-align: center;">You're all set!</h2>
                        <p style="margin: 0 0 32px 0; font-size: 15px; color: #78716c; text-align: center; line-height: 1.5;">
                          Your account is verified and ready to go. Start exploring our AI toolkit for academic success.
                        </p>
                        
                        <!-- Features List -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                          <tr>
                            <td style="background-color: #fafaf9; border-radius: 12px; padding: 20px;">
                              <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #262626;">What you can do:</p>
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="padding: 6px 0; font-size: 14px; color: #57534e;">
                                    <span style="color: #8b5cf6; margin-right: 8px;">✓</span> Essay feedback & analysis
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0; font-size: 14px; color: #57534e;">
                                    <span style="color: #8b5cf6; margin-right: 8px;">✓</span> Citation finder (APA, MLA, Chicago)
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0; font-size: 14px; color: #57534e;">
                                    <span style="color: #8b5cf6; margin-right: 8px;">✓</span> Summarize papers & articles
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0; font-size: 14px; color: #57534e;">
                                    <span style="color: #8b5cf6; margin-right: 8px;">✓</span> Quiz & flashcard generator
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding: 0 0 32px 0;">
                              <a href="${loginUrl}"
                                 style="display: inline-block; 
                                        background-color: #262626; 
                                        color: #ffffff; 
                                        font-size: 16px; 
                                        font-weight: 600; 
                                        text-decoration: none; 
                                        padding: 14px 32px; 
                                        border-radius: 50px;">
                                Log in to Dashboard
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Gift Section -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="border: 2px dashed #ddd6fe; border-radius: 12px; padding: 20px; text-align: center;">
                              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px;">Free Gift</p>
                              <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #262626;">Ultimate Study Tips Guide</p>
                              <p style="margin: 0 0 16px 0; font-size: 13px; color: #78716c; line-height: 1.5;">
                                A 10-page PDF with active recall, spaced repetition, and tips to boost your grades.
                              </p>
<a href="${pdfUrl}"
                                 style="display: inline-block;
                                        background-color: #8b5cf6;
                                        color: #ffffff;
                                        font-size: 14px; 
                                        font-weight: 600; 
                                        text-decoration: none; 
                                        padding: 10px 20px; 
                                        border-radius: 50px;">
                                Download PDF →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #fafaf9; padding: 24px 40px; border-top: 1px solid #e7e5e4;">
                        <p style="margin: 0; font-size: 13px; color: #78716c; text-align: center; line-height: 1.5;">
                          Questions? Just reply to this email or contact<br>
                          <a href="mailto:support@writescholar.com" style="color: #57534e; text-decoration: underline;">support@writescholar.com</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Brand Footer -->
                    <tr>
                      <td style="padding: 20px 40px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #d6d3d1;">
                          © 2026 WriteScholar · AI Toolkit for Students
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
