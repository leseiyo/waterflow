# Water Distribution Platform - Debugging Plan

## 1. Environment Configuration Issues

### Server Environment Variables (.env file in root directory)
The server needs the following environment variables:
- MONGODB_URI: Connection string for MongoDB database
- JWT_SECRET: Secret key for JWT token generation (should be a strong secret in production)
- PORT: Port for the server to listen on

Example .env file content:
```
MONGODB_URI=mongodb://localhost:27017/water-distribution
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

### Client Environment Variables
The client needs to know the API base URL for development. This can be configured in the client's package.json with a proxy setting or through environment variables.

## 2. Client-Server API Communication Issues

### Problem
The client is making API calls to relative URLs (e.g., `/api/orders/consumer/orders`) but the server runs on a different port (5000) than the client (3000). This will cause CORS issues in development.

### Solution Options
1. Add proxy configuration to client/package.json:
```json
"proxy": "http://localhost:5000"
```

2. Update all API calls in the client to use absolute URLs with environment variables:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

## 3. Data Mapping Issues

### Register Component Issues
The Register component is sending data to the server in a flat format, but the server expects specific nested objects for distributor information.

Client sends:
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  phone: "1234567890",
  password: "password123",
  address: "123 Main St",
  waterSupply: "1000 liters/day",
  workingHours: "8 AM - 6 PM",
  transportMode: "truck",
  pricing: "$2 per liter"
}
```

Server expects (for distributors):
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  phone: "1234567890",
  password: "password123",
  location: {
    address: "123 Main St",
    coordinates: [longitude, latitude] // Array of numbers
  },
  waterSupply: {
    capacity: 1000, // Number
    unit: "liters", // Enum: 'liters', 'gallons', 'cubic_meters'
    availableQuantity: 1000 // Number
  },
  workingHours: {
    start: "08:00", // Time format HH:MM
    end: "18:00"   // Time format HH:MM
  },
  transportMode: "truck", // Enum value
  pricing: {
    basePrice: 2, // Number
    currency: "USD", // String
    perUnit: "liter" // Enum: 'liter', 'gallon', 'cubic_meter'
  }
}
```

### Login Component Issues
The Login component navigates to `/distributor-dashboard` but the protected route is set up for `/distributor/dashboard`.

## 4. Authentication Context Issues

### API Base URL Hardcoding
The AuthContext.js file hardcodes the API URL to `http://localhost:5000` which won't work in production. It should use environment variables.

## 5. Dashboard Component Validation Issues

### Consumer Dashboard Issues
- Using user properties that may not exist (user?.address should be user?.location?.address)
- Incorrect API endpoint for fetching distributors (using /api/distributors/search without proper query parameters)

### Distributor Dashboard Issues
- Using user properties that may not exist in the expected format
- Stats calculation depends on orders state which might not be populated yet when fetchStats is called

## 6. MongoDB Connection Issues

### Problem
The server connects to MongoDB but doesn't handle connection errors gracefully and uses a default local connection string.

### Solution
- Ensure MongoDB is running locally or provide a proper connection string
- Add better error handling for database connection failures
- Consider adding retry logic for database connections

## 7. Additional Issues

### Missing Order Model
The ConsumerDashboard.js file imports Order model but it's not in the server models directory.

### Inconsistent Data Properties
Client components are using properties like `user?.waterSupply` and `user?.workingHours` which are objects in the database but being displayed as if they're strings.

## Implementation Steps

1. Create proper .env file in root directory with MongoDB connection and JWT secret
2. Add proxy configuration to client/package.json
3. Fix data mapping in Register component to match server expectations
4. Update AuthContext.js to use environment variables for API base URL
5. Fix property access in dashboard components to match actual data structure
6. Add proper error handling in all components
7. Create Order model if it doesn't exist
8. Test registration and login flows for both consumer and distributor
9. Verify dashboard data display works correctly