const User = require("../models/User");
const bcrypt = require("bcryptjs");
const auditLogger = require("../services/AuditLogger");

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -activeSessions')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve users", 
      error: error.message 
    });
  }
};

// Get single user by ID (Admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -activeSessions');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve user", 
      error: error.message 
    });
  }
};

// Create new user (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: "Username must be at least 3 characters" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters" 
      });
    }

    if (!['Admin', 'Inspector'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: "Role must be Admin or Inspector" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "Username already exists" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      role
    });

    // Log user creation
    await auditLogger.logEvent({
      action: 'CREATE',
      entityType: 'User',
      entityId: user._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { createdUsername: username, createdRole: role }
    });

    res.status(201).json({ 
      success: true,
      message: "User created successfully",
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create user", 
      error: error.message 
    });
  }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { username, role, isActive, password } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Prevent admin from deactivating themselves
    if (userId === req.user.id && isActive === false) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot deactivate your own account" 
      });
    }

    const updates = {};

    // Update username if provided
    if (username && username !== user.username) {
      if (username.length < 3) {
        return res.status(400).json({ 
          success: false,
          message: "Username must be at least 3 characters" 
        });
      }

      // Check if new username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          message: "Username already exists" 
        });
      }

      updates.username = username;
    }

    // Update role if provided
    if (role && ['Admin', 'Inspector'].includes(role)) {
      updates.role = role;
    }

    // Update active status if provided
    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
      
      // If deactivating, clear active sessions
      if (!isActive) {
        updates.activeSessions = [];
      }
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false,
          message: "Password must be at least 6 characters" 
        });
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    // Apply updates
    Object.assign(user, updates);
    await user.save();

    // Log user update
    await auditLogger.logEvent({
      action: 'UPDATE',
      entityType: 'User',
      entityId: user._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { updates: Object.keys(updates) }
    });

    res.json({ 
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update user", 
      error: error.message 
    });
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot delete your own account" 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const deletedUsername = user.username;
    await User.findByIdAndDelete(userId);

    // Log user deletion
    await auditLogger.logEvent({
      action: 'DELETE',
      entityType: 'User',
      entityId: userId,
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { deletedUsername }
    });

    res.json({ 
      success: true,
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete user", 
      error: error.message 
    });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -activeSessions');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve user profile", 
      error: error.message 
    });
  }
};

// Update current user password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "New password must be at least 6 characters" 
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    
    // Clear all active sessions (force re-login)
    user.activeSessions = [];
    
    await user.save();

    // Log password change
    await auditLogger.logEvent({
      action: 'UPDATE',
      entityType: 'User',
      entityId: user._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { action: 'password_change' }
    });

    res.json({ 
      success: true,
      message: "Password updated successfully. Please login again." 
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update password", 
      error: error.message 
    });
  }
};
