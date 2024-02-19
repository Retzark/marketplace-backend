const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  symbol: {
    type: String,
    index: true,
    required: true,
    unique: true,
    uppercase: true,
  },
  name: String,
  image: String,
  cards: Number,
  price: Number,
  quantity: Number,
  remaining: Number,
  max_open: Number,
  __v: { type: Number, select: false },
}, {
  timestamps: false,
});

module.exports = mongoose.model('Inventory', InventorySchema);
