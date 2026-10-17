require('dotenv').config();
const { verifyEmailConnection } = require('./utils/emailService');

async function testConnection() {
  console.log('Testing SMTP connection with settings:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'mail.privateemail.com (default)');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '465 (default)');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '********' : 'NOT SET');
  
  const result = await verifyEmailConnection();
  if (result.success) {
    console.log('SUCCESS: SMTP connection connected and authenticated successfully!');
  } else {
    console.error('FAILED: Could not connect to SMTP server.');
    console.error('Error Details:', result.error);
  }
}

testConnection();
