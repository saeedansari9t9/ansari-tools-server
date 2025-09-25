const express = require('express');
const router = express.Router();
const CanvaSubscription = require('../models/CanvaSubscription');

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
    const { email, duration, date, status = 'active' } = req.body;

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
    res.status(201).json(savedSubscription);
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

// GET statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const total = await CanvaSubscription.countDocuments();
    const active = await CanvaSubscription.countDocuments({ status: 'active' });
    const inactive = await CanvaSubscription.countDocuments({ status: 'inactive' });
    const expired = await CanvaSubscription.countDocuments({ status: 'expired' });
    
    const sixMonths = await CanvaSubscription.countDocuments({ duration: '6 Months' });
    const oneYear = await CanvaSubscription.countDocuments({ duration: '1 Year' });

    res.json({
      total,
      active,
      inactive,
      expired,
      sixMonths,
      oneYear
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;
