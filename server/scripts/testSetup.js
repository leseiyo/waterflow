const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Create a simple test server
const app = express();
app.use(cors());
app.use(express.json());

// In-memory data storage for testing
const testData = {
  distributors: [
    {
      id: '1',
      name: 'AquaPure Water Services',
      email: 'info@aquapure.com',
      password: '$2a$10$test.hash.for.password123',
      location: {
        coordinates: [-74.006, 40.7128],
        address: '123 Water Street, New York, NY 10001'
      },
      rating: { average: 4.5, count: 25 },
      isActive: true
    }
  ],
  consumers: [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      password: '$2a$10$test.hash.for.password123',
      location: {
        coordinates: [-74.006, 40.7128],
        address: '789 Home Street, New York, NY 10003'
      }
    }
  ],
  orders: [
    {
      id: '1',
      orderNumber: 'ORD-001',
      consumer: '1',
      distributor: '1',
      status: 'confirmed',
      orderDetails: {
        quantity: 20,
        unit: 'liters'
      },
      pricing: {
        totalAmount: 55.00,
        currency: 'USD'
      },
      deliveryLocation: {
        address: '789 Home Street, New York, NY 10003'
      },
      tracking: {
        distance: 2.5,
        estimatedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
      },
      createdAt: new Date()
    }
  ]
};

// Test endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WaterFlow Test Server is running' });
});

app.post('/api/distributors/login', (req, res) => {
  const { email, password } = req.body;
  const distributor = testData.distributors.find(d => d.email === email);
  
  if (distributor && password === 'password123') {
    const token = jwt.sign({ id: distributor.id }, 'test-secret', { expiresIn: '7d' });
    res.json({ token, distributor: { ...distributor, password: undefined } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/consumers/login', (req, res) => {
  const { email, password } = req.body;
  const consumer = testData.consumers.find(c => c.email === email);
  
  if (consumer && password === 'password123') {
    const token = jwt.sign({ id: consumer.id }, 'test-secret', { expiresIn: '7d' });
    res.json({ token, consumer: { ...consumer, password: undefined } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/orders/:id', (req, res) => {
  const order = testData.orders.find(o => o.id === req.params.id);
  if (order) {
    const distributor = testData.distributors.find(d => d.id === order.distributor);
    const consumer = testData.consumers.find(c => c.id === order.consumer);
    res.json({
      ...order,
      distributor,
      consumer
    });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

app.get('/api/distributors/search', (req, res) => {
  res.json(testData.distributors.map(d => ({ ...d, password: undefined })));
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('📋 Available test endpoints:');
  console.log('- GET  /api/health');
  console.log('- POST /api/distributors/login');
  console.log('- POST /api/consumers/login');
  console.log('- GET  /api/orders/:id');
  console.log('- GET  /api/distributors/search');
  console.log('\n🔑 Test Credentials:');
  console.log('Distributor: info@aquapure.com / password123');
  console.log('Consumer: john@example.com / password123');
  console.log('\n📝 Note: This is a test server with in-memory data');
}); 