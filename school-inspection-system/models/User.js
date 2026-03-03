const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Inspector'],
    required: true
  },
  
  // Session Management
  activeSessions: [{
    token: String,
    createdAt: Date,
    expiresAt: Date,
    ipAddress: String
  }],
  
  // Login Tracking
  lastLogin: Date,
  failedLoginAttempts: [{
    timestamp: Date,
    ipAddress: String
  }],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.activeSessions;
  return obj;
};

module.exports = mongoose.model("User", userSchema);