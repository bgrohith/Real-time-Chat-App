const mongoose = require('mongoose');
require('dotenv').config();

const { connectDB, closeDB } = require('./config/db');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

const seedData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to database for seeding...');
      await connectDB();
    }

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    console.log('Creating demo users...');
    const users = await User.create([
      {
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        statusMessage: 'Frontend Architect 💻 | Building real-time UIs'
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        statusMessage: 'Backend enthusiast 🚀 | Node.js & WebSockets'
      },
      {
        username: 'charlie',
        email: 'charlie@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        statusMessage: 'Full Stack Developer @ SapphireIQ'
      },
      {
        username: 'dana',
        email: 'dana@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        statusMessage: 'Product Designer & UI/UX Lead ✨'
      }
    ]);

    const [alice, bob, charlie, dana] = users;

    console.log('Creating 1-on-1 conversations and messages...');
    // Conversation 1: Alice & Bob
    const conv1 = await Conversation.create({
      isGroup: false,
      members: [alice._id, bob._id],
      unreadCounts: {
        [alice._id.toString()]: 0,
        [bob._id.toString()]: 1
      }
    });

    const m1 = await Message.create({
      conversation: conv1._id,
      sender: alice._id,
      text: 'Hey Bob! Did you review the WebSocket architecture for Module 3?',
      readBy: [alice._id, bob._id]
    });

    const m2 = await Message.create({
      conversation: conv1._id,
      sender: bob._id,
      text: 'Yes! Socket.io handles rooms and authenticated handshakes cleanly.',
      readBy: [alice._id, bob._id]
    });

    const m3 = await Message.create({
      conversation: conv1._id,
      sender: alice._id,
      text: 'Awesome. I also added support for typing indicators and online presence tracking.',
      readBy: [alice._id]
    });

    conv1.lastMessage = m3._id;
    await conv1.save();

    // Conversation 2: Alice & Charlie
    const conv2 = await Conversation.create({
      isGroup: false,
      members: [alice._id, charlie._id],
      unreadCounts: {
        [alice._id.toString()]: 0,
        [charlie._id.toString()]: 0
      }
    });

    const m4 = await Message.create({
      conversation: conv2._id,
      sender: charlie._id,
      text: 'Hey Alice, welcome to SapphireIQ!',
      readBy: [alice._id, charlie._id]
    });

    conv2.lastMessage = m4._id;
    await conv2.save();

    // Conversation 3: Group Chat (Module 5)
    console.log('Creating Group Chat...');
    const groupConv = await Conversation.create({
      isGroup: true,
      name: 'SapphireIQ Dev Team 🚀',
      groupAdmin: alice._id,
      members: [alice._id, bob._id, charlie._id, dana._id],
      unreadCounts: {
        [alice._id.toString()]: 0,
        [bob._id.toString()]: 0,
        [charlie._id.toString()]: 0,
        [dana._id.toString()]: 0
      }
    });

    const gm1 = await Message.create({
      conversation: groupConv._id,
      sender: alice._id,
      text: 'Welcome to the project channel team! All 5 modules are coming together nicely.',
      readBy: [alice._id, bob._id, charlie._id, dana._id]
    });

    const gm2 = await Message.create({
      conversation: groupConv._id,
      sender: dana._id,
      text: 'The UI looks sleek! Love the responsive layout and the dark indigo aesthetic.',
      readBy: [alice._id, bob._id, charlie._id, dana._id]
    });

    groupConv.lastMessage = gm2._id;
    await groupConv.save();

    console.log('\n✅ Demo Data Seeded Successfully!');
    console.log('Demo Accounts (Password for all: password123):');
    console.log('  1. alice@example.com (or username: alice)');
    console.log('  2. bob@example.com (or username: bob)');
    console.log('  3. charlie@example.com (or username: charlie)');
    console.log('  4. dana@example.com (or username: dana)\n');
  } catch (err) {
    console.error('Error during seeding:', err);
    throw err;
  }
};

const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Automatically generating demo accounts and conversations...');
      await seedData();
    }
  } catch (err) {
    console.error('Auto-seed check failed:', err.message);
  }
};

if (require.main === module) {
  (async () => {
    try {
      console.log('Connecting to database for seeding...');
      await connectDB();
      await seedData();
      await closeDB();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  })();
}

module.exports = { seedData, autoSeedIfEmpty };

