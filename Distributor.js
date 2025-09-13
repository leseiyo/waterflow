const mongoose = require('mongoose');

const distributorSchema = new mongoose.Schema({
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
  waterSupply: {
    capacity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['liters', 'gallons', 'cubic_meters'],
      default: 'liters'
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0
    }
  },
  workingHours: {
    start: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    end: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  transportMode: {
    type: String,
    enum: ['truck', 'motorcycle', 'bicycle', 'walking', 'boat'],
    required: true
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    perUnit: {
      type: String,
      enum: ['liter', 'gallon', 'cubic_meter'],
      default: 'liter'
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
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
    website: String
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  documents: [{
    type: {
      type: String,
      enum: ['license', 'certification', 'insurance', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
distributorSchema.index({ location: '2dsphere' });

// Method to update rating
distributorSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Method to check if distributor is available
distributorSchema.methods.isAvailable = function() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  
  return this.isActive && 
         this.workingHours.daysOfWeek.includes(currentDay) &&
         currentTime >= this.workingHours.start &&
         currentTime <= this.workingHours.end &&
         this.waterSupply.availableQuantity > 0;
};

module.exports = mongoose.model('Distributor', distributorSchema); 