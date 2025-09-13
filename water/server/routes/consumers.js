const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Consumer = require('../models/Consumer');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const consumer = await Consumer.findById(decoded.id);
    
    if (!consumer) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    req.consumer = consumer;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Register new consumer
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Valid phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates required'),
  body('location.address').trim().notEmpty().withMessage('Address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, ...consumerData } = req.body;

    // Check if consumer already exists
    const existingConsumer = await Consumer.findOne({ email });
    if (existingConsumer) {
      return res.status(400).json({ message: 'Consumer with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create consumer
    const consumer = new Consumer({
      ...consumerData,
      email,
      password: hashedPassword
    });

    await consumer.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: consumer._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Consumer registered successfully',
      token,
      consumer: {
        id: consumer._id,
        name: consumer.name,
        email: consumer.email,
        location: consumer.location
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login consumer
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find consumer
    const consumer = await Consumer.findOne({ email });
    if (!consumer) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, consumer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: consumer._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      consumer: {
        id: consumer._id,
        name: consumer.name,
        email: consumer.email,
        location: consumer.location,
        totalOrders: consumer.totalOrders,
        totalSpent: consumer.totalSpent
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consumer profile
router.get('/profile', auth, async (req, res) => {
  try {
    const consumer = await Consumer.findById(req.consumer._id)
      .select('-password');
    
    res.json(consumer);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update consumer profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password update through this route
    
    const consumer = await Consumer.findByIdAndUpdate(
      req.consumer._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(consumer);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update consumer location
router.patch('/location', auth, async (req, res) => {
  try {
    const { coordinates, address } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Valid coordinates are required' });
    }

    const consumer = await Consumer.findByIdAndUpdate(
      req.consumer._id,
      {
        location: {
          type: 'Point',
          coordinates,
          address: address || req.consumer.location.address
        }
      },
      { new: true }
    ).select('-password');
    
    res.json(consumer);
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consumer order history
router.get('/orders', auth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({ consumer: req.consumer._id })
      .populate('distributor', 'name rating')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(orders);
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consumer by ID (for public profile)
router.get('/:id', async (req, res) => {
  try {
    const consumer = await Consumer.findById(req.params.id)
      .select('-password -email -phone');
    
    if (!consumer) {
      return res.status(404).json({ message: 'Consumer not found' });
    }
    
    res.json(consumer);
  } catch (error) {
    console.error('Get consumer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 