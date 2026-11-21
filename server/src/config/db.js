const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      try {
        console.log('Connecting to provided MongoDB URI...');
        await mongoose.connect(mongoUri);
        console.log(`MongoDB connected successfully to ${mongoose.connection.host}`);
        return;
      } catch (uriErr) {
        console.warn('Failed to connect to provided MONGODB_URI. Falling back to embedded MongoDB...', uriErr.message);
      }
    }

    // Auto fallback to MongoMemoryServer for immediate zero-config local development
    console.log('Starting In-Memory MongoDB Server for local development...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'sapphire_chat'
      }
    });
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected to Embedded MongoDB at ${memoryUri}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('Error during DB disconnect:', err);
  }
};

module.exports = { connectDB, closeDB };
