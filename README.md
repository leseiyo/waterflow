# WaterFlow - Water Distribution Platform

A comprehensive platform that connects water distributors with consumers, providing real-time tracking, rating systems, and efficient water delivery management.

## 🌟 Features

- **User Management**: Separate registration and authentication for distributors and consumers
- **Location-Based Matching**: Find nearby distributors using geospatial queries
- **Real-Time Tracking**: Live order tracking with Google Maps integration
- **Rating System**: Comprehensive rating and review system for quality assurance
- **Order Management**: Complete order lifecycle from creation to delivery
- **Real-Time Communication**: Socket.io integration for live updates
- **Responsive Design**: Modern UI built with React and Tailwind CSS
- **Error Handling**: Robust error boundaries and validation
- **Security**: JWT-based authentication with proper validation

## 🏗️ Architecture

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time**: Socket.io for live updates
- **Maps**: Google Maps API for location services
- **Authentication**: JWT-based authentication
- **Error Handling**: React Error Boundaries and comprehensive validation

## 📁 Project Structure

```
water/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── config/         # API configuration
│   │   ├── utils/          # Helper functions
│   │   └── ...
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── index.js           # Server entry point
│   └── package.json
├── package.json           # Root package.json
├── README.md
├── SETUP.md              # Detailed setup guide
└── env.example           # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (local or cloud)
- Google Maps API key (optional, for location services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd water
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   Create `.env` file in the server directory:
   ```bash
   cd server
   cp ../env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/water-distribution
   JWT_SECRET=your-super-secret-jwt-key
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   # From the root directory
   
   
   ```

   This will start both the backend server (port 5000) and frontend (port 3000).

## 📚 API Documentation

### Authentication Endpoints

#### Distributor Routes
- `POST /api/distributors/register` - Register a new distributor
- `POST /api/distributors/login` - Distributor login
- `GET /api/distributors/profile` - Get distributor profile
- `PUT /api/distributors/profile` - Update distributor profile
- `GET /api/distributors/search` - Search distributors by location
- `PATCH /api/distributors/availability` - Update availability
- `PATCH /api/distributors/supply` - Update water supply

#### Consumer Routes
- `POST /api/consumers/register` - Register a new consumer
- `POST /api/consumers/login` - Consumer login
- `GET /api/consumers/profile` - Get consumer profile
- `PUT /api/consumers/profile` - Update consumer profile
- `PATCH /api/consumers/location` - Update location
- `GET /api/consumers/orders` - Get order history

#### Order Routes
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/consumer/orders` - Get consumer orders
- `GET /api/orders/distributor/orders` - Get distributor orders
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/location` - Update delivery location
- `PATCH /api/orders/:id/cancel` - Cancel order

#### Rating Routes
- `POST /api/ratings` - Create a rating
- `GET /api/ratings/distributor/:distributorId` - Get distributor ratings
- `GET /api/ratings/consumer/ratings` - Get consumer ratings
- `POST /api/ratings/:id/helpful` - Mark rating as helpful
- `POST /api/ratings/:id/response` - Add distributor response
- `GET /api/ratings/distributor/:distributorId/stats` - Get rating statistics

## 🗄️ Database Schema

### Distributor
- Basic info (name, email, phone)
- Location (coordinates with geospatial index)
- Business details (water supply, working hours, transport mode)
- Pricing information
- Rating and availability status

### Consumer
- Basic info (name, email, phone)
- Location (coordinates with geospatial index)
- Order statistics

### Order
- Links consumer and distributor
- Order details (quantity, unit, pricing)
- Delivery location and status
- Real-time tracking information

### Rating
- Links consumer, distributor, and order
- Rating score and review text
- Category-specific ratings
- Helpfulness tracking

## 🔧 Development

### Available Scripts

**Root Directory:**
- `npm run dev` - Start both server and client in development mode
- `npm run server` - Start only the server
- `npm run client` - Start only the client
- `npm run install-all` - Install dependencies for both server and client

**Server Directory:**
- `npm run dev` - Start server with nodemon
- `npm start` - Start server in production mode

**Client Directory:**
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/water-distribution

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 🛠️ Technologies Used

### Frontend
- **React.js** - UI framework
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Socket.io-client** - Real-time communication
- **Google Maps API** - Location services
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - Object Data Modeling
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Bcrypt.js** - Password hashing
- **Express Validator** - Input validation
- **Multer** - File upload handling

## 🆕 Recent Improvements

- ✅ **Enhanced Error Handling**: Added React Error Boundaries and improved validation
- ✅ **Centralized API Configuration**: Created config file for better maintainability
- ✅ **Utility Functions**: Added helper functions for common operations
- ✅ **Loading Components**: Reusable loading spinner for better UX
- ✅ **Route Protection**: Improved authentication and route protection
- ✅ **Better Navigation**: Fixed route inconsistencies and navigation flow
- ✅ **Setup Documentation**: Comprehensive setup guide (SETUP.md)
- ✅ **Security Improvements**: Better JWT handling and validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@waterflow.com or create an issue in the repository.

## 🔮 Future Enhancements

- [ ] Push notifications
- [ ] Payment integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Advanced filtering and search
- [ ] Automated delivery scheduling
- [ ] Weather integration for delivery optimization
- [ ] Real-time chat between consumers and distributors
- [ ] Advanced reporting and analytics 