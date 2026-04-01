const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mode: {
    type: String,
    enum: ['normal', 'quest', 'explore', 'challenge'],
    required: true
  },
  xpGained: Number,
  coinsGained: Number,
  bonusApplied: Boolean,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ride', RideSchema);