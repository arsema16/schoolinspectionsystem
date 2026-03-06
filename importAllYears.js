require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');

console.log('='.repeat(60));
console.log('IMPORTING ALL STUDENT DATA');
console.log('='.repeat(60));

const files = ['2015.xlsx', '2016.xlsx', '2017.xlsx'];

for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log(`\n❌ File not found: ${file}`);
        continue;
    }
    
    console.log(`\n📁 Importing ${file}...`);
    console.log('-'.repeat(60));
    
    try {
        // Run the import script for this file
        execSync(`node importStudents.js ${file}`, {
            stdio: 'inherit'
        });
        console.log(`✅ ${file} imported successfully`);
    } catch (error) {
        console.error(`❌ Error importing ${file}:`, error.message);
    }
}

console.log('\n' + '='.repeat(60));
console.log('IMPORT COMPLETE');
console.log('='.repeat(60));
console.log('\nYou can now access the dashboard to view all data.');

