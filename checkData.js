require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-inspection');
        console.log('Connected to MongoDB\n');
        
        // Get stats by year and grade
        const stats = await Student.aggregate([
            {
                $group: {
                    _id: { year: '$year', grade: '$gradeLevel' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.grade': 1 }
            }
        ]);
        
        console.log('Students by Year and Grade:');
        console.log('============================');
        stats.forEach(s => {
            console.log(`Year ${s._id.year}, Grade ${s._id.grade}: ${s.count} students`);
        });
        
        const total = await Student.countDocuments();
        console.log(`\nTotal students in database: ${total}`);
        
        // Check a sample student
        const sample = await Student.findOne().limit(1);
        if (sample) {
            console.log('\nSample student:');
            console.log(JSON.stringify(sample, null, 2));
        }
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
