const Student = require("../models/Student");
const auditLogger = require("../services/AuditLogger");
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files are allowed'));
    }
    cb(null, true);
  }
});

exports.uploadMiddleware = upload.single('file');

// Helper: parse a mark value safely
const parseMark = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : Math.min(100, Math.max(0, num));
};

// Helper: read a single sheet and return student rows
const readSheetData = (sheet, xlsx) => {
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
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
  const getCol = (names) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h && h.toLowerCase().includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const cols = {
    no: getCol(['No', 'Number']),
    name: getCol(['Student Name', 'Name']),
    age: getCol(['Age']),
    sex: getCol(['Sex', 'Gender']),
    amharic: getCol(['Amharic']),
    english: getCol(['English']),
    maths: getCol(['Maths', 'Math']),
    physics: getCol(['Physics']),
    chemistry: getCol(['Chemistry']),
    biology: getCol(['Biology']),
    geography: getCol(['Geography']),
    history: getCol(['History']),
    civics: getCol(['Civics']),
    ict: getCol(['ICT', 'IT']),
    hpe: getCol(['H.P.E', 'HPE']),
    average: headers.findIndex(h => h && h.toLowerCase() === 'average'),
    rank: getCol(['Rank']),
    sem1Avg: headers.findIndex(h => h && h.toLowerCase().includes('semester 1')),
    sem2Avg: headers.findIndex(h => h && h.toLowerCase().includes('semester 2')),
  };

  const students = [];
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    const no = row[cols.no];
    const age = row[cols.age];
    const sex = row[cols.sex];
    if (!no || isNaN(parseInt(no)) || !age || isNaN(parseInt(age)) || !sex) continue;
    const name = row[cols.name];
    if (name && (String(name).toLowerCase().includes('semester') || String(name).toLowerCase().includes('average'))) continue;

    const isAvgSheet = cols.sem1Avg !== -1 && cols.sem2Avg !== -1;
    const student = {
      no: parseInt(no),
      name: name ? String(name).trim() : null,
      age: parseInt(age),
      sex
    };

    if (isAvgSheet) {
      student.yearlyAverage = parseMark(row[cols.average]);
      const rv = row[cols.rank];
      student.rank = (rv && !isNaN(parseInt(rv))) ? parseInt(rv) : null;
    } else {
      student.subjects = {
        amharic: parseMark(row[cols.amharic]),
        english: parseMark(row[cols.english]),
        maths: parseMark(row[cols.maths]),
        physics: parseMark(row[cols.physics]),
        chemistry: parseMark(row[cols.chemistry]),
        biology: parseMark(row[cols.biology]),
        geography: parseMark(row[cols.geography]),
        history: parseMark(row[cols.history]),
        civics: parseMark(row[cols.civics]),
        ict: parseMark(row[cols.ict]),
        hpe: parseMark(row[cols.hpe]),
        average: parseMark(row[cols.average])
      };
    }
    students.push(student);
  }
  return students;
};

