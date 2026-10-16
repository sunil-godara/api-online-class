require('dotenv').config();
const emailService = require('./utils/emailService');
const smsService = require('./utils/smsService');

async function testServices() {
  console.log('🧪 Testing SendGrid and Twilio Services...\n');

  // Test email service
  console.log('📧 Testing Email Service (SendGrid)...');
  try {
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const emailResult = await emailService.sendEmail(
      testEmail,
      'Test Email from Sanara Wellness',
      '<h1>Hello from Sanara Wellness!</h1><p>This is a test email sent via SendGrid.</p>',
      'Hello from Sanara Wellness! This is a test email sent via SendGrid.'
    );
    console.log('✅ Email sent successfully:', emailResult);
  } catch (error) {
    console.log('❌ Email test failed:', error.message);
  }

  console.log('\n📱 Testing SMS Service (Twilio)...');
  try {
    const testPhone = process.env.TEST_PHONE || '+1234567890';
    const smsResult = await smsService.sendSMS(testPhone, 'Test SMS from Sanara Wellness via Twilio');
    console.log('✅ SMS sent successfully:', smsResult);
  } catch (error) {
    console.log('❌ SMS test failed:', error.message);
  }

  console.log('\n🔧 Testing OTP Functions...');

  // Test email OTP
  try {
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const emailOtpResult = await emailService.sendOTP(testEmail, '123456', 'Test User');
    console.log('✅ Email OTP sent successfully:', emailOtpResult);
  } catch (error) {
    console.log('❌ Email OTP test failed:', error.message);
  }

  // Test SMS OTP
  try {
    const testPhone = process.env.TEST_PHONE || '+1234567890';
    const smsOtpResult = await smsService.sendOTP(testPhone, '123456', '+1');
    console.log('✅ SMS OTP sent successfully:', smsOtpResult);
  } catch (error) {
    console.log('❌ SMS OTP test failed:', error.message);
  }

  console.log('\n📋 Environment Check:');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || '❌ Missing');
  console.log('SENDGRID_FROM_NAME:', process.env.SENDGRID_FROM_NAME || '❌ Missing');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || '❌ Missing');

  console.log('\n💡 To test with real email/phone, set these environment variables:');
  console.log('export TEST_EMAIL="your-email@example.com"');
  console.log('export TEST_PHONE="+1234567890"');
}

testServices().catch(console.error);
