const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  consumer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consumer',
    required: true
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500,
    trim: true
  },
  categories: {
    waterQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    deliverySpeed: {
      type: Number,
      min: 1,
      max: 5
    },
    serviceQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    pricing: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consumer'
    }]
  },
  response: {
    distributor: {
      type: String,
      maxlength: 500,
      trim: true
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Ensure one rating per order
ratingSchema.index({ order: 1 }, { unique: true });

// Compound index for distributor ratings
ratingSchema.index({ distributor: 1, createdAt: -1 });

// Method to mark review as helpful
ratingSchema.methods.markHelpful = function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add distributor response
ratingSchema.methods.addResponse = function(response) {
  this.response.distributor = response;
  this.response.respondedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Rating', ratingSchema); 