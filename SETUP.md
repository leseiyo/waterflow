# WaterFlow Setup Guide

This guide will help you set up the WaterFlow water distribution platform on your local machine.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Google Maps API key (optional, for location services)

## Quick Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd water

# Install all dependencies
npm run install-all
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory:

```bash
cd server
cp ../env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/water-distribution

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Google Maps API (optional)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service
3. Create database: `water-distribution`

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env` file

### 4. Google Maps API (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Maps JavaScript API
4. Create API key
5. Add the key to your `.env` file

### 5. Start the Application

#### Option A: Using npm (Recommended)
```bash
# From the root directory
npm run dev
```

#### Option B: Using Startup Scripts
```bash
# Windows (PowerShell)
.\start.ps1

# Windows (Command Prompt)
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

This will start:
- Backend server on http://localhost:5000
- Frontend client on http://localhost:3000

## Development Commands

### Root Directory
```bash
npm run dev          # Start both server and client
npm run server       # Start only the server
npm run client       # Start only the client
npm run install-all  # Install dependencies for both
```

### Server Directory
```bash
cd server
npm run dev          # Start with nodemon (auto-restart)
npm start           # Start in production mode
```

### Client Directory
```bash
cd client
npm start           # Start React development server
npm run build       # Build for production
npm test            # Run tests
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process using port 5000
   npx kill-port 5000
   # Kill process using port 3000
   npx kill-port 3000
   ```

2. **MongoDB connection failed**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

3. **npm install errors**
   ```bash
   # Clear npm cache
   npm cache clean --force
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **PowerShell execution policy error**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

5. **Concurrently date-fns error**
   ```bash
   # This has been fixed in the latest version
   # If you encounter this error, run:
   npm install date-fns
   ```

### Security Vulnerabilities

If you see security warnings:
```bash
cd client
npm audit fix
# If breaking changes are needed:
npm audit fix --force
```

## Production Deployment

### Environment Variables
Update `.env` for production:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/water-distribution
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://yourdomain.com
```

### Build for Production
```bash
# Build client
cd client
npm run build

# Start server in production mode
cd ../server
npm start
```

## API Documentation

The API is available at `http://localhost:5000/api/`

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Authentication Endpoints
- `POST /api/distributors/register` - Register distributor
- `POST /api/distributors/login` - Distributor login
- `POST /api/consumers/register` - Register consumer
- `POST /api/consumers/login` - Consumer login

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running
4. Check network connectivity

For additional help, create an issue in the repository. 