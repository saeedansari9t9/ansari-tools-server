const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // Your Gmail App Password
    }
  });
};

// Send Canva subscription notification email
const sendCanvaSubscriptionEmail = async (email, duration, subscriptionDate) => {
  try {
    const transporter = createTransporter();
    
    // Calculate expiry date
    const expiryDate = new Date(subscriptionDate);
    if (duration === '6 Months') {
      expiryDate.setMonth(expiryDate.getMonth() + 6);
    } else if (duration === '1 Year') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const mailOptions = {
      from: {
        name: 'Ansari Tools',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Your Canva Pro Subscription is Ready - Ansari Tools',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'Ansari Tools Email Service'
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Your Purchase - Ansari Tools</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 10px;
              min-height: 100vh;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #0B2E33 0%, #4F7C82 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.3;
            }
            .logo {
              font-size: 32px;
              font-weight: 800;
              margin-bottom: 8px;
              position: relative;
              z-index: 1;
            }
            .tagline {
              font-size: 16px;
              opacity: 0.9;
              position: relative;
              z-index: 1;
            }
            .content {
              padding: 30px 20px;
            }
            .thank-you {
              text-align: center;
              margin-bottom: 30px;
            }
            .thank-you h1 {
              color: #0B2E33;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .thank-you p {
              color: #666;
              font-size: 16px;
              line-height: 1.5;
            }
            .subscription-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border-radius: 15px;
              padding: 25px;
              margin: 25px 0;
              border: 1px solid #e0e0e0;
              position: relative;
              overflow: hidden;
            }
            .subscription-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 5px;
              height: 100%;
              background: linear-gradient(135deg, #0B2E33, #4F7C82);
            }
            .card-title {
              color: #0B2E33;
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .detail-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .detail-item:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #4F7C82;
              font-size: 14px;
            }
            .detail-value {
              color: #0B2E33;
              font-weight: 500;
              font-size: 14px;
              text-align: right;
            }
            .status-badge {
              background: #28a745;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }
            .features {
              background: #e8f4f8;
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
              border-left: 4px solid #4F7C82;
            }
            .features h3 {
              color: #0B2E33;
              font-size: 18px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .features ul {
              list-style: none;
              padding: 0;
            }
            .features li {
              padding: 6px 0;
              color: #555;
              font-size: 14px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .features li::before {
              content: '✨';
              font-size: 12px;
            }
            .cta-section {
              text-align: center;
              margin: 30px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #0B2E33, #4F7C82);
              color: white;
              padding: 15px 35px;
              text-decoration: none;
              border-radius: 30px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 8px 20px rgba(11, 46, 51, 0.3);
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 25px rgba(11, 46, 51, 0.4);
            }
            .warning-box {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 10px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
              font-size: 14px;
            }
            .footer {
              background: #f8f9fa;
              padding: 25px 20px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
            }
            .footer p {
              color: #666;
              font-size: 12px;
              margin: 5px 0;
            }
            .social-links {
              margin: 15px 0;
            }
            .social-links a {
              color: #4F7C82;
              text-decoration: none;
              margin: 0 10px;
              font-size: 14px;
            }
            
            /* Mobile Responsive */
            @media (max-width: 600px) {
              body {
                padding: 5px;
              }
              .email-container {
                border-radius: 15px;
              }
              .header {
                padding: 25px 15px;
              }
              .logo {
                font-size: 28px;
              }
              .tagline {
                font-size: 14px;
              }
              .content {
                padding: 20px 15px;
              }
              .thank-you h1 {
                font-size: 24px;
              }
              .thank-you p {
                font-size: 14px;
              }
              .subscription-card {
                padding: 20px 15px;
              }
              .card-title {
                font-size: 18px;
              }
              .detail-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
              }
              .detail-value {
                text-align: left;
                color: #0B2E33;
              }
              .cta-button {
                padding: 12px 25px;
                font-size: 14px;
              }
              .features {
                padding: 15px;
              }
              .features h3 {
                font-size: 16px;
              }
              .features li {
                font-size: 13px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">Ansari Tools</div>
              <p class="tagline">Premium Design Tools at Affordable Prices</p>
            </div>
            
            <div class="content">
              <div class="thank-you">
                <h1>Thank You for Your Purchase! 🎉</h1>
                <p>We're thrilled to have you as part of the Ansari Tools. Your Canva Pro subscription is now active and ready to use!</p>
              </div>
              
              <div class="subscription-card">
                <div class="card-title">
                  📋 Subscription Details
                </div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Email Address :&nbsp;</span>
                    <span class="detail-value">${email}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Duration :&nbsp;</span>
                    <span class="detail-value">${duration}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Start Date :&nbsp;</span>
                    <span class="detail-value">${new Date(subscriptionDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Expiry Date :&nbsp;</span>
                    <span class="detail-value">${expiryDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status :&nbsp;</span>
                    <span class="detail-value">
                      <span class="status-badge"> ✅ Active</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="warning-box">
                <strong>📌 Important:</strong> Please keep this email safe as it contains your subscription details. If you have any questions or need support, don't hesitate to contact us on WhatsApp:
                <div style="text-align: center; margin-top: 15px;">
                  <a href="https://wa.me/+923102204842" style="display: inline-block; background: #25D366; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 14px; font-weight: 600; box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3); transition: all 0.3s ease;">
                    💬 WhatsApp Support
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <p style="color: #0B2E33; font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                  Thank you for choosing Ansari Tools!
                </p>
                <p style="color: #666; font-size: 14px;">
                  We're excited to help you create amazing designs and grow your business with our premium tools.
                </p>
              </div>
              
              <p style="text-align: center; color: #0B2E33; font-weight: 600; margin: 20px 0;">
                Best regards,<br>
                <span style="color: #4F7C82;">The Ansari Tools Team</span>
              </p>
            </div>
            
            <div class="footer">
              <div class="social-links">
                <a href="#">Website</a> • 
                <a href="#">Support</a> • 
                <a href="#">Contact</a>
              </div>
              <p>This email was sent to ${email} because you have an active Canva Pro subscription with Ansari Tools.</p>
              <p>© 2024 Ansari Tools. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send general notification email
const sendNotificationEmail = async (email, subject, message) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Ansari Tools',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #0B2E33;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #0B2E33;
              margin-bottom: 10px;
            }
            .content {
              margin-bottom: 30px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎨 Ansari Tools</div>
              <p style="color: #4F7C82; font-size: 18px; margin: 0;">Premium Design Tools at Affordable Prices</p>
            </div>
            
            <div class="content">
              ${message}
            </div>
            
            <div class="footer">
              <p>© 2024 Ansari Tools. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendCanvaSubscriptionEmail,
  sendNotificationEmail
};
