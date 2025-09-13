const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Distributor = require('../models/Distributor');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const distributor = await Distributor.findById(decoded.id);
    
    if (!distributor) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    req.distributor = distributor;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Register new distributor
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Valid phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates required'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('waterSupply.capacity').isNumeric().withMessage('Valid capacity is required'),
  body('workingHours.start').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time required'),
  body('workingHours.end').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required'),
  body('transportMode').isIn(['truck', 'motorcycle', 'bicycle', 'walking', 'boat']).withMessage('Valid transport mode required'),
  body('pricing.basePrice').isNumeric().withMessage('Valid base price required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, ...distributorData } = req.body;

    // Check if distributor already exists
    const existingDistributor = await Distributor.findOne({ email });
    if (existingDistributor) {
      return res.status(400).json({ message: 'Distributor with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create distributor
    const distributor = new Distributor({
      ...distributorData,
      email,
      password: hashedPassword
    });

    await distributor.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: distributor._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Distributor registered successfully',
      token,
      distributor: {
        id: distributor._id,
        name: distributor.name,
        email: distributor.email,
        location: distributor.location,
        rating: distributor.rating
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login distributor
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

    // Find distributor
    const distributor = await Distributor.findOne({ email });
    if (!distributor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, distributor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: distributor._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      distributor: {
        id: distributor._id,
        name: distributor.name,
        email: distributor.email,
        location: distributor.location,
        rating: distributor.rating,
        isAvailable: distributor.isAvailable()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get distributor profile
router.get('/profile', auth, async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.distributor._id)
      .select('-password');
    
    res.json(distributor);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update distributor profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password update through this route
    
    const distributor = await Distributor.findByIdAndUpdate(
      req.distributor._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(distributor);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search distributors by location
router.get('/search', async (req, res) => {
  try {
    const { location } = req.query;
    const distributors = await Distributor.find(
      location ? { address: { $regex: location, $options: 'i' } } : {}
    );
    res.json(distributors);
  } catch (error) {
    console.error('Distributor search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get distributor by ID
router.get('/:id', async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.params.id)
      .select('-password');
    
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }
    
    res.json(distributor);
  } catch (error) {
    console.error('Get distributor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update distributor availability
router.patch('/availability', auth, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const distributor = await Distributor.findByIdAndUpdate(
      req.distributor._id,
      { isActive },
      { new: true }
    ).select('-password');
    
    res.json(distributor);
  } catch (error) {
    console.error('Availability update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update water supply
router.patch('/supply', auth, async (req, res) => {
  try {
    const { availableQuantity } = req.body;
    
    const distributor = await Distributor.findByIdAndUpdate(
      req.distributor._id,
      { 'waterSupply.availableQuantity': availableQuantity },
      { new: true }
    ).select('-password');
    
    res.json(distributor);
  } catch (error) {
    console.error('Supply update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;