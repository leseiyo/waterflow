const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
  }
});

// In-memory storage for development
global.inMemoryDB = {
  users: [],
  orders: [],
  distributors: [],
  consumers: []
};

// CORS configuration - more permissive for development
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cache control middleware
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
  next();
});

// Import routes
const distributorRoutes = require('./routes/distributors');
const consumerRoutes = require('./routes/consumers');
const orderRoutes = require('./routes/orders');
const ratingRoutes = require('./routes/ratings');

// Use routes with error handling
app.use('/api/distributors', distributorRoutes);
app.use('/api/consumers', consumerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ratings', ratingRoutes);

// Socket.io for real-time tracking
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`Client joined order room: ${orderId}`);
  });

  socket.on('update-location', (data) => {
    socket.to(`order-${data.orderId}`).emit('location-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Water Distribution Platform API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'In-Memory (Development Mode)'
  });
});

// Mock data endpoint for development
app.get('/api/mock-data', (req, res) => {
  res.json({
    message: 'Mock data loaded',
    data: global.inMemoryDB
  });
});

// Test endpoint to check current users
app.get('/api/test/users', (req, res) => {
  res.json({
    consumers: global.inMemoryDB.consumers || [],
    distributors: global.inMemoryDB.distributors || [],
    orders: global.inMemoryDB.orders || []
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: In-Memory (Development Mode)`);
  console.log(`⚡ Performance optimized for development`);
  console.log(`🌐 CORS enabled for all origins (development)`);
});

module.exports = { app, io }; 