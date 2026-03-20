const Student = require("../models/Student");
const dataProcessor = require("../services/DataProcessor");
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

// Export upload middleware
exports.uploadMiddleware = upload.single('file');

/**
 * POST /api/students/import
 * Bulk import student data for a specific year
 * Admin only
 */
exports.importStudents = async (req, res) => {
  try {
    const { year, students } = req.body;

    // Validate input
    if (!year || !students || !Array.isArray(students)) {
      return res.status(400).json({ 
        message: "Year and students array are required" 
      });
    }

    if (![2015, 2016, 2017, 2018].includes(year)) {
      return res.status(400).json({ 
        message: "Year must be between 2010 and 2030" 
      });
    }

    // Process bulk import using DataProcessor service
    const results = await dataProcessor.processBulkImport(students, year);

    // Log import in audit trail
    await auditLogger.logEvent({
      action: 'CREATE',
      entityType: 'Student',
      entityId: `bulk_import_${year}`,
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: {
        after: {
          year,
          imported: results.imported,
          failed: results.failed,
          duplicates: results.duplicates
        }
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(results);
  } catch (error) {
    console.error('Import students error:', error);
    res.status(500).json({ 
      message: "Import failed", 
      error: error.message 
    });
  }
};

/**
 * POST /api/students/upload
 * Upload and import Excel file with student data
 * Admin only
 */
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Parse Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    
    // Get year from request body or filename
    let year = req.body.year ? parseInt(req.body.year) : null;
    
    // Try to extract year from filename if not provided
    if (!year) {
      const match = req.file.originalname.match(/(\d{4})/);
      if (match) {
        year = parseInt(match[1]);
      }
    }
    
    if (!year || year < 2010 || year > 2030) {
      return res.status(400).json({ 
        message: "Valid year between 2010 and 2030 is required." 
      });
    }

    // Process all sheets in the workbook
    const allStudents = [];
    const sheetNames = workbook.SheetNames;
    
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      if (data.length === 0) continue;
      
      // Parse sheet name to get grade and section info
      const gradeMatch = sheetName.match(/(\d+)\s*([A-Z])?/i);
      if (!gradeMatch) continue;
      
      const gradeLevel = parseInt(gradeMatch[1]);
      const section = gradeMatch[2] || 'A';
      
      // Process each row
      data.forEach((row, index) => {
        if (!row['Student Name'] && !row['Name']) return;
        
        const studentData = {
          studentId: row['No'] || row['Student ID'] || `${year}-${gradeLevel}${section}-${index + 1}`,
          name: row['Student Name'] || row['Name'],
          gradeLevel: gradeLevel,
          section: section,
          year: year,
          age: row['Age'] || null,
          gender: row['Sex'] || row['Gender'] || null,
          subjects: []
        };
        
        // Extract subject marks
        const subjectFields = ['Amharic', 'English', 'Maths', 'Physics', 'Chemistry', 'Biology', 
                               'Geography', 'History', 'Civics', 'ICT', 'H.P.E'];
        
        subjectFields.forEach(subject => {
          if (row[subject] !== undefined && row[subject] !== null && row[subject] !== '') {
            const mark = parseFloat(row[subject]);
            if (!isNaN(mark)) {
              studentData.subjects.push({
                subject: subject.toLowerCase(),
                mark: mark
              });
            }
          }
        });
        
        if (studentData.subjects.length > 0) {
          allStudents.push(studentData);
        }
      });
    }
    
    if (allStudents.length === 0) {
      return res.status(400).json({ 
        message: "No valid student data found in Excel file" 
      });
    }

    // Import students using DataProcessor
    const results = await dataProcessor.processBulkImport(allStudents, year);

    // Log import in audit trail
    await auditLogger.logEvent({
      action: 'CREATE',
      entityType: 'Student',
      entityId: `excel_import_${year}`,
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: {
        after: {
          year,
          filename: req.file.originalname,
          imported: results.imported,
          failed: results.failed,
          duplicates: results.duplicates
        }
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: "Excel file imported successfully",
      filename: req.file.originalname,
      year: year,
      ...results
    });
    
  } catch (error) {
    console.error('Upload Excel error:', error);
    res.status(500).json({ 
      message: "Excel upload failed", 
      error: error.message 
    });
  }
};

/**
 * GET /api/students
 * Retrieve students with filtering and pagination
 * Admin and Inspector access
 */
exports.getStudents = async (req, res) => {
  try {
    const { year, gradeLevel, gender, ageGroup, page = 1, limit = 50 } = req.query;

    // Build query
    const query = {};
    
    if (year) {
      query.year = parseInt(year);
    }
    
    if (gradeLevel) {
      query.gradeLevel = parseInt(gradeLevel);
    }
    
    if (gender) {
      query.gender = gender;
    }
    
    if (ageGroup) {
      query.ageGroup = ageGroup;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const students = await Student.find(query)
      .sort({ year: -1, studentId: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Student.countDocuments(query);

    res.json({
      students,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ 
      message: "Failed to retrieve students", 
      error: error.message 
    });
  }
};

/**
 * GET /api/students/:studentId/history
 * Get student's performance across all years
 * Admin and Inspector access
 */
exports.getStudentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Query all records for this student across all years
    const records = await Student.find({ studentId })
      .sort({ year: 1 });

    if (records.length === 0) {
      return res.status(404).json({ 
        message: "No records found for this student" 
      });
    }

    // Calculate trend classification
    let trend = "stable";
    if (records.length >= 2) {
      const firstAvg = records[0].average;
      const lastAvg = records[records.length - 1].average;
      const change = lastAvg - firstAvg;
      
      if (change > 5) {
        trend = "improving";
      } else if (change < -5) {
        trend = "declining";
      }
    }

    res.json({
      studentId,
      name: records[0].name,
      records: records.map(r => ({
        year: r.year,
        average: r.average,
        subjects: r.subjects,
        gradeLevel: r.gradeLevel,
        rank: r.rank
      })),
      trend
    });
  } catch (error) {
    console.error('Get student history error:', error);
    res.status(500).json({ 
      message: "Failed to retrieve student history", 
      error: error.message 
    });
  }
};

/**
 * PUT /api/students/:id
 * Update student record
 * Admin only
 */
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find existing student
    const student = await Student.findById(id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Capture before state
    const before = student.toObject();

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        student[key] = updates[key];
      }
    });

    // Save updated student
    await student.save();

    // Log update in audit trail
    await auditLogger.logEvent({
      action: 'UPDATE',
      entityType: 'Student',
      entityId: id,
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: {
        before,
        after: student.toObject()
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ 
      message: "Failed to update student", 
      error: error.message 
    });
  }
};

/**
 * DELETE /api/students/:id
 * Delete student record
 * Admin only
 */
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Find student
    const student = await Student.findById(id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Capture before state
    const before = student.toObject();

    // Delete student
    await Student.findByIdAndDelete(id);

    // Log deletion in audit trail
    await auditLogger.logEvent({
      action: 'DELETE',
      entityType: 'Student',
      entityId: id,
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: {
        before
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ 
      message: "Failed to delete student", 
      error: error.message 
    });
  }
};
