const express = require('express');
const router = express.Router();
const CanvaSubscription = require('../models/CanvaSubscription');
const { sendCanvaSubscriptionEmail, sendBroadcastEmail } = require('../utils/emailService');
const websiteAdminAuth = require('../middleware/websiteAdminAuth');

router.use(websiteAdminAuth);

// Keep static routes before /:id so Express does not treat them as an id.
router.get('/stats/overview', async (req, res) => {
  try {
    const [total, active, inactive, expired, oneMonth, threeMonths, sixMonths, oneYear] = await Promise.all([
      CanvaSubscription.countDocuments(),
      CanvaSubscription.countDocuments({ status: 'active' }),
      CanvaSubscription.countDocuments({ status: 'inactive' }),
      CanvaSubscription.countDocuments({ status: 'expired' }),
      CanvaSubscription.countDocuments({ duration: '1 Month' }),
      CanvaSubscription.countDocuments({ duration: '3 Months' }),
      CanvaSubscription.countDocuments({ duration: '6 Months' }),
      CanvaSubscription.countDocuments({ duration: '1 Year' }),
    ]);
    return res.json({ total, active, inactive, expired, oneMonth, threeMonths, sixMonths, oneYear });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// GET broadcast subscribers list with stats
router.get('/broadcast/list', async (req, res) => {
  try {
    const { status, duration, broadcastStatus, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (duration && duration !== 'all') {
      query.duration = duration;
    }
    if (broadcastStatus === 'sent') {
      query.lastBroadcastDate = { $ne: null };
    } else if (broadcastStatus === 'pending') {
      query.lastBroadcastDate = null;
    }
    if (search && search.trim()) {
      query.email = { $regex: search.trim(), $options: 'i' };
    }

    const [subscribers, totalCount, sentCount, pendingCount] = await Promise.all([
      CanvaSubscription.find(query)
        .select('_id email duration date status lastBroadcastDate createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      CanvaSubscription.countDocuments(),
      CanvaSubscription.countDocuments({ lastBroadcastDate: { $ne: null } }),
      CanvaSubscription.countDocuments({ lastBroadcastDate: null })
    ]);

    return res.json({
      subscribers,
      filteredCount: subscribers.length,
      totalCount,
      sentCount,
      pendingCount
    });
  } catch (error) {
    console.error('Error fetching broadcast subscribers:', error);
    return res.status(500).json({ message: 'Error fetching subscribers for broadcast', error: error.message });
  }
});

// Helper sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// POST send test broadcast email
router.post('/broadcast/send-test', async (req, res) => {
  try {
    const { testEmail, subject, message, newWhatsApp, newWhatsAppDisplay } = req.body;
    if (!testEmail) {
      return res.status(400).json({ message: 'Test email is required' });
    }

    const result = await sendBroadcastEmail({
      email: testEmail.toLowerCase().trim(),
      duration: '1 Year (Sample)',
      subject: subject || 'Ansari Tools: Customer Support & Official WhatsApp Update',
      customMessage: message,
      newWhatsApp: newWhatsApp || '+92 322 7866655',
      newWhatsAppDisplay: newWhatsAppDisplay || '0322 7866655'
    });

    if (result.success) {
      return res.json({ success: true, message: `Test email sent to ${testEmail}`, messageId: result.messageId });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send test email', error: result.error });
    }
  } catch (error) {
    console.error('Error sending test broadcast email:', error);
    return res.status(500).json({ message: 'Error sending test email', error: error.message });
  }
});

// POST send batch broadcast emails
router.post('/broadcast/send-batch', async (req, res) => {
  try {
    const {
      subscribers = [],
      subject,
      message,
      newWhatsApp = '+92 322 7866655',
      newWhatsAppDisplay = '0322 7866655',
      delayMs = 1000
    } = req.body;

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({ message: 'No subscribers provided' });
    }

    if (subscribers.length > 50) {
      return res.status(400).json({ message: 'Batch size too large. Maximum 50 per sub-batch request.' });
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i++) {
      const sub = subscribers[i];
      if (!sub || !sub.email) continue;

      const emailResult = await sendBroadcastEmail({
        email: sub.email.toLowerCase().trim(),
        duration: sub.duration || 'Canva Pro',
        subject: subject || 'Ansari Tools: Customer Support & Official WhatsApp Update',
        customMessage: message,
        newWhatsApp,
        newWhatsAppDisplay
      });

      if (emailResult.success) {
        successful++;
        if (sub.id) {
          await CanvaSubscription.findByIdAndUpdate(sub.id, {
            lastBroadcastDate: new Date()
          }).catch(err => console.error('Error updating subscriber lastBroadcastDate:', err));
        }
        results.push({ id: sub.id, email: sub.email, success: true });
      } else {
        failed++;
        results.push({ id: sub.id, email: sub.email, success: false, error: emailResult.error });
      }

      // Delay between emails to respect Gmail rate limits
      if (i < subscribers.length - 1 && delayMs > 0) {
        await sleep(Math.min(delayMs, 3000));
      }
    }

    return res.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      results
    });
  } catch (error) {
    console.error('Error processing broadcast batch:', error);
    return res.status(500).json({ message: 'Error processing broadcast batch', error: error.message });
  }
});

// POST reset broadcast status
router.post('/broadcast/reset-status', async (req, res) => {
  try {
    const { ids, resetAll } = req.body;
    let filter = {};
    if (!resetAll && Array.isArray(ids) && ids.length > 0) {
      filter = { _id: { $in: ids } };
    }
    const updateResult = await CanvaSubscription.updateMany(filter, {
      $set: { lastBroadcastDate: null }
    });
    return res.json({ success: true, modifiedCount: updateResult.modifiedCount });
  } catch (error) {
    console.error('Error resetting broadcast status:', error);
    return res.status(500).json({ message: 'Error resetting broadcast status', error: error.message });
  }
});

// GET all canva subscriptions
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by email if provided
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const subscriptions = await CanvaSubscription.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await CanvaSubscription.countDocuments(query);

    res.json({
      subscriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching canva subscriptions', error: error.message });
  }
});

// GET single canva subscription
router.get('/:id', async (req, res) => {
  try {
    const subscription = await CanvaSubscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Canva subscription not found' });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching canva subscription', error: error.message });
  }
});

