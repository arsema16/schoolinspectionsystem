const Student = require("../models/Student");
const auditLogger = require("../services/AuditLogger");
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.xlsx' && ext !== '.xls') return cb(new Error('Only Excel files are allowed'));
    cb(null, true);
  }
});

exports.uploadMiddleware = upload.single('file');

/**
 * Parse a Roster sheet which contains all data:
 * Each student has 3 rows: Semester 1, Semester 2, Average
 * Columns: No, Student Name, Age, Sex, Semester, Amharic, English, Maths, physics, chemistry, Biology, Geography, History, Civics, ICT, H.P.E, Total, Average, Rank
 */
function parseRosterSheet(sheet) {
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // Find header row (contains "Student Name")
  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    if (data[i] && data[i].some(c => String(c || '').includes('Student Name'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const headers = data[headerIdx].map(h => String(h || '').trim().toLowerCase());

  const getCol = (names) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const cols = {
    no:        getCol(['no']),
    name:      getCol(['student name', 'name']),
    age:       getCol(['age']),
    sex:       getCol(['sex', 'gender']),
    semester:  getCol(['semester']) !== -1 ? getCol(['semester']) : 4, // fallback to col 4
    amharic:   getCol(['amharic']),
    english:   getCol(['english']),
    maths:     getCol(['maths', 'math']),
    physics:   getCol(['physics']),
    chemistry: getCol(['chemistry']),
    biology:   getCol(['biology']),
    geography: getCol(['geography']),
    history:   getCol(['history']),
    civics:    getCol(['civics']),
    ict:       getCol(['ict']),
    hpe:       getCol(['h.p.e', 'hpe']),
    average:   getCol(['average']),
    rank:      getCol(['rank']),
  };

  const parseMark = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : Math.min(100, Math.max(0, num));
  };

  const students = [];
  let currentStudent = null;

  for (let i = headerIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const no = row[cols.no];
    const semLabel = String(row[cols.semester] || '').toLowerCase();

    // New student starts when there's a student number
    if (no && !isNaN(parseInt(no))) {
      currentStudent = {
        no: parseInt(no),
        name: row[cols.name] ? String(row[cols.name]).trim() : null,
        age: parseInt(row[cols.age]) || null,
        sex: row[cols.sex] || null,
        semester1: null,
        semester2: null,
        yearlyAverage: null,
        rank: null
      };
      students.push(currentStudent);
    }

    if (!currentStudent) continue;

    // Update name if found in this row
    if (!currentStudent.name && row[cols.name]) {
      currentStudent.name = String(row[cols.name]).trim();
    }

    const subjects = {
      amharic:   parseMark(row[cols.amharic]),
      english:   parseMark(row[cols.english]),
      maths:     parseMark(row[cols.maths]),
      physics:   parseMark(row[cols.physics]),
      chemistry: parseMark(row[cols.chemistry]),
      biology:   parseMark(row[cols.biology]),
      geography: parseMark(row[cols.geography]),
      history:   parseMark(row[cols.history]),
      civics:    parseMark(row[cols.civics]),
      ict:       parseMark(row[cols.ict]),
      hpe:       parseMark(row[cols.hpe]),
      average:   parseMark(row[cols.average])
    };

    if (semLabel.includes('1') || semLabel.includes('sem') && !semLabel.includes('2') && !semLabel.includes('avr') && !semLabel.includes('average')) {
      currentStudent.semester1 = subjects;
    } else if (semLabel.includes('2')) {
      currentStudent.semester2 = subjects;
    } else if (semLabel.includes('avr') || semLabel.includes('average')) {
      currentStudent.yearlyAverage = parseMark(row[cols.average]);
      const rv = row[cols.rank];
      currentStudent.rank = (rv && !isNaN(parseInt(rv))) ? parseInt(rv) : null;
    }
  }

  return students.filter(s => s.age && s.sex);
}

/**
 * POST /api/students/upload
 */
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

    let year = req.body.year ? parseInt(req.body.year) : null;
    if (!year) {
      const match = req.file.originalname.match(/(\d{4})/);
      if (match) year = parseInt(match[1]);
    }

    if (!year || year < 2010 || year > 2030) {
      return res.status(400).json({ message: "Valid year (2010-2030) is required" });
    }

    console.log(`Importing year ${year}, sheets:`, workbook.SheetNames);

    let imported = 0, failed = 0, duplicates = 0;

    for (const sheetName of workbook.SheetNames) {
      // Only process Roster sheets - they contain all data
      if (!sheetName.toLowerCase().includes('roster')) continue;

      // Extract class code e.g. "9A", "11A", "12B"
      const classMatch = sheetName.match(/Grade\s*(\d{1,2}[A-Z])/i) || sheetName.match(/Roster\s*(\d{1,2}[A-Z])/i);
      if (!classMatch) {
        console.log(`Skipping roster sheet, no class found: "${sheetName}"`);
        continue;
      }

      const classCode = classMatch[1].toUpperCase();
      const gradeMatch = classCode.match(/^(\d+)/);
      const gradeLevel = gradeMatch ? parseInt(gradeMatch[1]) : null;
      if (!gradeLevel) continue;

      const students = parseRosterSheet(workbook.Sheets[sheetName]);
      console.log(`Sheet "${sheetName}" (${classCode}): ${students.length} students parsed`);

      for (const s of students) {
        const studentId = `STU-${year}-${classCode}-${String(s.no).padStart(3, '0')}`;

        const exists = await Student.findOne({ studentId, year });
        if (exists) { duplicates++; continue; }

        try {
          await Student.create({
            studentId,
            name: s.name || `Student ${s.no}`,
            year,
            age: s.age,
            gender: (s.sex === 'M' || s.sex === 'Male') ? 'Male' : 'Female',
            gradeLevel,
            semester1: s.semester1 || {},
            semester2: s.semester2 || {},
            yearlyAverage: s.yearlyAverage,
            rank: s.rank
          });
          imported++;
        } catch (err) {
          console.error(`Failed ${studentId}:`, err.message);
          failed++;
        }
      }
    }

    if (imported === 0 && duplicates === 0) {
      return res.status(400).json({
        message: "No valid student data found.",
        hint: "Make sure your Excel file has sheets named like 'Roster 9A', 'Roster 10B', etc.",
        sheetsFound: workbook.SheetNames
      });
    }

    if (imported === 0 && duplicates > 0) {
      return res.json({
        message: `All ${duplicates} students already exist in the database for year ${year}. No new records added.`,
        filename: req.file.originalname,
        year, imported: 0, failed, duplicates
      });
    }

    await auditLogger.logEvent({
      action: 'CREATE', entityType: 'Student',
      entityId: `excel_import_${year}`,
      userId: req.user.id, username: req.user.username, userRole: req.user.role,
      changes: { after: { year, filename: req.file.originalname, imported, failed, duplicates } },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: "Import complete",
      filename: req.file.originalname,
      year, imported, failed, duplicates
    });

  } catch (error) {
    console.error('Upload Excel error:', error);
    res.status(500).json({ message: "Excel upload failed", error: error.message });
  }
};

