const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://mongo:QUdvdXtdNuSPFAKnirJqIpwiCsrWDEJX@turntable.proxy.rlwy.net:55711";
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("Database Connection Failed:", error.message);
    console.log("Retrying in 5 seconds...");
    setTimeout(connectDB, 5000); // retry instead of exit
  }
};

module.exports = connectDB;