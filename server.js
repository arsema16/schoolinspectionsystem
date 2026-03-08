require('dotenv').config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const infrastructureRoutes = require("./routes/infrastructureRoutes");
const reportRoutes = require("./routes/reportRoutes");
const auditRoutes = require("./routes/auditRoutes");
const intelligenceRoutes = require("./routes/intelligenceRoutes");

console.log("Loading routes...");
app.use("/api/auth", authRoutes);
console.log("Auth routes loaded");
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/infrastructure", infrastructureRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit", auditRoutes);
app.use(intelligenceRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);