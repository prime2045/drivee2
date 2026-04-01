const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  coins: {
    type: Number,
    default: 500
  },
  gems: {
    type: Number,
    default: 50
  },
  rides: {
    type: Number,
    default: 0
  },
  zonesUnlocked: {
    type: Number,
    default: 1
  },
  skin: {
    type: String,
    default: "🚖"
  },
  achievements: {
    type: Map,
    of: Boolean,
    default: {
      "Ночной гонщик": false,
      "Кофейный мастер": false,
      "100 поездок": false,
      "Первооткрыватель": false,
      "Легенда города": false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);