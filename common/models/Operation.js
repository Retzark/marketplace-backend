const mongoose = require('mongoose');

const OperationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['issue', 'transfer'],
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    min: 1,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  ref_trx: {
    type: String,
    required: true,
  },
  trx_id: String,
  processed: {
    type: Boolean,
    default: false,
    index: true,
  },
  processed_at: Date,
  __v: { type: Number, select: false },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('Operation', OperationSchema);
