const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Student = require('./models/Student');
const connectDB = require('./config/db');

// Connect to database
connectDB();

async function importStudents(filePath) {
  try {
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(filePath);
    
    // Detect year from filename
    let year = 2015;
    if (filePath.includes('2016')) year = 2016;
    else if (filePath.includes('2017')) year = 2017;
    else if (filePath.includes('2018')) year = 2018;
    
    // Group sheets by class
    const classSheetsMap = {};
    
    for (const sheetName of workbook.SheetNames) {
      const lowerName = sheetName.toLowerCase();
      
      // Extract class code (9A, 10B, 11A, 12B, etc.)
      // Handle formats like "11A", "11 A (NS)", "11B (SS)", "12A(NS)", etc.
      const classMatch = sheetName.match(/(\d{1,2})\s*([A-Z])/i);
      if (!classMatch) continue;
      
      const classCode = classMatch[1] + classMatch[2].toUpperCase(); // e.g., "11A", "12B"
      
      if (!classSheetsMap[classCode]) {
        classSheetsMap[classCode] = {};
      }
      
      // Determine sheet type
      if (lowerName.includes('sem 1') || lowerName.includes('sem1')) {
        classSheetsMap[classCode].sem1 = sheetName;
      } else if (lowerName.includes('sem 2') || lowerName.includes('sem2')) {
        classSheetsMap[classCode].sem2 = sheetName;
      } else if (lowerName.includes('avr') || lowerName.includes('average') || lowerName.match(/\bav\b/)) {
        classSheetsMap[classCode].avg = sheetName;
      }
    }
    
    console.log(`Found ${Object.keys(classSheetsMap).length} classes`);
    
    const allStudents = [];
    
    // Process each class
    for (const [classCode, sheets] of Object.entries(classSheetsMap)) {
      console.log(`\nProcessing class ${classCode}...`);
      
      if (!sheets.sem1 || !sheets.sem2 || !sheets.avg) {
        console.log(`  Skipping ${classCode}: missing sheets`);
        continue;
      }
      
      // Extract grade level from class code
      const gradeMatch = classCode.match(/^(\d+)/);
      const gradeLevel = gradeMatch ? parseInt(gradeMatch[1]) : null;
      
      if (!gradeLevel) {
        console.log(`  Skipping ${classCode}: cannot determine grade level`);
        continue;
      }
      
      // Read all three sheets
      const sem1Data = readSheetData(workbook.Sheets[sheets.sem1]);
      const sem2Data = readSheetData(workbook.Sheets[sheets.sem2]);
      const avgData = readSheetData(workbook.Sheets[sheets.avg]);
      
      // Combine data by student number
      const studentCount = Math.max(sem1Data.length, sem2Data.length, avgData.length);
      
      for (let i = 0; i < studentCount; i++) {
        const s1 = sem1Data[i];
        const s2 = sem2Data[i];
        const avg = avgData[i];
        
        if (!s1 && !s2 && !avg) continue;
        
        // Use data from any available source
        const baseData = s1 || s2 || avg;
        
        const student = {
          studentId: `STU-${year}-${classCode}-${String(baseData.no).padStart(3, '0')}`,
          name: baseData.name || `Student ${baseData.no}`,
          year: year,
          age: parseInt(baseData.age),
          gender: baseData.sex === 'M' || baseData.sex === 'Male' ? 'Male' : 'Female',
          gradeLevel: gradeLevel,
          semester1: s1 ? s1.subjects : {},
          semester2: s2 ? s2.subjects : {},
          yearlyAverage: avg ? avg.yearlyAverage : null,
          rank: avg ? avg.rank : null
        };
        
        // Debug for grade 11
        if (gradeLevel === 11 && i < 2) {
          console.log(`  Student ${i+1}: ${student.studentId}, Class: ${classCode}`);
        }
        
        allStudents.push(student);
      }
      
      console.log(`  Processed ${studentCount} students from ${classCode}`);
    }
    
    console.log(`\nTotal students to import: ${allStudents.length}`);
    
    if (allStudents.length === 0) {
      console.log('No students found to import');
      process.exit(0);
    }
    
    // Clear existing data for this year only
    console.log(`\nClearing existing student data for year ${year}...`);
    const deleteResult = await Student.deleteMany({ year: year });
    console.log(`Deleted ${deleteResult.deletedCount} existing records for year ${year}`);
    
    // Import students
    console.log('Importing students...');
    
    // Validate students before import
    const validStudents = [];
    const invalidStudents = [];
    
    for (const student of allStudents) {
      if (!student.age || !student.gender || !student.gradeLevel) {
        invalidStudents.push({
          id: student.studentId,
          reason: `Missing: age=${student.age}, gender=${student.gender}, grade=${student.gradeLevel}`
        });
      } else {
        validStudents.push(student);
      }
    }
    
    if (invalidStudents.length > 0) {
      console.log(`\nFound ${invalidStudents.length} invalid students:`);
      invalidStudents.slice(0, 5).forEach(s => console.log(`  ${s.id}: ${s.reason}`));
    }
    
    console.log(`\nImporting ${validStudents.length} valid students...`);
    
    let imported = 0;
    let failed = 0;
    const errors = [];
    
    for (const student of validStudents) {
      try {
        await Student.create(student);
        imported++;
        if (imported % 50 === 0) {
          process.stdout.write(`\rImported: ${imported}/${validStudents.length}`);
        }
      } catch (error) {
        failed++;
        if (errors.length < 10) {
          errors.push({
            id: student.studentId,
            error: error.message
          });
        }
      }
    }
    
    console.log(`\n\nImport complete!`);
    console.log(`Successfully imported: ${imported}`);
    console.log(`Failed: ${failed}`);
    
    if (errors.length > 0) {
      console.log(`\nFirst ${errors.length} errors:`);
      errors.forEach((e, idx) => {
        console.log(`${idx+1}. ${e.id}: ${e.error.substring(0, 150)}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }
}

function readSheetData(sheet) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && (row.includes('Student Name') || row.includes('Age'))) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) return [];
  
  const headers = data[headerRowIndex].map(h => h ? String(h).trim() : '');
  
  // Find column indices
  const getColIndex = (names) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h && h.toLowerCase().includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };
  
  const colIndices = {
    no: getColIndex(['No', 'Number', '#']),
    name: getColIndex(['Student Name', 'Name']),
    age: getColIndex(['Age']),
    sex: getColIndex(['Sex', 'Gender']),
    amharic: getColIndex(['Amharic']),
    english: getColIndex(['English']),
    maths: getColIndex(['Maths', 'Math']),
    physics: getColIndex(['Physics']),
    chemistry: getColIndex(['Chemistry']),
    biology: getColIndex(['Biology']),
    geography: getColIndex(['Geography']),
    history: getColIndex(['History']),
    civics: getColIndex(['Civics']),
    ict: getColIndex(['ICT', 'IT']),
    hpe: getColIndex(['H.P.E', 'HPE']),
    semester1Avg: headers.findIndex(h => h && (h.toLowerCase().includes('semster 1') || h.toLowerCase().includes('semester 1'))),
    semester2Avg: headers.findIndex(h => h && (h.toLowerCase().includes('semster 2') || h.toLowerCase().includes('semester 2'))),
    average: headers.findIndex(h => h && h.toLowerCase() === 'average'),
    rank: getColIndex(['Rank'])
  };
  
  const parseMark = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : Math.min(100, Math.max(0, num));
  };
  
  const students = [];
  
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const studentNo = row[colIndices.no];
    const age = row[colIndices.age];
    const sex = row[colIndices.sex];
    
    if (!studentNo || isNaN(parseInt(studentNo)) || !age || isNaN(parseInt(age)) || !sex) {
      continue;
    }
    
    const name = row[colIndices.name];
    if (name && (String(name).toLowerCase().includes('semester') || String(name).toLowerCase().includes('average'))) {
      continue;
    }
    
    const studentData = {
      no: parseInt(studentNo),
      name: name && name.trim() !== '' ? String(name).trim() : null,
      age: parseInt(age),
      sex: sex
    };
    
    // Check if this is an average sheet or semester sheet
    if (colIndices.semester1Avg !== -1 && colIndices.semester2Avg !== -1) {
      // Average sheet
      studentData.yearlyAverage = parseMark(row[colIndices.average]);
      const rankValue = row[colIndices.rank];
      studentData.rank = (rankValue && !isNaN(parseInt(rankValue))) ? parseInt(rankValue) : null;
    } else {
      // Semester sheet
      studentData.subjects = {
        amharic: parseMark(row[colIndices.amharic]),
        english: parseMark(row[colIndices.english]),
        maths: parseMark(row[colIndices.maths]),
        physics: parseMark(row[colIndices.physics]),
        chemistry: parseMark(row[colIndices.chemistry]),
        biology: parseMark(row[colIndices.biology]),
        geography: parseMark(row[colIndices.geography]),
        history: parseMark(row[colIndices.history]),
        civics: parseMark(row[colIndices.civics]),
        ict: parseMark(row[colIndices.ict]),
        hpe: parseMark(row[colIndices.hpe]),
        average: parseMark(row[colIndices.average])
      };
    }
    
    students.push(studentData);
  }
  
  return students;
}

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.log('Usage: node importStudents.js <path-to-excel-file>');
  console.log('Example: node importStudents.js students.xlsx');
  process.exit(1);
}

importStudents(filePath);
