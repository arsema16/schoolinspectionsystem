const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const auditLogger = require("../services/AuditLogger");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const JWT_EXPIRATION = "8h"; // 8-hour expiration as per requirements

exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!['Admin', 'Inspector'].includes(role)) {
      return res.status(400).json({ message: "Role must be Admin or Inspector" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
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
      userId: req.user ? req.user.id : null,
      username: req.user ? req.user.username : 'system',
      userRole: req.user ? req.user.role : 'system',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({ user, message: "User created successfully" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database connecting, please try again in a moment." });
    }
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    
    if (!user) {
      // Log failed login attempt (user not found)
      await auditLogger.logEvent({
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: 'unknown',
        username: username,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Log failed login attempt
      user.failedLoginAttempts.push({
        timestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress
      });
      await user.save();

      await auditLogger.logEvent({
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user._id.toString(),
        userId: user._id,
        username: user.username,
        userRole: user.role,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });

      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token with 8-hour expiration
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Calculate expiration date (8 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    // Invalidate previous sessions (single session enforcement)
    user.activeSessions = [];

    // Store token in active sessions
    user.activeSessions.push({
      token: token,
      createdAt: new Date(),
      expiresAt: expiresAt,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    // Update last login and clear failed attempts
    user.lastLogin = new Date();
    user.failedLoginAttempts = [];

    await user.save();

    // Log successful login
    await auditLogger.logEvent({
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      userId: user._id,
      username: user.username,
      userRole: user.role,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({ 
      token, 
      role: user.role,
      username: user.username,
      expiresIn: JWT_EXPIRATION
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove token from active sessions
    user.activeSessions = user.activeSessions.filter(
      session => session.token !== token
    );

    await user.save();

    // Log logout event
    await auditLogger.logEvent({
      action: 'LOGOUT',
      entityType: 'User',
      entityId: user._id.toString(),
      userId: user._id,
      username: user.username,
      userRole: user.role,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};