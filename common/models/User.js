const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    index: true,
    required: true,
    unique: true,
  },
  banned: {
    type: Boolean,
    default: false,
  },
  logged_in_at: {
    type: Date,
    default: () => new Date(),
  },
  __v: { type: Number, select: false },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = mongoose.model('User', UserSchema);
