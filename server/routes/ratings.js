const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Ensure ratings array exists in in-memory DB
if (!global.inMemoryDB.ratings) {
  global.inMemoryDB.ratings = [];
}

// Helpers to find entities in in-memory storage
const findConsumerById = (id) => {
  const consumers = global.inMemoryDB.consumers || [];
  return consumers.find(c => c._id === id);
};

const findDistributorById = (id) => {
  const distributors = global.inMemoryDB.distributors || [];
  return distributors.find(d => d._id === id);
};

const findOrderById = (id) => {
  const orders = global.inMemoryDB.orders || [];
  return orders.find(o => o._id === id);
};

// Auth middlewares
const consumerAuth = (req, res, next) => {
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
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

const distributorAuth = (req, res, next) => {
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
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Create rating and review (consumer)
router.post('/', consumerAuth, [
  body('orderId').trim().notEmpty().withMessage('Valid order ID required'),
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

    const { orderId, rating, review, categories } = req.body;
    const order = findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.consumerId !== req.consumer._id) {
      return res.status(403).json({ message: 'Not authorized to rate this order' });
    }
    // In this in-memory mode, accept rating if order is completed
    if (!['completed', 'delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Can only rate completed orders' });
    }

    const ratings = global.inMemoryDB.ratings || [];
    const existing = ratings.find(r => r.orderId === orderId);
    if (existing) {
      return res.status(400).json({ message: 'Order has already been rated' });
    }

    const newRating = {
      _id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      consumerId: req.consumer._id,
      distributorId: order.distributorId,
      rating: Number(rating),
      review: review || '',
      categories: categories || {},
      helpful: { count: 0, voters: [] },
      response: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    ratings.push(newRating);
    global.inMemoryDB.ratings = ratings;

    return res.status(201).json({ message: 'Rating submitted successfully', rating: newRating });
  } catch (error) {
    console.error('Rating creation error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get ratings for a distributor
router.get('/distributor/:distributorId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const ratings = (global.inMemoryDB.ratings || []).filter(r => r.distributorId === req.params.distributorId);

    let sorted = ratings.slice();
    if (sort === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'oldest') sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sort === 'highest') sorted.sort((a, b) => b.rating - a.rating);
    else if (sort === 'lowest') sorted.sort((a, b) => a.rating - b.rating);

    const start = (Number(page) - 1) * Number(limit);
    const paged = sorted.slice(start, start + Number(limit));

    return res.json({
      ratings: paged,
      totalPages: Math.ceil(sorted.length / Number(limit)),
      currentPage: Number(page),
      total: sorted.length,
      categoryAverages: calculateCategoryAverages(sorted)
    });
  } catch (error) {
    console.error('Get distributor ratings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get consumer's ratings
router.get('/consumer/ratings', consumerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const all = (global.inMemoryDB.ratings || []).filter(r => r.consumerId === req.consumer._id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const start = (Number(page) - 1) * Number(limit);
    const paged = all.slice(start, start + Number(limit));
    return res.json({
      ratings: paged,
      totalPages: Math.ceil(all.length / Number(limit)),
      currentPage: Number(page),
      total: all.length
    });
  } catch (error) {
    console.error('Get consumer ratings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Mark rating as helpful
router.post('/:id/helpful', consumerAuth, async (req, res) => {
  try {
    const ratings = global.inMemoryDB.ratings || [];
    const rating = ratings.find(r => r._id === req.params.id);
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    if (!rating.helpful) rating.helpful = { count: 0, voters: [] };
    if (!rating.helpful.voters.includes(req.consumer._id)) {
      rating.helpful.voters.push(req.consumer._id);
      rating.helpful.count = rating.helpful.voters.length;
      rating.updatedAt = new Date();
    }
    return res.json({ message: 'Rating marked as helpful', helpfulCount: rating.helpful.count });
  } catch (error) {
    console.error('Mark helpful error:', error);
    return res.status(500).json({ message: 'Server error' });
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
    const ratings = global.inMemoryDB.ratings || [];
    const rating = ratings.find(r => r._id === req.params.id);
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    if (rating.distributorId !== req.distributor._id) {
      return res.status(403).json({ message: 'Not authorized to respond to this rating' });
    }
    rating.response = req.body.response;
    rating.updatedAt = new Date();
    return res.json({ message: 'Response added successfully', rating });
  } catch (error) {
    console.error('Add response error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get rating statistics for distributor
router.get('/distributor/:distributorId/stats', async (req, res) => {
  try {
    const all = (global.inMemoryDB.ratings || []).filter(r => r.distributorId === req.params.distributorId);
    if (all.length === 0) {
      return res.json({
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: {}
      });
    }
    const totalRatings = all.length;
    const averageRating = Math.round((all.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalRatings) * 10) / 10;
    const ratingDistribution = all.reduce((acc, r) => {
      const key = String(r.rating);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const categoryAverages = calculateCategoryAverages(all);
    return res.json({ totalRatings, averageRating, ratingDistribution, categoryAverages });
  } catch (error) {
    console.error('Get rating stats error:', error);
    return res.status(500).json({ message: 'Server error' });
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
    const ratings = global.inMemoryDB.ratings || [];
    const rating = ratings.find(r => r._id === req.params.id);
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    if (rating.consumerId !== req.consumer._id) {
      return res.status(403).json({ message: 'Not authorized to update this rating' });
    }
    rating.rating = Number(req.body.rating);
    if (req.body.review !== undefined) rating.review = req.body.review;
    if (req.body.categories) rating.categories = req.body.categories;
    rating.updatedAt = new Date();
    return res.json({ message: 'Rating updated successfully', rating });
  } catch (error) {
    console.error('Update rating error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

function calculateCategoryAverages(ratings) {
  const sums = { waterQuality: 0, deliverySpeed: 0, serviceQuality: 0, communication: 0, pricing: 0 };
  const counts = { waterQuality: 0, deliverySpeed: 0, serviceQuality: 0, communication: 0, pricing: 0 };
  ratings.forEach(r => {
    const c = r.categories || {};
    Object.keys(sums).forEach(k => {
      if (typeof c[k] === 'number') {
        sums[k] += c[k];
        counts[k] += 1;
      }
    });
  });
  const avg = {};
  Object.keys(sums).forEach(k => {
    avg[k] = counts[k] ? Math.round((sums[k] / counts[k]) * 10) / 10 : 0;
  });
  return avg;
}

module.exports = router;