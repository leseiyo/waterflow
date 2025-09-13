const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/water-distribution');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-distribution', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connection successful!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Test creating a collection
    const testCollection = mongoose.connection.collection('test');
    await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
    console.log('✅ Database write test successful!');
    
    // Clean up test data
    await testCollection.deleteOne({ test: 'connection' });
    console.log('✅ Database cleanup successful!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running (local) or Atlas cluster is active (cloud)');
    console.log('2. Check your MONGODB_URI in the .env file');
    console.log('3. For Atlas: Ensure your IP is whitelisted');
    console.log('4. For local: Install MongoDB Community Edition');
    
    console.log('\n📝 Quick Atlas Setup:');
    console.log('1. Go to https://www.mongodb.com/atlas');
    console.log('2. Create free account and cluster');
    console.log('3. Get connection string');
    console.log('4. Update MONGODB_URI in .env file');
  } finally {
    await mongoose.connection.close();
  }
};

testConnection(); 