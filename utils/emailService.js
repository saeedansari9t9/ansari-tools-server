const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Path to official assets
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const BLACK_LOGO_PATH = path.join(ASSETS_DIR, 'Ansari Tools Logo Black.png');
const GREY_LOGO_PATH = path.join(ASSETS_DIR, 'Ansari Tools Logo Grey.png');

// Helper to get standard CID attachments for logos
const getLogoAttachments = () => {
  const attachments = [];
  if (fs.existsSync(BLACK_LOGO_PATH)) {
    attachments.push({
      filename: 'ansari-tools-black.png',
      path: BLACK_LOGO_PATH,
      cid: 'ansari-logo-black'
    });
  }
  if (fs.existsSync(GREY_LOGO_PATH)) {
    attachments.push({
      filename: 'ansari-tools-grey.png',
      path: GREY_LOGO_PATH,
      cid: 'ansari-logo-grey'
    });
  }
  return attachments;
};

// Create transporter using SMTP (supports Namecheap Private Email and Gmail)
const createTransporter = () => {
  const isGmail = !process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_USER.endsWith('@gmail.com');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Namecheap Private Email / Custom SMTP
  const host = process.env.EMAIL_HOST || 'mail.privateemail.com';
  const port = parseInt(process.env.EMAIL_PORT, 10) || 465;
  const secure = process.env.EMAIL_SECURE !== undefined 
    ? process.env.EMAIL_SECURE === 'true' 
    : (port === 465);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * 1. Send Canva subscription notification email (Hostinger-inspired design)
 */
const sendCanvaSubscriptionEmail = async (email, duration = '1 Year', subscriptionDate = new Date()) => {
  try {
    const transporter = createTransporter();

    // Calculate expiry date based on plan
    const startDate = new Date(subscriptionDate);
    const expiryDate = new Date(subscriptionDate);
    if (duration === '1 Month') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (duration === '3 Months') {
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    } else if (duration === '6 Months') {
      expiryDate.setMonth(expiryDate.getMonth() + 6);
    } else if (duration === '1 Year') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const formattedStartDate = startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const mailOptions = {
      from: {
        name: 'Ansari Tools',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Your Canva Pro Subscription is Ready – Ansari Tools',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'Ansari Tools Email Service'
      },
      attachments: getLogoAttachments(),
      html: `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your Canva Pro Subscription is Ready</title>
  <style type="text/css">
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f4f5f8 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    /* Force pure white background in dark mode */
    @media (prefers-color-scheme: dark) {
      body, .email-bg {
        background-color: #f4f5f8 !important;
      }
      .email-card {
        background-color: #ffffff !important;
      }
      .heading-text {
        color: #111827 !important;
      }
      .body-text {
        color: #4b5563 !important;
      }
      .dark-card {
        background-color: #1F1739 !important;
      }
      .light-card {
        background-color: #f6f8fb !important;
      }
      .table-label {
        color: #6b7280 !important;
      }
      .table-val {
        color: #111827 !important;
      }
    }
    [data-ogsc] .email-card {
      background-color: #ffffff !important;
    }
    [data-ogsc] .heading-text {
      color: #111827 !important;
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 24px 10px; background-color: #f4f5f8;">
  <center style="width: 100%; background-color: #f4f5f8;">
    <!-- Container Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
      <tr>
        <td class="email-card" style="background-color: #ffffff; border-radius: 18px; padding: 36px 32px 32px 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); text-align: left;">
          
          <!-- Top Header: Brand Logo -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
            <tr>
              <td align="left" style="vertical-align: middle;">
                <a href="https://ansaritools.com" target="_blank" style="text-decoration: none; display: inline-block;">
                  <img src="cid:ansari-logo-black" alt="Ansari Tools" width="160" height="64" style="display: block; width: 160px; max-width: 160px; height: auto; border: 0;" />
                </a>
              </td>
            </tr>
          </table>

          <!-- Main Headline (Hostinger style) -->
          <h1 class="heading-text" style="margin: 0 0 16px 0; font-size: 28px; line-height: 1.25; font-weight: 700; color: #111827; letter-spacing: -0.5px;">
            Your Canva Pro subscription is ready – you’re all set to create
          </h1>

          <!-- Lead Paragraph -->
          <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
            Thank you for choosing Ansari Tools! We’ve successfully provisioned your official Canva Pro subscription on your email. You can now unlock premium templates, brand kits, background remover, and all pro design features.
          </p>

          <!-- Signature Hostinger Dark Card -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="dark-card" style="background-color: #1F1739; border-radius: 16px; margin: 0 0 28px 0;">
            <tr>
              <td style="padding: 28px 24px; text-align: left;">
                
                <div style="font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3; margin-bottom: 6px;">
                  Canva Pro Subscription
                </div>
                
                <div style="font-size: 14px; color: #d1c7f7; margin-bottom: 22px;">
                  Active for <strong style="color: #ffffff;">${duration}</strong> • Full Pro Team Access
                </div>

                <!-- CTA Button -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius: 12px; background-color: #6C5CE7;">
                      <a href="https://www.canva.com" target="_blank" style="background-color: #6C5CE7; border: 1px solid #6C5CE7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 12px; display: inline-block;">
                        Open Canva Account
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Warranty Sub-note -->
                <div style="margin-top: 20px; font-size: 13px; line-height: 1.5; color: #b8afdc;">
                  ✓ Includes <strong>100% replacement warranty</strong> &amp; dedicated WhatsApp support throughout your entire ${duration} plan.
                </div>

              </td>
            </tr>
          </table>

          <!-- Subscription Details Heading -->
          <div class="heading-text" style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">
            Subscription Summary &amp; Order Details:
          </div>

          <!-- Light Details Card (Hostinger style) -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="light-card" style="background-color: #f6f8fb; border-radius: 14px; margin: 0 0 24px 0; border: 1px solid #eef2f6;">
            <tr>
              <td style="padding: 20px 22px;">
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="table-label" style="padding: 8px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Registered Email:</td>
                    <td class="table-val" align="right" style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${email}</td>
                  </tr>
                  <tr>
                    <td class="table-label" style="padding: 8px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Plan Duration:</td>
                    <td class="table-val" align="right" style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${duration}</td>
                  </tr>
                  <tr>
                    <td class="table-label" style="padding: 8px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Start Date:</td>
                    <td class="table-val" align="right" style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${formattedStartDate}</td>
                  </tr>
                  <tr>
                    <td class="table-label" style="padding: 8px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Expiry Date:</td>
                    <td class="table-val" align="right" style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${formattedExpiryDate}</td>
                  </tr>
                  <tr>
                    <td class="table-label" style="padding: 8px 0 0 0; font-size: 13px; color: #6b7280;">Status:</td>
                    <td align="right" style="padding: 8px 0 0 0;">
                      <span style="display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ● Active &amp; Verified
                      </span>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

          <!-- Customer Support Card -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="light-card" style="background-color: #f6f8fb; border-radius: 14px; margin: 0 0 28px 0; border: 1px solid #eef2f6;">
            <tr>
              <td style="padding: 20px 22px;">
                <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 6px;">
                  Need support or have warranty questions?
                </div>
                <p style="margin: 0 0 14px 0; font-size: 13px; line-height: 1.5; color: #4b5563;">
                  Our official customer care team is available directly on WhatsApp. Simply message us with your email address for instant assistance or re-invites.
                </p>
                <a href="https://wa.me/923227866655" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff !important; font-size: 13px; font-weight: 600; text-decoration: none; padding: 9px 20px; border-radius: 10px;">
                  💬 WhatsApp Support (0322 7866655)
                </a>
              </td>
            </tr>
          </table>

          <!-- Clean Divider -->
          <div style="border-top: 1px solid #e5e7eb; margin: 28px 0 24px 0;"></div>

          <!-- Footer (Hostinger Style) -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left">
                <!-- Grey Logo in Footer -->
                <div style="margin-bottom: 16px;">
                  <img src="cid:ansari-logo-grey" alt="Ansari Tools" width="130" height="52" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0;" />
                </div>
                
                <p style="margin: 0 0 14px 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                  You have received this email as you are a registered customer at Ansari Tools with an active Canva Pro plan.
                </p>

                <!-- Navigation Links -->
                <div style="margin: 0 0 14px 0; font-size: 12px; color: #6b7280;">
                  <a href="https://wa.me/923227866655" target="_blank" style="color: #4b5563; font-weight: 600; text-decoration: none; margin-right: 14px;">WhatsApp</a>
                  <a href="https://ansaritools.com" target="_blank" style="color: #4b5563; font-weight: 600; text-decoration: none; margin-right: 14px;">Website</a>
                  <a href="https://ansaritools.com/contact" target="_blank" style="color: #4b5563; font-weight: 600; text-decoration: none; margin-right: 14px;">Help Center</a>
                  <a href="https://ansaritools.com" target="_blank" style="color: #4b5563; font-weight: 600; text-decoration: none;">Privacy Policy</a>
                </div>

                <!-- Copyright -->
                <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                  &copy; 2024-${new Date().getFullYear()} Ansari Tools International. All rights reserved.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </center>
</body>
</html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Canva subscription email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Error sending Canva subscription email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 2. Send custom broadcast notification email to subscribers (Hostinger-inspired design)
 */
const sendBroadcastEmail = async ({
  email,
  duration = 'Canva Pro',
  subject = 'Ansari Tools: Customer Support & Official WhatsApp Update',
  customMessage = '',
  newWhatsApp = '+92 322 7866655',
  newWhatsAppDisplay = '0322 7866655'
}) => {
  try {
    const transporter = createTransporter();
    const cleanWhatsAppDigits = (newWhatsApp || '923227866655').replace(/[^0-9]/g, '');

    const whatsappUrl = `https://wa.me/${cleanWhatsAppDigits}`;
    const telUrl = `tel:+${cleanWhatsAppDigits}`;

    const cleanSubject = (subject || 'Ansari Tools: Customer Support & Official WhatsApp Update')
      .replace(/[🚨🔥⚠️‼️]/g, '')
      .trim();

    // Format plain text lines to elegant paragraphs
    const formattedHtmlMessage = customMessage
      ? customMessage
          .split('\n\n')
          .map(paragraph => `<p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">${paragraph.replace(/\n/g, '<br/>')}</p>`)
          .join('')
      : `
        <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
          Assalam-o-Alaikum / Hello Valued Customer,
        </p>
        <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
          This official notice is to inform you that the official customer support and inquiry WhatsApp number for <strong>Ansari Tools</strong> has been updated.
        </p>
        <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
          For all future Canva subscriptions, renewal discounts, technical queries, and instant warranty replacements, please contact our team exclusively on our new number.
        </p>
      `;

    const mailOptions = {
      from: {
        name: 'Ansari Tools',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: cleanSubject,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'Ansari Tools Email Service'
      },
      attachments: getLogoAttachments(),
      html: `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${cleanSubject}</title>
  <style type="text/css">
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f4f5f8 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    /* Force white container across dark modes (Hostinger style) */
    @media (prefers-color-scheme: dark) {
      body, .email-bg {
        background-color: #f4f5f8 !important;
      }
      .email-card {
        background-color: #ffffff !important;
      }
      .heading-text {
        color: #111827 !important;
      }
      .body-text {
        color: #4b5563 !important;
      }
      .dark-card {
        background-color: #1F1739 !important;
      }
      .light-card {
        background-color: #f6f8fb !important;
      }
    }
    [data-ogsc] .email-card {
      background-color: #ffffff !important;
    }
    [data-ogsc] .heading-text {
      color: #111827 !important;
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 24px 10px; background-color: #f4f5f8;">
  <center style="width: 100%; background-color: #f4f5f8;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
      <tr>
        <td class="email-card" style="background-color: #ffffff; border-radius: 18px; padding: 36px 32px 32px 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); text-align: left;">
          
          <!-- Top Header: Brand Logo -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
            <tr>
              <td align="left" style="vertical-align: middle;">
                <a href="https://ansaritools.com" target="_blank" style="text-decoration: none; display: inline-block;">
                  <img src="cid:ansari-logo-black" alt="Ansari Tools" width="160" height="64" style="display: block; width: 160px; max-width: 160px; height: auto; border: 0;" />
                </a>
              </td>
            </tr>
          </table>

          <!-- Main Headline (Hostinger style) -->
          <h1 class="heading-text" style="margin: 0 0 16px 0; font-size: 28px; line-height: 1.25; font-weight: 700; color: #111827; letter-spacing: -0.5px;">
            Official Support Notice – you’re just a message away
          </h1>

          <!-- Formatted Content Message -->
          <div style="margin-bottom: 24px;">
            ${formattedHtmlMessage}
          </div>

          <!-- Signature Hostinger Dark Card -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="dark-card" style="background-color: #1F1739; border-radius: 16px; margin: 0 0 28px 0;">
            <tr>
              <td style="padding: 28px 24px; text-align: left;">
                
                <div style="font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3; margin-bottom: 6px;">
                  New Official WhatsApp Support
                </div>
                
                <div style="font-size: 16px; font-weight: 600; color: #d1c7f7; margin-bottom: 22px;">
                  <a href="${telUrl}" style="color: #d1c7f7; text-decoration: none;">${newWhatsAppDisplay || newWhatsApp}</a>
                </div>

                <!-- CTA Button (Hostinger Purple Button) -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius: 12px; background-color: #6C5CE7;">
                      <a href="${whatsappUrl}" target="_blank" style="background-color: #6C5CE7; border: 1px solid #6C5CE7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 12px; display: inline-block;">
                        Message on WhatsApp
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Sub-note inside dark card -->
                <div style="margin-top: 20px; font-size: 13px; line-height: 1.5; color: #b8afdc;">
                  Please save <strong>${newWhatsAppDisplay || newWhatsApp}</strong> in your phone contacts as <strong>"Ansari Tools"</strong> for instant warranty assistance.
                </div>

              </td>
            </tr>
          </table>

          <!-- Important Subscriber Notes Card (Hostinger Light Card Style) -->
          <div class="heading-text" style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">
            Important Subscriber Guidelines:
          </div>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="light-card" style="background-color: #f6f8fb; border-radius: 14px; margin: 0 0 24px 0; border: 1px solid #eef2f6;">
            <tr>
              <td style="padding: 20px 22px;">
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">📌 Warranty Claims:</strong> Simply text your registered email address (<span style="color: #6C5CE7; font-weight: 600;">${email}</span>) to our new WhatsApp number for fast warranty re-invites.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">🎁 Renewal Deals:</strong> Get lowest discounted rates when renewing your Canva Pro, ChatGPT, and other digital tools through our WhatsApp.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">⚡ Fast Response:</strong> Dedicated support replies within minutes during business hours.
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

          <!-- Subscriber Metadata pill box -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafbfc; border-radius: 10px; border: 1px solid #f1f3f5; margin-bottom: 28px;">
            <tr>
              <td style="padding: 12px 16px; font-size: 12px; color: #6b7280;">
                <span style="font-weight: 600; color: #374151;">Recipient:</span> ${email}
                <span style="float: right;"><span style="font-weight: 600; color: #374151;">Plan:</span> ${duration}</span>
              </td>
            </tr>
          </table>

          <!-- Clean Divider -->
          <div style="border-top: 1px solid #e5e7eb; margin: 28px 0 24px 0;"></div>

          <!-- Footer (Hostinger Style) -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left">
                <!-- Grey Logo in Footer -->
                <div style="margin-bottom: 16px;">
                  <img src="cid:ansari-logo-grey" alt="Ansari Tools" width="130" height="52" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0;" />
                </div>
                
                <p style="margin: 0 0 14px 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                  You have received this email as you are a registered customer at Ansari Tools. For queries, contact support@ansaritools.com.
                </p>

                <!-- Navigation Links -->
                <div style="margin: 0 0 14px 0; font-size: 12px; color: #6b7280;">
                  <a href="${whatsappUrl}" target="_blank" style="color: #4b5563; font-weight: 600; text-decoration: none; margin-right: 14px;">WhatsApp</a>
                  <a href="https://ansaritools.com" target="_blank" style="color: #4b5563; font-weight: 600; text-decoration: none; margin-right: 14px;">Official Website</a>
                  <a href="https://ansaritools.com/contact" target="_blank" style="color: #4b5563; font-weight: 600; text-decoration: none; margin-right: 14px;">Help Center</a>
                  <a href="https://ansaritools.com" target="_blank" style="color: #4b5563; font-weight: 600; text-decoration: none;">Privacy Policy</a>
                </div>

                <!-- Copyright -->
                <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                  &copy; 2024-${new Date().getFullYear()} Ansari Tools International. All rights reserved.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </center>
</body>
</html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Broadcast email sent successfully to', email, 'MessageId:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error in sendBroadcastEmail for', email, error);
    return { success: false, error: error.message };
  }
};

/**
 * 3. Send general notification email (Hostinger style)
 */
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
      attachments: getLogoAttachments(),
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #f4f5f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <center>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 18px; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: left;">
      <tr>
        <td>
          <div style="margin-bottom: 24px;">
            <img src="cid:ansari-logo-black" alt="Ansari Tools" width="160" height="64" style="display: block; width: 160px; height: auto; border: 0;" />
          </div>
          <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">${subject}</h2>
          <div style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
            ${message}
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af;">
            &copy; 2024-${new Date().getFullYear()} Ansari Tools. All rights reserved.
          </div>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 4. Verify SMTP connection
 */
const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully' };
  } catch (error) {
    console.error('SMTP Verification Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendCanvaSubscriptionEmail,
  sendNotificationEmail,
  sendBroadcastEmail,
  verifyEmailConnection
};
