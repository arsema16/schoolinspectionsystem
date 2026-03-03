const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Token expired, please login again" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    // Find user and check if token exists in active sessions
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    // Check if token exists in active sessions
    const activeSession = user.activeSessions.find(
      session => session.token === token
    );

    if (!activeSession) {
      return res.status(401).json({ message: "Session invalid, please login again" });
    }

    // Check if session has expired
    if (new Date() > activeSession.expiresAt) {
      // Remove expired session
      user.activeSessions = user.activeSessions.filter(
        session => session.token !== token
      );
      await user.save();
      
      return res.status(401).json({ message: "Session expired, please login again" });
    }

    // Attach user information to request
    req.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: "Authentication error", error: error.message });
  }
};

exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied - insufficient permissions" });
    }
    
    next();
  };
};

// Convenience middleware for requiring Admin role
exports.requireAdmin = exports.authorize(['Admin']);

// Convenience middleware for requiring any authenticated user
exports.requireAuth = exports.protect;