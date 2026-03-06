const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('./config/db')();

setTimeout(async () => {
  try {
    const admin = await User.findOne({ username: 'admin' });
    
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }
    
    // Update password to admin1234
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('Admin password updated successfully!');
    console.log('Username: admin');
    console.log('Password: admin1234');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 2000);