/**
 * POST /api/students/upload
 * Upload and import Excel file - Admin only
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

    // Group sheets by class code e.g. "9A", "10B"
    const classSheetsMap = {};
    for (const sheetName of workbook.SheetNames) {
      const classMatch = sheetName.match(/(\d{1,2}[A-Z])/i);
      if (!classMatch) continue;
      const classCode = classMatch[1].toUpperCase();
      if (!classSheetsMap[classCode]) classSheetsMap[classCode] = {};
      const lower = sheetName.toLowerCase();
      if (lower.includes('sem 1') || lower.includes('sem1')) classSheetsMap[classCode].sem1 = sheetName;
      else if (lower.includes('sem 2') || lower.includes('sem2')) classSheetsMap[classCode].sem2 = sheetName;
      else if (lower.includes('avr') || lower.includes('average')) classSheetsMap[classCode].avg = sheetName;
    }

    let imported = 0, failed = 0, duplicates = 0;

    for (const [classCode, sheets] of Object.entries(classSheetsMap)) {
      if (!sheets.sem1 || !sheets.sem2 || !sheets.avg) continue;
      const gradeMatch = classCode.match(/^(\d+)/);
      const gradeLevel = gradeMatch ? parseInt(gradeMatch[1]) : null;
      const section = classCode.replace(/^\d+/, '') || 'A';
      if (!gradeLevel) continue;

      const sem1Data = readSheetData(workbook.Sheets[sheets.sem1], xlsx);
      const sem2Data = readSheetData(workbook.Sheets[sheets.sem2], xlsx);
      const avgData  = readSheetData(workbook.Sheets[sheets.avg], xlsx);
      const count = Math.max(sem1Data.length, sem2Data.length, avgData.length);

      for (let i = 0; i < count; i++) {
        const s1 = sem1Data[i];
        const s2 = sem2Data[i];
        const avg = avgData[i];
        const base = s1 || s2 || avg;
        if (!base) continue;

        const studentId = `STU-${year}-${classCode}-${String(base.no).padStart(3, '0')}`;
        const exists = await Student.findOne({ studentId, year });
        if (exists) { duplicates++; continue; }

        try {
          await Student.create({
            studentId,
            name: base.name || `Student ${base.no}`,
            year,
            age: base.age,
            gender: (base.sex === 'M' || base.sex === 'Male') ? 'Male' : 'Female',
            gradeLevel,
            section,
            semester1: s1 ? s1.subjects : {},
            semester2: s2 ? s2.subjects : {},
            yearlyAverage: avg ? avg.yearlyAverage : null,
            rank: avg ? avg.rank : null
          });
          imported++;
        } catch (err) {
          console.error(`Failed to import ${studentId}:`, err.message);
          failed++;
        }
      }
    }

    if (imported === 0 && duplicates === 0 && failed === 0) {
      return res.status(400).json({ message: "No valid student data found. Check your Excel file format." });
    }

    await auditLogger.logEvent({
      action: 'CREATE',
      entityType: 'Student',
      entityId: `excel_import_${year}`,
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: { after: { year, filename: req.file.originalname, imported, failed, duplicates } },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({ 
      message: "Excel file imported successfully", 
      filename: req.file.originalname, 
      year, 
      imported, 
      failed, 
      duplicates,
      note: failed > 0 ? `${failed} records failed - check server logs for details` : undefined
    });

  } catch (error) {
    console.error('Upload Excel error:', error);
    res.status(500).json({ message: "Excel upload failed", error: error.message });
  }
};

/**
 * GET /api/students
 * Retrieve students with filtering and pagination
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
    console.error('Get students error:', error);
    res.status(500).json({ message: "Failed to retrieve students", error: error.message });
  }
};

/**
 * GET /api/students/:studentId/history
 */
exports.getStudentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await Student.find({ studentId }).sort({ year: 1 });
    if (records.length === 0) return res.status(404).json({ message: "No records found for this student" });

    let trend = "stable";
    if (records.length >= 2) {
      const change = records[records.length - 1].average - records[0].average;
      if (change > 5) trend = "improving";
      else if (change < -5) trend = "declining";
    }

    res.json({
      studentId,
      name: records[0].name,
      records: records.map(r => ({ year: r.year, average: r.average, subjects: r.subjects, gradeLevel: r.gradeLevel, rank: r.rank })),
      trend
    });
  } catch (error) {
    console.error('Get student history error:', error);
    res.status(500).json({ message: "Failed to retrieve student history", error: error.message });
  }
};

/**
 * PUT /api/students/:id - Admin only
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
    console.error('Update student error:', error);
    res.status(500).json({ message: "Failed to update student", error: error.message });
  }
};

/**
 * DELETE /api/students/:id - Admin only
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
    console.error('Delete student error:', error);
    res.status(500).json({ message: "Failed to delete student", error: error.message });
  }
};
