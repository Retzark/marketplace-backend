const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  username: {
    type: String,
    index: true,
    required: true,
    lowercase: true,
  },
  uid: {
    type: String,
    index: true,
  },
  payment_method: {
    type: String,
    enum: ['paypal', 'hive', 'crypto'],
  },
  payment: {
    amount: Number,
    currency: String,
  },
  items: [{
    _id: false,
    symbol: {
      type: String,
      uppercase: true,
    },
    quantity: Number,
    original_quantity: Number,
    price: {
      amount: Number,
      currency: String,
    },
  }],
  total_price: {
    amount: Number,
    currency: String,
  },
  trx_id: {
    type: String,
    index: true,
  },
  completed_at: Date,
  payment_made: {
    type: Boolean,
    default: false,
  },
  payment_info: Object,
  __v: { type: Number, select: false },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Purchase', PurchaseSchema);
