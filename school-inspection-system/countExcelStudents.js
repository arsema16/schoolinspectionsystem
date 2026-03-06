const XLSX = require('xlsx');

const wb = XLSX.readFile('2017.xlsx');

function countStudentsInSheet(sheetName) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return 0;
  
  const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
  
  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && (row.includes('Student Name') || row.includes('Age') || row.includes('No'))) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) return 0;
  
  let count = 0;
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const studentNo = row[0];
    if (studentNo && !isNaN(parseInt(studentNo))) {
      count++;
    }
  }
  
  return count;
}

console.log('2017 Excel File - Student Counts:\n');

const classes = [
  {name: '9A', sheets: ['9A Sem 1', '9A Sem2', '9A Sem Avr']},
  {name: '9B', sheets: ['9B Sem 1', '9B Sem 2', '9B Avr']},
  {name: '9C', sheets: ['9C Sem 1', '9C Sem2', '9C Avr']},
  {name: '10A', sheets: ['10A Sem 1', '10A Sem 2', '10A Avr']},
  {name: '10B', sheets: ['10B Sem1', '10B Sem 2', '10B Avr']},
  {name: '11A', sheets: ['11A (NS) Sem1', '11A (NS) Sem2 ', '11A (NS)Avr']},
  {name: '11B', sheets: ['11B (SS) Sem1', '11B (SS) Sem 2', '11B(SS) Avr']},
  {name: '12A', sheets: ['12 A (NS) Sem1', '12A(NS)Sem 2', '12A (NS) Avr']},
  {name: '12B', sheets: ['12B (SS)Sem1', '12B (SS) Sem 2', '12B Av']}
];

let totalBySemester = {sem1: 0, sem2: 0, avg: 0};
let gradeTotal = {9: 0, 10: 0, 11: 0, 12: 0};

classes.forEach(cls => {
  const counts = cls.sheets.map(s => countStudentsInSheet(s));
  console.log(`${cls.name}:`);
  console.log(`  Sem 1: ${counts[0]} students`);
  console.log(`  Sem 2: ${counts[1]} students`);
  console.log(`  Average: ${counts[2]} students`);
  
  const maxCount = Math.max(...counts);
  console.log(`  Expected: ${maxCount} students\n`);
  
  totalBySemester.sem1 += counts[0];
  totalBySemester.sem2 += counts[1];
  totalBySemester.avg += counts[2];
  
  const grade = parseInt(cls.name);
  gradeTotal[grade] += maxCount;
});

console.log('\n=== TOTALS ===');
console.log(`Semester 1 sheets total: ${totalBySemester.sem1}`);
console.log(`Semester 2 sheets total: ${totalBySemester.sem2}`);
console.log(`Average sheets total: ${totalBySemester.avg}`);
console.log('\nBy Grade:');
console.log(`Grade 9: ${gradeTotal[9]}`);
console.log(`Grade 10: ${gradeTotal[10]}`);
console.log(`Grade 11: ${gradeTotal[11]}`);
console.log(`Grade 12: ${gradeTotal[12]}`);
console.log(`\nExpected Total Students: ${gradeTotal[9] + gradeTotal[10] + gradeTotal[11] + gradeTotal[12]}`);
