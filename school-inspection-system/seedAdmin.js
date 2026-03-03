const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDB = require("./config/db");

connectDB();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = new User({
        fullName: "Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin"
    });

    await admin.save();
    console.log("Admin user created!");
    mongoose.connection.close();
}

createAdmin();