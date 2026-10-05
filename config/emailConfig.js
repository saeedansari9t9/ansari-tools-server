// Email Configuration
// Add these variables to your .env file or set them as environment variables

module.exports = {
  // Gmail SMTP Configuration
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  
  // Email Settings
  FROM_NAME: 'AnsariTools',
  FROM_EMAIL: process.env.EMAIL_USER,
  
  // SMTP Settings
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 587,
  SMTP_SECURE: false, // true for 465, false for other ports
  SMTP_AUTH: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};
