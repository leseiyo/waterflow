const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// In-memory storage for orders
const orders = global.inMemoryDB.orders || [];

// Helper function to find order by ID
const findOrderById = (id) => {
  return orders.find(order => order._id === id);
};

// Helper function to find consumer by ID
const findConsumerById = (id) => {
  const consumers = global.inMemoryDB.consumers || [];
  return consumers.find(consumer => consumer._id === id);
};

// Helper function to find distributor by ID
const findDistributorById = (id) => {
  const distributors = global.inMemoryDB.distributors || [];
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
    
    // Check if user exists in either consumers or distributors
    const consumer = findConsumerById(decoded.id);
    const distributor = findDistributorById(decoded.id);
    
    if (!consumer && !distributor) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    req.user = consumer || distributor;
    req.userType = consumer ? 'consumer' : 'distributor';
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Create new order
router.post('/', auth, [
  body('distributorId').notEmpty().withMessage('Distributor ID is required'),
  body('quantity').isNumeric().withMessage('Valid quantity is required'),
  body('unit').isIn(['liters', 'gallons', 'bottles']).withMessage('Valid unit is required'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { distributorId, quantity, unit, deliveryAddress, specialInstructions } = req.body;

    // Check if distributor exists
    const distributor = findDistributorById(distributorId);
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }

    // Calculate total amount (simple calculation)
    const basePrice = 2; // $2 per unit
    const totalAmount = quantity * basePrice;

    // Create order
    const order = {
      _id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      consumerId: req.user._id,
      distributorId: distributorId,
      quantity: quantity,
      unit: unit,
      totalAmount: totalAmount,
      deliveryAddress: deliveryAddress,
      specialInstructions: specialInstructions || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to in-memory storage
    orders.push(order);
    global.inMemoryDB.orders = orders;

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...order,
        consumer: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email
        },
        distributor: {
          id: distributor._id,
          name: distributor.name,
          email: distributor.email
        }
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consumer orders
router.get('/consumer/orders', auth, async (req, res) => {
  try {
    const consumerOrders = orders
      .filter(order => order.consumerId === req.user._id)
      .map(order => {
        const distributor = findDistributorById(order.distributorId);
        return {
          ...order,
          distributor: distributor ? {
            id: distributor._id,
            name: distributor.name,
            rating: distributor.rating
          } : null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(consumerOrders);
  } catch (error) {
    console.error('Get consumer orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get distributor orders
router.get('/distributor/orders', auth, async (req, res) => {
  try {
    const distributorOrders = orders
      .filter(order => order.distributorId === req.user._id)
      .map(order => {
        const consumer = findConsumerById(order.consumerId);
        return {
          ...order,
          consumer: consumer ? {
            id: consumer._id,
            name: consumer.name,
            email: consumer.email
          } : null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(distributorOrders);
  } catch (error) {
    console.error('Get distributor orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/:orderId/status', auth, [
  body('status').isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const orderIndex = orders.findIndex(order => order._id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[orderIndex];

    // Check if user has permission to update this order
    if (req.userType === 'consumer' && order.consumerId !== req.user._id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.userType === 'distributor' && order.distributorId !== req.user._id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update order status
    orders[orderIndex] = {
      ...order,
      status: status,
      updatedAt: new Date()
    };

    res.json({
      message: 'Order status updated successfully',
      order: orders[orderIndex]
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order by ID
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = findOrderById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has permission to view this order
    if (req.userType === 'consumer' && order.consumerId !== req.user._id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.userType === 'distributor' && order.distributorId !== req.user._id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const consumer = findConsumerById(order.consumerId);
    const distributor = findDistributorById(order.distributorId);

    res.json({
      ...order,
      consumer: consumer ? {
        id: consumer._id,
        name: consumer.name,
        email: consumer.email
      } : null,
      distributor: distributor ? {
        id: distributor._id,
        name: distributor.name,
        rating: distributor.rating
      } : null
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 