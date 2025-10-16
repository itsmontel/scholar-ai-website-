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
          console.log('📧 Email verification links will be logged to console instead');
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
    if (!this.transporter) {
      const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/verify-email?token=${verificationToken}`;
      
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL VERIFICATION (Development Mode)');
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
      
      const mailOptions = {
        from: `"WriteScholar" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Scholar AI Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Scholar AI</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Academic Writing Assistant</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Welcome to Scholar AI!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Thank you for signing up for Scholar AI. To complete your registration and start using our AI-powered academic writing assistant, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; word-break: break-all; background: #f1f3f4; padding: 10px; border-radius: 4px;">
                ${verificationUrl}
              </p>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                This verification link will expire in 24 hours. If you didn't create an account with Scholar AI, you can safely ignore this email.
              </p>
            </div>
            
            <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
              <p style="margin: 0;">© 2025 Scholar AI. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">Enhancing academic writing with AI</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent to:', email);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
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
      
      const mailOptions = {
        from: `"WriteScholar" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Scholar AI Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Scholar AI</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                We received a request to reset your password for your Scholar AI account. If you made this request, click the button below to reset your password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; word-break: break-all; background: #f1f3f4; padding: 10px; border-radius: 4px;">
                ${resetUrl}
              </p>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
            
            <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
              <p style="margin: 0;">© 2025 Scholar AI. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">Enhancing academic writing with AI</p>
            </div>
          </div>
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
      const mailOptions = {
        from: `"WriteScholar" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to Scholar AI - Your Account is Verified!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Scholar AI</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to the Future of Academic Writing</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Welcome to Scholar AI!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Congratulations! Your Scholar AI account has been successfully verified. You're now ready to enhance your academic writing with our AI-powered analysis tools.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin-top: 0;">What you can do now:</h3>
                <ul style="color: #666; line-height: 1.8;">
                  <li>Upload your research papers and essays</li>
                  <li>Get AI-powered feedback on structure and clarity</li>
                  <li>Check citations and formatting</li>
                  <li>Improve your academic writing style</li>
                  <li>Access detailed analysis reports</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Start Writing Better
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </div>
            
            <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
              <p style="margin: 0;">© 2025 Scholar AI. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">Enhancing academic writing with AI</p>
            </div>
          </div>
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
