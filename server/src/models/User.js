const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    avatar: {
      type: String,
      default: ''
    },
    statusMessage: {
      type: String,
      default: 'Hey there! I am using Sapphire Chat.',
      maxlength: 120
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate default avatar URL if none provided
userSchema.methods.getAvatarUrl = function () {
  if (this.avatar) return this.avatar;
  const encodedName = encodeURIComponent(this.username || 'User');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodedName}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

// Customize JSON output to never expose password
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    if (!ret.avatar) {
      ret.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(ret.username || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
