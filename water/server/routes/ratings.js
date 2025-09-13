const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Rating = require('../models/Rating');
const Order = require('../models/Order');
const Consumer = require('../models/Consumer');
const Distributor = require('../models/Distributor');

// Middleware to verify JWT token for consumers
const consumerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const jwt = require('jsonwebtoken');
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

// Middleware to verify JWT token for distributors
const distributorAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const jwt = require('jsonwebtoken');
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

// Create rating and review
router.post('/', consumerAuth, [
  body('orderId').isMongoId().withMessage('Valid order ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 500 }).withMessage('Review must be less than 500 characters'),
  body('categories.waterQuality').optional().isInt({ min: 1, max: 5 }),
  body('categories.deliverySpeed').optional().isInt({ min: 1, max: 5 }),
  body('categories.serviceQuality').optional().isInt({ min: 1, max: 5 }),
  body('categories.communication').optional().isInt({ min: 1, max: 5 }),
  body('categories.pricing').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, ...ratingData } = req.body;

    // Check if order exists and belongs to consumer
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.consumer.toString() !== req.consumer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this order' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only rate delivered orders' });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({ order: orderId });
    if (existingRating) {
      return res.status(400).json({ message: 'Order has already been rated' });
    }

    // Create rating
    const rating = new Rating({
      ...ratingData,
      consumer: req.consumer._id,
      distributor: order.distributor,
      order: orderId
    });

    await rating.save();

    // Update distributor's average rating
    await rating.populate('distributor');
    await rating.distributor.updateRating(rating.rating);

    // Populate rating with consumer and distributor details
    await rating.populate('consumer', 'name');
    await rating.populate('distributor', 'name');

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating
    });
  } catch (error) {
    console.error('Rating creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ratings for a distributor
router.get('/distributor/:distributorId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    const query = { distributor: req.params.distributorId };
    
    let sortOption = {};
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortOption = { rating: -1 };
    } else if (sort === 'lowest') {
      sortOption = { rating: 1 };
    }

    const ratings = await Rating.find(query)
      .populate('consumer', 'name')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rating.countDocuments(query);

    // Calculate average ratings for each category
    const categoryAverages = await Rating.aggregate([
      { $match: { distributor: require('mongoose').Types.ObjectId(req.params.distributorId) } },
      {
        $group: {
          _id: null,
          avgWaterQuality: { $avg: '$categories.waterQuality' },
          avgDeliverySpeed: { $avg: '$categories.deliverySpeed' },
          avgServiceQuality: { $avg: '$categories.serviceQuality' },
          avgCommunication: { $avg: '$categories.communication' },
          avgPricing: { $avg: '$categories.pricing' }
        }
      }
    ]);

    res.json({
      ratings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      categoryAverages: categoryAverages[0] || {}
    });
  } catch (error) {
    console.error('Get distributor ratings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consumer's ratings
router.get('/consumer/ratings', consumerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.find({ consumer: req.consumer._id })
      .populate('distributor', 'name rating')
      .populate('order', 'orderNumber status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rating.countDocuments({ consumer: req.consumer._id });

    res.json({
      ratings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get consumer ratings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark rating as helpful
router.post('/:id/helpful', consumerAuth, async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    await rating.markHelpful(req.consumer._id);
    
    res.json({
      message: 'Rating marked as helpful',
      helpfulCount: rating.helpful.count
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add distributor response to rating
router.post('/:id/response', distributorAuth, [
  body('response').trim().isLength({ min: 1, max: 500 }).withMessage('Response must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rating = await Rating.findById(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    if (rating.distributor.toString() !== req.distributor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this rating' });
    }

    await rating.addResponse(req.body.response);
    
    res.json({
      message: 'Response added successfully',
      rating
    });
  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rating statistics for distributor
router.get('/distributor/:distributorId/stats', async (req, res) => {
  try {
    const stats = await Rating.aggregate([
      { $match: { distributor: require('mongoose').Types.ObjectId(req.params.distributorId) } },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          },
          avgWaterQuality: { $avg: '$categories.waterQuality' },
          avgDeliverySpeed: { $avg: '$categories.deliverySpeed' },
          avgServiceQuality: { $avg: '$categories.serviceQuality' },
          avgCommunication: { $avg: '$categories.communication' },
          avgPricing: { $avg: '$categories.pricing' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: {}
      });
    }

    const stat = stats[0];
    const ratingDistribution = stat.ratingDistribution.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalRatings: stat.totalRatings,
      averageRating: Math.round(stat.averageRating * 10) / 10,
      ratingDistribution,
      categoryAverages: {
        waterQuality: Math.round(stat.avgWaterQuality * 10) / 10,
        deliverySpeed: Math.round(stat.avgDeliverySpeed * 10) / 10,
        serviceQuality: Math.round(stat.avgServiceQuality * 10) / 10,
        communication: Math.round(stat.avgCommunication * 10) / 10,
        pricing: Math.round(stat.avgPricing * 10) / 10
      }
    });
  } catch (error) {
    console.error('Get rating stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update rating (consumer only)
router.put('/:id', consumerAuth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 500 }).withMessage('Review must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rating = await Rating.findById(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    if (rating.consumer.toString() !== req.consumer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this rating' });
    }

    const oldRating = rating.rating;
    const newRating = req.body.rating;

    // Update rating
    rating.rating = newRating;
    if (req.body.review !== undefined) {
      rating.review = req.body.review;
    }

    await rating.save();

    // Update distributor's average rating
    await rating.populate('distributor');
    const distributor = rating.distributor;
    
    // Recalculate average rating
    const totalRating = (distributor.rating.average * distributor.rating.count) - oldRating + newRating;
    distributor.rating.average = totalRating / distributor.rating.count;
    await distributor.save();

    res.json({
      message: 'Rating updated successfully',
      rating
    });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 