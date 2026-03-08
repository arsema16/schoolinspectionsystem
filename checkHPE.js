const mongoose = require('mongoose');
const Student = require('./models/Student');

async function checkHPE() {
    try {
        const MONGODB_URI = 'mongodb+srv://schooladmin:arse123@cluster0.idnv9bs.mongodb.net/?appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const years = [2015, 2016, 2017];

        for (const year of years) {
            console.log(`\n=== ${year} HPE Data ===`);
            const students = await Student.find({ year }).limit(10);
            
            console.log(`Total students: ${await Student.countDocuments({ year })}`);
            
            let hpeCount = 0;
            let hpeTotal = 0;
            let hpeSem1Count = 0;
            let hpeSem2Count = 0;
            let hpeSem1Total = 0;
            let hpeSem2Total = 0;
            
            const allStudents = await Student.find({ year });
            
            allStudents.forEach(student => {
                const s1 = student.semester1?.hpe;
                const s2 = student.semester2?.hpe;
                
                if (s1 != null) {
                    hpeSem1Count++;
                    hpeSem1Total += s1;
                }
                
                if (s2 != null) {
                    hpeSem2Count++;
                    hpeSem2Total += s2;
                }
                
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
            
            console.log(`Students with HPE data: ${hpeCount}`);
            console.log(`Semester 1 HPE: ${hpeSem1Count} students, avg: ${(hpeSem1Total / hpeSem1Count).toFixed(2)}`);
            console.log(`Semester 2 HPE: ${hpeSem2Count} students, avg: ${(hpeSem2Total / hpeSem2Count).toFixed(2)}`);
            console.log(`Combined HPE average: ${(hpeTotal / hpeCount).toFixed(2)}`);
            
            // Show sample data
            console.log('\nSample students:');
            students.slice(0, 5).forEach((s, i) => {
                console.log(`  ${i+1}. ${s.name}: Sem1=${s.semester1?.hpe || 'N/A'}, Sem2=${s.semester2?.hpe || 'N/A'}`);
            });
        }

        await mongoose.disconnect();
        console.log('\n\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkHPE();
