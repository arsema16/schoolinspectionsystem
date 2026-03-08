const mongoose = require('mongoose');
const Student = require('./models/Student');

async function checkHPE2017() {
    try {
        const MONGODB_URI = 'mongodb+srv://schooladmin:arse123@cluster0.idnv9bs.mongodb.net/?appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        console.log('=== 2017 HPE Analysis ===\n');
        
        const total2017 = await Student.countDocuments({ year: 2017 });
        console.log(`Total 2017 students: ${total2017}`);
        
        const withHPESem1 = await Student.countDocuments({ 
            year: 2017, 
            'semester1.hpe': { $exists: true, $ne: null } 
        });
        console.log(`Students with Semester 1 HPE: ${withHPESem1}`);
        
        const withHPESem2 = await Student.countDocuments({ 
            year: 2017, 
            'semester2.hpe': { $exists: true, $ne: null } 
        });
        console.log(`Students with Semester 2 HPE: ${withHPESem2}`);
        
        console.log('\n=== HPE by Grade Level (2017) ===');
        for (let grade = 9; grade <= 12; grade++) {
            const gradeStudents = await Student.find({ year: 2017, gradeLevel: grade });
            let hpeCount = 0;
            let hpeTotal = 0;
            
            gradeStudents.forEach(s => {
                const s1 = s.semester1?.hpe;
                const s2 = s.semester2?.hpe;
                
                if (s1 != null && s2 != null) {
                    hpeCount++;
                    hpeTotal += (s1 + s2) / 2;
                } else if (s1 != null) {
                    hpeCount++;
                    hpeTotal += s1;
                } else if (s2 != null) {
                    hpeCount++;
                    hpeTotal += s2;
                }
            });
            
            if (hpeCount > 0) {
                console.log(`  Grade ${grade}: ${hpeCount} students, avg: ${(hpeTotal / hpeCount).toFixed(2)}`);
            } else {
                console.log(`  Grade ${grade}: No HPE data`);
            }
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkHPE2017();
