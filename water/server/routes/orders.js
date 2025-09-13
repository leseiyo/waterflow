const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // adjust path if needed
const auth = require('../middleware/auth'); // adjust path if needed

// Get all orders for the logged-in consumer
router.get('/consumer/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ consumer: req.user.id }).populate('distributor');
    res.json(orders);
  } catch (error) {
    console.error('Fetch consumer orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;