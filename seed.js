require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('./common/models/Inventory');
const User = require('./common/models/User');
const config = require('./common/config');

// Define seed data
const inventorySeedData = [
  {
    symbol: 'DATA',
    name: 'Data Pack',
    image: 'https://cdn.tribaldex.com/tribaldex/token-icons/DOJO.png',
    cards: 10,
    price: 2,
    quantity: 1000000,
    remaining: 1000000,
    max_open: 6,
  },
  {
    symbol: 'ALPHAPACK',
    name: 'Retzark Alpha Pack',
    image: 'https://cdn.tribaldex.com/tribaldex/token-icons/DOJO.png',
    cards: 6,
    price: 5,
    quantity: 300000,
    remaining: 300000,
    max_open: 6,
  },
];

const userSeedData = [
  {
    username: 'testuser',
    banned: false,
  },
];

// Connect to MongoDB
mongoose.connect(config.MONGODB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

// Handle connection errors
db.on('error', console.error.bind(console, 'connection error:'));

// Seed the database
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Clear existing data
    await Inventory.deleteMany({});
    await User.deleteMany({});

    // Insert seed data
    await Inventory.insertMany(inventorySeedData);
    await User.insertMany(userSeedData);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    mongoose.connection.close();
  }
});
