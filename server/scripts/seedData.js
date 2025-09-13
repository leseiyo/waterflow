const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Distributor = require('../models/Distributor');
const Consumer = require('../models/Consumer');
const Order = require('../models/Order');
const Rating = require('../models/Rating');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-distribution', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Distributor.deleteMany({});
    await Consumer.deleteMany({});
    await Order.deleteMany({});
    await Rating.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create sample distributors
    const distributors = [
      {
        name: 'AquaPure Water Services',
        email: 'info@aquapure.com',
        phone: '+1234567890',
        password: await bcrypt.hash('password123', 10),
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128], // New York
          address: '123 Water Street, New York, NY 10001'
        },
        waterSupply: {
          capacity: 5000,
          unit: 'liters',
          availableQuantity: 3000
        },
        workingHours: {
          start: '08:00',
          end: '18:00',
          daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        transportMode: 'truck',
        pricing: {
          basePrice: 2.50,
          currency: 'USD',
          perUnit: 'liter',
          deliveryFee: 5.00
        },
        contactInfo: {
          phone: '+1234567890',
          email: 'info@aquapure.com',
          whatsapp: '+1234567890'
        },
        rating: {
          average: 4.5,
          count: 25
        },
        isActive: true,
        isVerified: true
      },
      {
        name: 'FreshFlow Distributors',
        email: 'contact@freshflow.com',
        phone: '+1234567891',
        password: await bcrypt.hash('password123', 10),
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128], // New York
          address: '456 Spring Avenue, New York, NY 10002'
        },
        waterSupply: {
          capacity: 3000,
          unit: 'liters',
          availableQuantity: 2000
        },
        workingHours: {
          start: '07:00',
          end: '19:00',
          daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        transportMode: 'motorcycle',
        pricing: {
          basePrice: 2.00,
          currency: 'USD',
          perUnit: 'liter',
          deliveryFee: 3.00
        },
        contactInfo: {
          phone: '+1234567891',
          email: 'contact@freshflow.com',
          whatsapp: '+1234567891'
        },
        rating: {
          average: 4.2,
          count: 18
        },
        isActive: true,
        isVerified: true
      }
    ];

    const createdDistributors = await Distributor.insertMany(distributors);
    console.log('✅ Created', createdDistributors.length, 'distributors');

    // Create sample consumers
    const consumers = [
      {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1234567892',
        password: await bcrypt.hash('password123', 10),
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128], // New York
          address: '789 Home Street, New York, NY 10003'
        },
        orderHistory: []
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1234567893',
        password: await bcrypt.hash('password123', 10),
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128], // New York
          address: '321 Family Avenue, New York, NY 10004'
        },
        orderHistory: []
      }
    ];

    const createdConsumers = await Consumer.insertMany(consumers);
    console.log('✅ Created', createdConsumers.length, 'consumers');

    // Create sample orders
    const orders = [
      {
        consumer: createdConsumers[0]._id,
        distributor: createdDistributors[0]._id,
        orderNumber: 'ORD-001',
        orderDetails: {
          quantity: 20,
          unit: 'liters',
          description: 'Purified drinking water'
        },
        pricing: {
          unitPrice: 2.50,
          quantity: 20,
          subtotal: 50.00,
          deliveryFee: 5.00,
          totalAmount: 55.00,
          currency: 'USD'
        },
        deliveryLocation: {
          type: 'Point',
          coordinates: [-74.006, 40.7128],
          address: '789 Home Street, New York, NY 10003'
        },
        status: 'confirmed',
        payment: {
          method: 'credit_card',
          status: 'paid',
          transactionId: 'TXN-001'
        },
        tracking: {
          estimatedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          distance: 2.5
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        consumer: createdConsumers[1]._id,
        distributor: createdDistributors[1]._id,
        orderNumber: 'ORD-002',
        orderDetails: {
          quantity: 15,
          unit: 'liters',
          description: 'Spring water delivery'
        },
        pricing: {
          unitPrice: 2.00,
          quantity: 15,
          subtotal: 30.00,
          deliveryFee: 3.00,
          totalAmount: 33.00,
          currency: 'USD'
        },
        deliveryLocation: {
          type: 'Point',
          coordinates: [-74.006, 40.7128],
          address: '321 Family Avenue, New York, NY 10004'
        },
        status: 'in_transit',
        payment: {
          method: 'cash',
          status: 'paid',
          transactionId: 'TXN-002'
        },
        tracking: {
          estimatedDeliveryTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
          distance: 1.8
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log('✅ Created', createdOrders.length, 'orders');

    // Create sample ratings
    const ratings = [
      {
        consumer: createdConsumers[0]._id,
        distributor: createdDistributors[0]._id,
        order: createdOrders[0]._id,
        rating: 5,
        review: 'Excellent service! Water was delivered on time and the quality is great.',
        categories: {
          deliverySpeed: 5,
          waterQuality: 5,
          customerService: 5,
          valueForMoney: 4
        },
        helpfulCount: 3
      },
      {
        consumer: createdConsumers[1]._id,
        distributor: createdDistributors[1]._id,
        order: createdOrders[1]._id,
        rating: 4,
        review: 'Good service overall. Water quality is excellent.',
        categories: {
          deliverySpeed: 4,
          waterQuality: 5,
          customerService: 4,
          valueForMoney: 4
        },
        helpfulCount: 1
      }
    ];

    const createdRatings = await Rating.insertMany(ratings);
    console.log('✅ Created', createdRatings.length, 'ratings');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Data Summary:');
    console.log('- Distributors:', createdDistributors.length);
    console.log('- Consumers:', createdConsumers.length);
    console.log('- Orders:', createdOrders.length);
    console.log('- Ratings:', createdRatings.length);
    console.log('\n🔑 Test Credentials:');
    console.log('Distributor: info@aquapure.com / password123');
    console.log('Consumer: john@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData(); 