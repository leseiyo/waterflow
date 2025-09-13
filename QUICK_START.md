# 🚀 WaterFlow Quick Start Guide

Get your WaterFlow water distribution platform running in minutes!

## ⚡ Quick Setup (5 minutes)

### 1. **Start the Application**
```bash
# Use the provided startup script
start-app.bat

# Or manually
npm run dev
```

### 2. **Set Up Environment Variables**
Create `server/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/water-distribution
JWT_SECRET=water-distribution-super-secret-jwt-key-2024
JWT_EXPIRES_IN=7d
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
CORS_ORIGIN=http://localhost:3000
```

### 3. **Set Up MongoDB**
#### Option A: Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Create database: `water-distribution`

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 4. **Populate with Test Data**
```bash
cd server
npm run seed
```

### 5. **Access Your Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔑 Test Credentials

After running the seed script, you can test with:

### **Distributor Account**
- **Email**: info@aquapure.com
- **Password**: password123

### **Consumer Account**
- **Email**: john@example.com
- **Password**: password123

## 🎯 What You Can Test

### **As a Consumer:**
1. Browse distributors
2. Place water orders
3. Track deliveries in real-time
4. Rate and review services

### **As a Distributor:**
1. View incoming orders
2. Update order status
3. Manage availability
4. View ratings and reviews

## 📱 Key Features to Explore

- **Real-time Order Tracking**: Watch orders move through the system
- **Location-based Matching**: Find nearby distributors
- **Rating System**: Rate and review services
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live status updates via Socket.io

## 🛠️ Development Commands

```bash
# Start both server and client
npm run dev

# Start only server
npm run server

# Start only client
npm run client

# Seed database with test data
cd server && npm run seed

# Kill processes on ports
npx kill-port 5000 3000
```

## 🔧 Troubleshooting

### **Port Already in Use**
```bash
npx kill-port 5000 3000
```

### **MongoDB Connection Issues**
- Check if MongoDB is running
- Verify connection string in `.env`
- Ensure network connectivity

### **Application Won't Start**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm run install-all
```

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running
4. Check the detailed setup guide in `SETUP.md`

## 🎉 You're Ready!

Your WaterFlow platform is now running with sample data. Start exploring the features and building your water distribution business!

---

**Next Steps:**
- Customize the application for your needs
- Add real distributor and consumer data
- Configure Google Maps API for location features
- Deploy to production 