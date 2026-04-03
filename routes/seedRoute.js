const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

router.get('/api/seed-students', async (req, res) => {
  try {
    const Student = require('../models/Student');
    const count = await Student.countDocuments();
    if (count > 0) return res.json({ message: `Already have ${count} students` });

    function parseRosterSheet(sheet) {
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      let headerIdx = -1;
      for (let i = 0; i < Math.min(10, data.length); i++) {
        if (data[i] && data[i].some(c => String(c || '').includes('Student Name'))) { headerIdx = i; break; }
      }
      if (headerIdx === -1) return [];
      const headers = data[headerIdx].map(h => h != null ? String(h).trim().toLowerCase() : '');
      const getCol = (names) => { for (const n of names) { const i = headers.findIndex(h => h && h.includes(n.toLowerCase())); if (i !== -1) return i; } return -1; };
      const cols = { no: getCol(['no']), name: getCol(['student name','name']), age: getCol(['age']), sex: getCol(['sex','gender']), semester: getCol(['semester']) !== -1 ? getCol(['semester']) : 4, amharic: getCol(['amharic']), english: getCol(['english']), maths: getCol(['maths','math']), physics: getCol(['physics']), chemistry: getCol(['chemistry']), biology: getCol(['biology']), geography: getCol(['geography']), history: getCol(['history']), civics: getCol(['civics']), ict: getCol(['ict']), hpe: getCol(['h.p.e','hpe']), average: getCol(['average']), rank: getCol(['rank']) };
      const parseMark = (val) => { if (val == null || val === '') return null; const n = parseFloat(val); return isNaN(n) ? null : Math.min(100, Math.max(0, n)); };
      const students = []; let cur = null;
      for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i]; if (!row || row.length === 0) continue;
        const no = row[cols.no]; const semLabel = String(row[cols.semester] || '').toLowerCase();
        if (no && !isNaN(parseInt(no))) { cur = { no: parseInt(no), name: row[cols.name] ? String(row[cols.name]).trim() : null, age: parseInt(row[cols.age]) || null, sex: row[cols.sex] || null, semester1: null, semester2: null, yearlyAverage: null, rank: null }; students.push(cur); }
        if (!cur) continue;
        if (!cur.name && row[cols.name]) cur.name = String(row[cols.name]).trim();
        const s = { amharic: parseMark(row[cols.amharic]), english: parseMark(row[cols.english]), maths: parseMark(row[cols.maths]), physics: parseMark(row[cols.physics]), chemistry: parseMark(row[cols.chemistry]), biology: parseMark(row[cols.biology]), geography: parseMark(row[cols.geography]), history: parseMark(row[cols.history]), civics: parseMark(row[cols.civics]), ict: parseMark(row[cols.ict]), hpe: parseMark(row[cols.hpe]), average: parseMark(row[cols.average]) };
        if (semLabel.includes('1') || (semLabel.includes('sem') && !semLabel.includes('2') && !semLabel.includes('avr') && !semLabel.includes('average'))) cur.semester1 = s;
        else if (semLabel.includes('2')) cur.semester2 = s;
        else if (semLabel.includes('avr') || semLabel.includes('average')) { cur.yearlyAverage = parseMark(row[cols.average]); const rv = row[cols.rank]; cur.rank = (rv && !isNaN(parseInt(rv))) ? parseInt(rv) : null; }
      }
      return students.filter(s => s.age && s.sex);
    }

    let total = 0;
    const results = {};
    for (const year of [2015, 2016, 2017]) {
      const filePath = path.join(__dirname, '..', `${year}.xlsx`);
      if (!fs.existsSync(filePath)) { results[year] = 'file not found'; continue; }
      const wb = xlsx.readFile(filePath);
      const toInsert = [];
      for (const sheetName of wb.SheetNames) {
        if (!sheetName.toLowerCase().includes('roster')) continue;
        const classMatch = sheetName.match(/Roster\s*(\d{1,2}[A-Z])/i);
        if (!classMatch) continue;
        const classCode = classMatch[1].toUpperCase();
        const gradeLevel = parseInt(classCode.match(/^(\d+)/)[1]);
        const students = parseRosterSheet(wb.Sheets[sheetName]);
        for (const s of students) {
          toInsert.push({ studentId: `STU-${year}-${classCode}-${String(s.no).padStart(3,'0')}`, name: s.name || `Student ${s.no}`, year, age: s.age, gender: (s.sex==='M'||s.sex==='Male')?'Male':'Female', gradeLevel, semester1: s.semester1||{}, semester2: s.semester2||{}, yearlyAverage: s.yearlyAverage, rank: s.rank });
        }
      }
      try {
        const r = await Student.insertMany(toInsert, { ordered: false });
        results[year] = r.length; total += r.length;
      } catch(e) {
        const ins = e.insertedDocs ? e.insertedDocs.length : 0;
        results[year] = ins; total += ins;
      }
    }
    res.json({ message: 'Seed complete', total, results });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
