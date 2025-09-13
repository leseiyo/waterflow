const jwt = require('jsonwebtoken');
const Distributor = require('../models/Distributor');
const Consumer = require('../models/Consumer');

// Middleware to authenticate distributor
const authenticateDistributor = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const distributor = await Distributor.findById(decoded.userId).select('-password');
    
    if (!distributor) {
      return res.status(401).json({ message: 'Invalid token. Distributor not found.' });
    }

    req.user = distributor;
    req.userType = 'distributor';
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to authenticate consumer
const authenticateConsumer = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const consumer = await Consumer.findById(decoded.userId).select('-password');
    
    if (!consumer) {
      return res.status(401).json({ message: 'Invalid token. Consumer not found.' });
    }

    req.user = consumer;
    req.userType = 'consumer';
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to authenticate either distributor or consumer
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to find distributor first
    let user = await Distributor.findById(decoded.userId).select('-password');
    let userType = 'distributor';
    
    // If not found, try consumer
    if (!user) {
      user = await Consumer.findById(decoded.userId).select('-password');
      userType = 'consumer';
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    req.user = user;
    req.userType = userType;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to check if user is a distributor
const requireDistributor = (req, res, next) => {
  if (req.userType !== 'distributor') {
    return res.status(403).json({ message: 'Access denied. Distributor access required.' });
  }
  next();
};

// Middleware to check if user is a consumer
const requireConsumer = (req, res, next) => {
  if (req.userType !== 'consumer') {
    return res.status(403).json({ message: 'Access denied. Consumer access required.' });
  }
  next();
};

module.exports = {
  authenticateDistributor,
  authenticateConsumer,
  authenticateUser,
  requireDistributor,
  requireConsumer
}; 