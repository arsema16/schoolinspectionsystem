const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./models/Student');
const predictor = require('./services/Predictor');

async function testPredictions() {
    try {
        const MONGODB_URI = 'mongodb+srv://schooladmin:arse123@cluster0.idnv9bs.mongodb.net/?appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get data for 2015-2017
        const years = [2015, 2016, 2017];
        const subjects = ['amharic', 'english', 'maths', 'physics', 'chemistry', 'biology', 'geography', 'history', 'civics', 'ict', 'hpe'];

        console.log('\n=== Historical Subject Averages ===\n');

        for (const subject of subjects) {
            console.log(`\n${subject.toUpperCase()}:`);
            const historicalData = [];

            for (const year of years) {
                const students = await Student.find({ year });
                
                if (students.length === 0) {
                    console.log(`  ${year}: No data`);
                    continue;
                }

                let totalMark = 0;
                let count = 0;

                students.forEach(student => {
                    const s1 = student.semester1?.[subject];
                    const s2 = student.semester2?.[subject];
                    
                    if (s1 != null && s2 != null) {
                        totalMark += (s1 + s2) / 2;
                        count++;
                    } else if (s1 != null) {
                        totalMark += s1;
                        count++;
                    } else if (s2 != null) {
                        totalMark += s2;
                        count++;
                    }
                });

                if (count > 0) {
                    const average = totalMark / count;
                    historicalData.push({ year, value: average });
                    console.log(`  ${year}: ${average.toFixed(2)} (${count} students)`);
                }
            }

            // Calculate prediction for 2018
            if (historicalData.length >= 2) {
                const yearValues = historicalData.map(d => d.year);
                const markValues = historicalData.map(d => d.value);
                const regression = predictor.calculateLinearRegression(yearValues, markValues);
                const predicted2018 = regression.slope * 2018 + regression.intercept;
                
                console.log(`  Slope: ${regression.slope.toFixed(4)}`);
                console.log(`  Intercept: ${regression.intercept.toFixed(2)}`);
                console.log(`  R²: ${regression.r2.toFixed(4)}`);
                console.log(`  PREDICTED 2018: ${predicted2018.toFixed(2)}`);
            } else {
                console.log(`  Insufficient data for prediction`);
            }
        }

        await mongoose.disconnect();
        console.log('\n\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testPredictions();
