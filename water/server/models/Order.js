const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
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
  orderDetails: {
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['liters', 'gallons', 'cubic_meters'],
      required: true
    },
    waterType: {
      type: String,
      enum: ['drinking', 'mineral', 'purified', 'spring', 'other'],
      default: 'drinking'
    }
  },
  deliveryLocation: {
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
    },
    deliveryInstructions: String
  },
  pricing: {
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  tracking: {
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number],
      timestamp: Date
    },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    distance: {
      type: Number,
      default: 0
    },
    eta: Date
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'mobile_money', 'bank_transfer'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  scheduledDelivery: {
    date: Date,
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning'
    }
  },
  notes: {
    consumer: String,
    distributor: String,
    admin: String
  },
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create geospatial index for delivery location
orderSchema.index({ deliveryLocation: '2dsphere' });

// Generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `WD${timestamp}${random}`;
  }
  next();
});

// Method to update tracking location
orderSchema.methods.updateLocation = function(lat, lng) {
  this.tracking.currentLocation = {
    type: 'Point',
    coordinates: [lng, lat],
    timestamp: new Date()
  };
  return this.save();
};

// Method to calculate distance
orderSchema.methods.calculateDistance = function(lat, lng) {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = this.deliveryLocation.coordinates[1];
  const lon1 = this.deliveryLocation.coordinates[0];
  const lat2 = lat;
  const lon2 = lng;
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  this.tracking.distance = R * c;
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema); 