/**
 * GET /api/students
 */
exports.getStudents = async (req, res) => {
  try {
    const { year, gradeLevel, gender, page = 1, limit = 50 } = req.query;
    const query = {};
    if (year) query.year = parseInt(year);
    if (gradeLevel) query.gradeLevel = parseInt(gradeLevel);
    if (gender) query.gender = gender;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const students = await Student.find(query).sort({ year: -1, studentId: 1 }).skip(skip).limit(limitNum);
    const total = await Student.countDocuments(query);

    res.json({ students, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve students", error: error.message });
  }
};

/**
 * GET /api/students/:studentId/history
 */
exports.getStudentHistory = async (req, res) => {
  try {
    const records = await Student.find({ studentId: req.params.studentId }).sort({ year: 1 });
    if (records.length === 0) return res.status(404).json({ message: "No records found" });

    let trend = "stable";
    if (records.length >= 2) {
      const change = records[records.length - 1].average - records[0].average;
      if (change > 5) trend = "improving";
      else if (change < -5) trend = "declining";
    }

    res.json({
      studentId: req.params.studentId,
      name: records[0].name,
      records: records.map(r => ({ year: r.year, average: r.average, subjects: r.subjects, gradeLevel: r.gradeLevel, rank: r.rank })),
      trend
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve student history", error: error.message });
  }
};

/**
 * PUT /api/students/:id
 */
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const before = student.toObject();
    Object.keys(req.body).forEach(key => { if (key !== '_id' && key !== '__v') student[key] = req.body[key]; });
    await student.save();

    await auditLogger.logEvent({
      action: 'UPDATE', entityType: 'Student', entityId: req.params.id,
      userId: req.user.id, username: req.user.username, userRole: req.user.role,
      changes: { before, after: student.toObject() },
      ipAddress: req.ip || req.connection.remoteAddress, userAgent: req.get('user-agent')
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Failed to update student", error: error.message });
  }
};

/**
 * DELETE /api/students/:id
 */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const before = student.toObject();
    await Student.findByIdAndDelete(req.params.id);

    await auditLogger.logEvent({
      action: 'DELETE', entityType: 'Student', entityId: req.params.id,
      userId: req.user.id, username: req.user.username, userRole: req.user.role,
      changes: { before },
      ipAddress: req.ip || req.connection.remoteAddress, userAgent: req.get('user-agent')
    });

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete student", error: error.message });
  }
};
