const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDB = require("./config/db");

connectDB();

async function createAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: "admin" });
        
        if (existingAdmin) {
            console.log("Admin user already exists!");
            mongoose.connection.close();
            return;
        }

        const hashedPassword = await bcrypt.hash("admin1234", 10);

        const admin = new User({
            username: "admin",
            password: hashedPassword,
            role: "Admin"
        });

        await admin.save();
        console.log("Admin user created successfully!");
        console.log("Username: admin");
        console.log("Password: admin1234");
        mongoose.connection.close();
    } catch (error) {
        console.error("Error creating admin:", error);
        mongoose.connection.close();
    }
}

createAdmin();