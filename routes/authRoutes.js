const express = require("express");
const router = express.Router();
const { register, login, logout } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);

// Temp seed route - creates admin if not exists
router.get("/seed-admin", async (req, res) => {
  try {
    const User = require("../models/User");
    const bcrypt = require("bcryptjs");
    const existing = await User.findOne({ username: "admin" });
    if (existing) return res.json({ message: "Admin already exists" });
    const hashed = await bcrypt.hash("admin1234", 10);
    await User.create({ username: "admin", password: hashed, role: "Admin" });
    res.json({ message: "Admin created", username: "admin", password: "admin1234" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;