// POST create new canva subscription
router.post('/', async (req, res) => {
  try {
    const { email, duration, date, status = 'active', sendEmail } = req.body;

    // Check if email already exists with active status
    const existingSubscription = await CanvaSubscription.findOne({
      email: email.toLowerCase(),
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        message: 'An active subscription already exists for this email'
      });
    }

    const subscription = new CanvaSubscription({
      email: email.toLowerCase(),
      duration,
      date: date ? new Date(date) : new Date(),
      status
    });

    const savedSubscription = await subscription.save();
    console.log('✅ Subscription saved:', savedSubscription.email, savedSubscription.duration);

    let emailSent = false;
    // Send email notification only when not explicitly disabled
    const shouldSend = sendEmail !== false; // default true
    if (shouldSend) {
      console.log('📧 Attempting to send email to:', savedSubscription.email);
      try {
        const emailResult = await sendCanvaSubscriptionEmail(
          savedSubscription.email,
          savedSubscription.duration,
          savedSubscription.date
        );
        emailSent = !!emailResult.success;
        if (emailResult.success) {
          console.log('✅ Email sent successfully to:', savedSubscription.email);
          console.log('📧 Message ID:', emailResult.messageId);
        } else {
          console.error('❌ Failed to send email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
        // Don't fail the subscription creation if email fails
      }
    }

    res.status(201).json({
      ...savedSubscription.toObject(),
      emailSent
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Error creating canva subscription', error: error.message });
  }
});

// PUT update canva subscription
router.put('/:id', async (req, res) => {
  try {
    const { email, duration, date, status } = req.body;

    const subscription = await CanvaSubscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Canva subscription not found' });
    }

    // Check if email already exists with active status (excluding current subscription)
    if (email && email !== subscription.email) {
      const existingSubscription = await CanvaSubscription.findOne({
        email: email.toLowerCase(),
        status: 'active',
        _id: { $ne: req.params.id }
      });

      if (existingSubscription) {
        return res.status(400).json({
          message: 'An active subscription already exists for this email'
        });
      }
    }

    const updateData = {};
    if (email) updateData.email = email.toLowerCase();
    if (duration) updateData.duration = duration;
    if (date) updateData.date = new Date(date);
    if (status) updateData.status = status;

    const updatedSubscription = await CanvaSubscription.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedSubscription);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Error updating canva subscription', error: error.message });
  }
});

// DELETE canva subscription
router.delete('/:id', async (req, res) => {
  try {
    const subscription = await CanvaSubscription.findByIdAndDelete(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Canva subscription not found' });
    }
    res.json({ message: 'Canva subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting canva subscription', error: error.message });
  }
});

module.exports = router;
