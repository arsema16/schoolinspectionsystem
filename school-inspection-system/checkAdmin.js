const mongoose = require('mongoose');
const User = require('./models/User');
require('./config/db')();

setTimeout(async () => {
  try {
    const users = await User.find({});
    console.log('All users in database:');
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Role: ${u.role}`);
    });
    
    const admin = await User.findOne({ username: 'admin' });
    if (admin) {
      console.log('\nAdmin user found with username "admin"');
    } else {
      console.log('\nNo admin user with username "admin" found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 2000);
