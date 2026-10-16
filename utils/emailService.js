const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is required in environment variables');
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
    this.fromName = process.env.SENDGRID_FROM_NAME;
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '')
      };

      const result = await sgMail.send(msg);
      return {
        success: true,
        messageId: result[0].headers['x-message-id']
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendOTP(email, otp, userName = null) {
    const subject = 'Welcome to Sanara Wellness - Verify Your Email';
    const greeting = userName ? `Hi ${userName}` : 'Hi';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>${greeting},</p>
        
        <p>Welcome to Sanara Wellness – we're excited to have you on board!</p>
        
        <p>To complete your registration and verify your identity, please use the verification code below:</p>
        
        <p style="font-size: 24px; font-weight: bold; margin: 20px 0;">Your Verification Code: ${otp}</p>
        
        <p>Enter this code in the app or on the website when prompted to complete the sign-up process.</p>
        
        <h3>Why this code?</h3>
        <p>We send verification codes to ensure that the registration request was made by you and to protect your account from unauthorized access.</p>
        
        <h3>Didn't request this?</h3>
        <p>If you did not try to register on Sanara Wellness, you can safely ignore this message. No changes will be made to your account or device, and no further action is needed.</p>
        
        <p>If you're having trouble with the code or need assistance, feel free to reach out to our support team. We're here to help.</p>
        
        <p>Thank you for choosing Sanara Wellness.</p>
        
        <p>Best regards,<br>The Sanara Wellness Team</p>
      </div>
    `;

    return await this.sendEmail(email, subject, htmlContent);
  }

  async sendAdminPasswordResetOTP(email, otp, firstName = 'Admin') {
    const subject = 'Sanara Wellness Admin - Password Reset Verification';
    const greeting = `Hi ${firstName}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>${greeting},</p>
        
        <p>Welcome to Sanara Wellness Admin Panel – we received a password reset request for your account.</p>
        
        <p>To reset your password, please use the verification code below:</p>
        
        <p style="font-size: 24px; font-weight: bold; margin: 20px 0;">Your Verification Code: ${otp}</p>
        
        <p>Enter this code in the admin panel when prompted to complete the password reset process.</p>
        
        <h3>Why this code?</h3>
        <p>We send verification codes to ensure that the password reset request was made by you and to protect your account from unauthorized access.</p>
        
        <h3>Didn't request this?</h3>
        <p>If you did not try to reset your password on Sanara Wellness Admin Panel, you can safely ignore this message. No changes will be made to your account or device, and no further action is needed.</p>
        
        <p>If you're having trouble with the code or need assistance, feel free to reach out to our support team. We're here to help.</p>
        
        <p>Thank you for being part of Sanara Wellness.</p>
        
        <p>Best regards,<br>The Sanara Wellness Team</p>
      </div>
    `;

    return await this.sendEmail(email, subject, htmlContent);
  }

  async sendPasswordReset(email, resetCode, userName = null) {
    const subject = 'Sanara Wellness - Password Reset Verification';
    const greeting = userName ? `Hi ${userName}` : 'Hi';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>${greeting},</p>
        
        <p>We received a password reset request for your Sanara Wellness account.</p>
        
        <p>To reset your password, please use the verification code below:</p>
        
        <p style="font-size: 24px; font-weight: bold; margin: 20px 0;">Your Verification Code: ${resetCode}</p>
        
        <p>Enter this code in the app or on the website when prompted to complete the password reset process.</p>
        
        <h3>Why this code?</h3>
        <p>We send verification codes to ensure that the password reset request was made by you and to protect your account from unauthorized access.</p>
        
        <h3>Didn't request this?</h3>
        <p>If you did not try to reset your password on Sanara Wellness, you can safely ignore this message. No changes will be made to your account or device, and no further action is needed.</p>
        
        <p>If you're having trouble with the code or need assistance, feel free to reach out to our support team. We're here to help.</p>
        
        <p>Thank you for choosing Sanara Wellness.</p>
        
        <p>Best regards,<br>The Sanara Wellness Team</p>
      </div>
    `;

    return await this.sendEmail(email, subject, htmlContent);
  }

  async sendCustomEmail(to, subject, htmlContent, textContent = null) {
    return await this.sendEmail(to, subject, htmlContent, textContent);
  }
}

module.exports = new EmailService();
