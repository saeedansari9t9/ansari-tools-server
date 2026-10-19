require('dotenv').config();
const { sendBroadcastEmail } = require('./utils/emailService');
const mongoose = require('mongoose');

const targetEmail = process.argv[2];

if (!targetEmail) {
  console.log('Usage: node send-test-email.js <your_email@gmail.com>');
  process.exit(1);
}

async function run() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (e) {
      console.warn('DB connect warning:', e.message);
    }
  }

  console.log(`Sending test email from ${process.env.EMAIL_USER} to ${targetEmail}...`);
  const result = await sendBroadcastEmail({
    email: targetEmail,
    heading: 'Official Support Notice – you’re just a message away',
    duration: '1 Year (Test)',
    subject: 'Ansari Tools: Customer Support & Official WhatsApp Update',
    customMessage: 'Yeh ek test email hai Ansari Tools ke new official domain email (support@ansaritools.com) se.\n\nAap check kar sakte hain ke email direct Inbox me aayi hai ya nahi.',
    newWhatsApp: '+92 322 7866655',
    newWhatsAppDisplay: '0322 7866655'
  });

  if (result.success) {
    console.log('SUCCESS: Email sent successfully! Message ID:', result.messageId);
    console.log(`Apne inbox (${targetEmail}) me check karein.`);
  } else {
    console.error('FAILED: Error sending email:', result.error);
  }

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

run();
