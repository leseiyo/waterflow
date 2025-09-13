const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// In-memory storage for consumers
const consumers = global.inMemoryDB.consumers || [];

// Helper function to find consumer by email
const findConsumerByEmail = (email) => {
  return consumers.find(consumer => consumer.email === email);
};

// Helper function to find consumer by ID
const findConsumerById = (id) => {
  return consumers.find(consumer => consumer._id === id);
};

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const consumer = findConsumerById(decoded.id);
    
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
  body('address').trim().notEmpty().withMessage('Address is required')
], async (req, res) => {
  try {
    console.log('Consumer register request body:', req.body);
    console.log('Consumer register request headers:', req.headers);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, ...consumerData } = req.body;

    // Check if consumer already exists
    const existingConsumer = findConsumerByEmail(email);
    if (existingConsumer) {
      return res.status(400).json({ message: 'Consumer with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create consumer with unique ID
    const consumer = {
      _id: `consumer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...consumerData,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalOrders: 0,
      totalSpent: 0,
      preferences: {
        deliveryTime: 'anytime',
        notifications: true,
        autoReorder: false
      }
    };

    // Add to in-memory storage
    consumers.push(consumer);
    global.inMemoryDB.consumers = consumers;

    // Generate JWT token
    const token = jwt.sign(
      { id: consumer._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('Consumer registered successfully:', { id: consumer._id, email: consumer.email });

    res.status(201).json({
      message: 'Consumer registered successfully',
      token,
      user: {
        id: consumer._id,
        name: consumer.name,
        email: consumer.email,
        phone: consumer.phone,
        address: consumer.address,
        userType: 'consumer'
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
    console.log('Consumer login request body:', req.body);
    console.log('Consumer login request headers:', req.headers);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find consumer
    const consumer = findConsumerByEmail(email);
    if (!consumer) {
      console.log('Consumer not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, consumer.password);
    if (!isMatch) {
      console.log('Password mismatch for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: consumer._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('Consumer login successful:', { id: consumer._id, email: consumer.email });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: consumer._id,
        name: consumer.name,
        email: consumer.email,
        phone: consumer.phone,
        address: consumer.address,
        userType: 'consumer',
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
    const { password, ...consumerWithoutPassword } = req.consumer;
    res.json(consumerWithoutPassword);
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
    
    const consumerIndex = consumers.findIndex(c => c._id === req.consumer._id);
    if (consumerIndex === -1) {
      return res.status(404).json({ message: 'Consumer not found' });
    }

    // Update consumer
    consumers[consumerIndex] = {
      ...consumers[consumerIndex],
      ...updates,
      updatedAt: new Date()
    };

    const { password, ...consumerWithoutPassword } = consumers[consumerIndex];
    res.json(consumerWithoutPassword);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consumer order history
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = global.inMemoryDB.orders || [];
    const consumerOrders = orders
      .filter(order => order.consumerId === req.consumer._id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    
    res.json(consumerOrders);
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consumer by ID (for public profile)
router.get('/:id', async (req, res) => {
  try {
    const consumer = findConsumerById(req.params.id);
    
    if (!consumer) {
      return res.status(404).json({ message: 'Consumer not found' });
    }
    
    const { password, email, phone, ...publicProfile } = consumer;
    res.json(publicProfile);
  } catch (error) {
    console.error('Get consumer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 