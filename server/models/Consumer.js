const mongoose = require('mongoose');

const consumerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    whatsapp: String,
    alternativePhone: String
  },
  preferences: {
    preferredDeliveryTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime'
    },
    deliveryInstructions: String,
    preferredDistributors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Distributor'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
consumerSchema.index({ location: '2dsphere' });

// Method to update order statistics
consumerSchema.methods.updateOrderStats = function(orderAmount) {
  this.totalOrders += 1;
  this.totalSpent += orderAmount;
  return this.save();
};

module.exports = mongoose.model('Consumer', consumerSchema); 