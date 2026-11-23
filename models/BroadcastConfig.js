const mongoose = require('mongoose');

const broadcastConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'default'
  },
  activeTemplate: {
    type: String,
    default: 'numberChange'
  },
  heading: {
    type: String,
    default: 'Our WhatsApp Number Has Changed'
  },
  subject: {
    type: String,
    default: 'Important: Ansari Tools WhatsApp Number Has Changed 📢'
  },
  customMessage: {
    type: String,
    default: `Assalam-o-Alaikum,

We’re contacting you as a valued customer of Ansari Tools to inform you that our previous WhatsApp number is no longer active.

📌 Please save our new official WhatsApp number as “Ansari Tools”:
+92 322 7866655

Going forward, please use this number for all product queries, subscription renewals, support, and warranty claims.
If you need assistance with an active subscription, simply message us with your registered email address, and our team will assist you.

Thank you for choosing Ansari Tools.

Best regards,
Ansari Tools Team`
  },
  newWhatsApp: {
    type: String,
    default: '+92 322 7866655'
  },
  newWhatsAppDisplay: {
    type: String,
    default: '0322 7866655'
  },
  delayMs: {
    type: Number,
    default: 1000
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BroadcastConfig', broadcastConfigSchema);
