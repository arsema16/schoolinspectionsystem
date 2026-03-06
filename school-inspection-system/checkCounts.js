const mongoose = require('mongoose');
const Student = require('./models/Student');
require('./config/db')();

setTimeout(async () => {
  try {
    const counts = await Student.aggregate([
      {$match: {year: 2017}},
      {$group: {_id: '$gradeLevel', count: {$sum: 1}}},
      {$sort: {_id: 1}}
    ]);
    
    console.log('2017 Student counts by grade:');
    let total = 0;
    counts.forEach(c => {
      console.log(`Grade ${c._id}: ${c.count} students`);
      total += c.count;
    });
    console.log(`\nCalculated Total: ${total}`);
    
    const dbTotal = await Student.countDocuments({year: 2017});
    console.log(`Database Total: ${dbTotal}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 2000);
