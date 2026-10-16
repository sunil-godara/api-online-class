const twilio = require('twilio');

class SMSService {
  constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required in environment variables');
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER is required in environment variables');
    }

    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    this.fromPhone = process.env.TWILIO_PHONE_NUMBER;
    this.appName = process.env.APP_NAME || 'Sanara Wellness';
  }

  ensurePhoneFormat(phone, countryCode = null) {
    if (!phone) {
      throw new Error('Phone number is required');
    }

    // Remove any spaces, dashes, or parentheses
    let cleanPhone = phone.replace(/[\s\-()]/g, '');

    // If already starts with +, return as is
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }

    // Handle Indian phone numbers (10 digits starting with 6-9, or 11 digits starting with 0)
    if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      // Remove leading 0 and add +91
      cleanPhone = cleanPhone.substring(1);
      return `+91${cleanPhone}`;
    }

    // Handle 10-digit Indian numbers
    if (cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)) {
      return `+91${cleanPhone}`;
    }

    // Handle US/Canada numbers (10 digits)
    if (cleanPhone.length === 10 && /^\d{10}$/.test(cleanPhone)) {
      return `+1${cleanPhone}`;
    }

    // If country code is provided, use it
    if (countryCode) {
      const cleanCountryCode = countryCode.startsWith('+') ? countryCode.substring(1) : countryCode;
      return `+${cleanCountryCode}${cleanPhone}`;
    }

    // For other formats, try to detect common patterns
    // If it's 11 digits and starts with 1, assume US/Canada
    if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      return `+${cleanPhone}`;
    }

    // If it's 12 digits and starts with 91, assume India
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return `+${cleanPhone}`;
    }

    // Default: assume it's already in international format or add + prefix
    if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
      return `+${cleanPhone}`;
    }

    throw new Error(`Invalid phone number format: ${phone}`);
  }

  async sendSMS(to, message, countryCode = null) {
    try {
      const formattedPhone = this.ensurePhoneFormat(to, countryCode);

      const result = await this.client.messages.create({
        body: message,
        from: this.fromPhone,
        to: formattedPhone
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        to: formattedPhone
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  async sendOTP(phone, otp, countryCode = null) {
    const message = `Your ${this.appName} verification code is: ${otp}. This code will expire in 5 minutes. Do not share this code with anyone.`;
    return await this.sendSMS(phone, message, countryCode);
  }

  async sendPasswordReset(phone, resetCode, countryCode = null) {
    const message = `Your ${this.appName} password reset code is: ${resetCode}. This code will expire in 1 hour. If you didn't request this, please ignore this message.`;
    return await this.sendSMS(phone, message, countryCode);
  }

  async sendCustomMessage(phone, message, countryCode = null) {
    return await this.sendSMS(phone, message, countryCode);
  }

  async sendBulkSMS(phoneNumbers, message, countryCode = null) {
    const results = [];

    for (const phone of phoneNumbers) {
      try {
        const result = await this.sendSMS(phone, message, countryCode);
        results.push({ phone, success: true, result });
      } catch (error) {
        results.push({ phone, success: false, error: error.message });
      }
    }

    return results;
  }

  formatPhoneNumber(phone, countryCode = null) {
    return this.ensurePhoneFormat(phone, countryCode);
  }

  isValidPhoneNumber(phone) {
    return /^\+\d{10,15}$/.test(phone);
  }
}

module.exports = new SMSService();
