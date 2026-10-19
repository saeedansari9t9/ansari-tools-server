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
    default: 'Official Support Notice – you’re just a message away'
  },
  subject: {
    type: String,
    default: 'Ansari Tools: Customer Support & Official WhatsApp Update'
  },
  customMessage: {
    type: String,
    default: `Assalam-o-Alaikum / Hello,

Yeh zaroori email aapko yeh itla dene ke liye bheja ja raha hai ke Ansari Tools ka official WhatsApp contact number change ho gaya hai.

Aainda tamaam Canva subscription queries, renewal deals, aur warranty claims ke liye brahe meharbani hamare naye number par contact karein.

📌 Please save our new number in your phone contacts immediately as "Ansari Tools":
New WhatsApp Number: 0322 7866655 (+92 322 7866655)

Agar aapke Canva account me koi masla ya warranty claim ho, to isi new number par apna email text karein, hum foran solve karenge.

Shukriya,
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
