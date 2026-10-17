require('dotenv').config();
const { sendCanvaSubscriptionEmail } = require('./utils/emailService');

const targetEmail = process.argv[2];

if (!targetEmail) {
  console.log('Usage: node send-test-canva-email.js <your_email@gmail.com> [duration]');
  process.exit(1);
}

const duration = process.argv[3] || '1 Year';

async function run() {
  console.log(`Sending Canva Pro test email from ${process.env.EMAIL_USER} to ${targetEmail} (${duration})...`);
  const result = await sendCanvaSubscriptionEmail(targetEmail, duration, new Date());

  if (result.success) {
    console.log('SUCCESS: Canva subscription test email sent successfully! Message ID:', result.messageId);
    console.log(`Apne inbox (${targetEmail}) me check karein.`);
  } else {
    console.error('FAILED: Error sending email:', result.error);
  }
}

run();
