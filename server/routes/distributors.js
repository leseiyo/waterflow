const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// In-memory storage for distributors
const distributors = global.inMemoryDB.distributors || [];

// Helper function to find distributor by email
const findDistributorByEmail = (email) => {
  return distributors.find(distributor => distributor.email === email);
};

// Helper function to find distributor by ID
const findDistributorById = (id) => {
  return distributors.find(distributor => distributor._id === id);
};

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const distributor = findDistributorById(decoded.id);
    
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
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('waterSupply').trim().notEmpty().withMessage('Water supply type is required'),
  body('workingHours').trim().notEmpty().withMessage('Working hours are required'),
  body('transportMode').isIn(['truck', 'motorcycle', 'bicycle', 'walking', 'boat']).withMessage('Valid transport mode required'),
  body('pricing').trim().notEmpty().withMessage('Pricing information is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, ...distributorData } = req.body;

    // Check if distributor already exists
    const existingDistributor = findDistributorByEmail(email);
    if (existingDistributor) {
      return res.status(400).json({ message: 'Distributor with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create distributor with unique ID
    const distributor = {
      _id: `distributor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...distributorData,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      rating: 0,
      totalOrders: 0,
      totalEarnings: 0,
      preferences: {
        notifications: true,
        autoAccept: false,
        maxOrdersPerDay: 10
      }
    };

    // Add to in-memory storage
    distributors.push(distributor);
    global.inMemoryDB.distributors = distributors;

    // Generate JWT token
    const token = jwt.sign(
      { id: distributor._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Distributor registered successfully',
      token,
      user: {
        id: distributor._id,
        name: distributor.name,
        email: distributor.email,
        phone: distributor.phone,
        address: distributor.address,
        userType: 'distributor',
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
    const distributor = findDistributorByEmail(email);
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
      user: {
        id: distributor._id,
        name: distributor.name,
        email: distributor.email,
        phone: distributor.phone,
        address: distributor.address,
        userType: 'distributor',
        rating: distributor.rating,
        totalOrders: distributor.totalOrders,
        totalEarnings: distributor.totalEarnings
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
    const { password, ...distributorWithoutPassword } = req.distributor;
    res.json(distributorWithoutPassword);
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
    
    const distributorIndex = distributors.findIndex(d => d._id === req.distributor._id);
    if (distributorIndex === -1) {
      return res.status(404).json({ message: 'Distributor not found' });
    }

    // Update distributor
    distributors[distributorIndex] = {
      ...distributors[distributorIndex],
      ...updates,
      updatedAt: new Date()
    };

    const { password, ...distributorWithoutPassword } = distributors[distributorIndex];
    res.json(distributorWithoutPassword);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get distributor orders
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = global.inMemoryDB.orders || [];
    const distributorOrders = orders
      .filter(order => order.distributorId === req.distributor._id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(distributorOrders);
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search distributors
router.get('/search', async (req, res) => {
  try {
    const { location } = req.query;
    
    // For now, return all distributors (in a real app, you'd filter by location)
    const publicDistributors = distributors.map(distributor => ({
      _id: distributor._id,
      name: distributor.name,
      address: distributor.address,
      phone: distributor.phone,
      waterSupply: distributor.waterSupply,
      pricing: distributor.pricing,
      rating: distributor.rating,
      workingHours: distributor.workingHours,
      transportMode: distributor.transportMode
    }));
    
    res.json(publicDistributors);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get distributor by ID (for public profile)
router.get('/:id', async (req, res) => {
  try {
    const distributor = findDistributorById(req.params.id);
    
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }
    
    const { password, email, phone, ...publicProfile } = distributor;
    res.json(publicProfile);
  } catch (error) {
    console.error('Get distributor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 