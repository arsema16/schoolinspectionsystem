const mongoose = require('mongoose');
const Student = require('./models/Student');

async function checkHPE2016() {
    try {
        const MONGODB_URI = 'mongodb+srv://schooladmin:arse123@cluster0.idnv9bs.mongodb.net/?appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        console.log('=== 2016 HPE Analysis ===\n');
        
        // Get count
        const total2016 = await Student.countDocuments({ year: 2016 });
        console.log(`Total 2016 students: ${total2016}`);
        
        // Get students with HPE in semester 1
        const withHPESem1 = await Student.countDocuments({ 
            year: 2016, 
            'semester1.hpe': { $exists: true, $ne: null } 
        });
        console.log(`Students with Semester 1 HPE: ${withHPESem1}`);
        
        // Get students with HPE in semester 2
        const withHPESem2 = await Student.countDocuments({ 
            year: 2016, 
            'semester2.hpe': { $exists: true, $ne: null } 
        });
        console.log(`Students with Semester 2 HPE: ${withHPESem2}`);
        
        // Sample some students
        const samples = await Student.find({ year: 2016 }).limit(20);
        
        console.log('\nSample 2016 students HPE data:');
        samples.forEach((s, i) => {
            const hpe1 = s.semester1?.hpe;
            const hpe2 = s.semester2?.hpe;
            console.log(`  ${i+1}. Grade ${s.gradeLevel}${s.section}: Sem1=${hpe1 || 'N/A'}, Sem2=${hpe2 || 'N/A'}`);
        });
        
        // Check if it's a grade-specific issue
        console.log('\n=== HPE by Grade Level (2016) ===');
        for (let grade = 9; grade <= 12; grade++) {
            const gradeStudents = await Student.find({ year: 2016, gradeLevel: grade });
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

checkHPE2016();
