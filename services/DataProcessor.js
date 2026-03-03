class DataProcessor {
  /**
   * Normalizes student name to title case
   * @param {string} name - Raw student name
   * @returns {string} Normalized name
   */
  normalizeName(name) {
    if (!name || typeof name !== 'string') {
      return '';
    }
    
    return name.trim().replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
  
  /**
   * Removes leading/trailing whitespace from all text fields
   * @param {Object} studentRecord - Raw student record
   * @returns {Object} Cleaned student record
   */
  cleanRecord(studentRecord) {
    const cleaned = { ...studentRecord };
    
    // Trim all string fields
    if (cleaned.name) cleaned.name = cleaned.name.trim();
    if (cleaned.studentId) cleaned.studentId = cleaned.studentId.trim();
    if (cleaned.gender) cleaned.gender = cleaned.gender.trim();
    
    return cleaned;
  }
  
  /**
   * Categorizes student by demographics
   * @param {Object} studentRecord - Student record
   * @returns {Object} Record with category fields added
   */
  categorizeStudent(studentRecord) {
    const categorized = { ...studentRecord };
    
    // Determine age group based on age
    if (categorized.age >= 5 && categorized.age <= 10) {
      categorized.ageGroup = 'Primary';
    } else if (categorized.age >= 11 && categorized.age <= 14) {
      categorized.ageGroup = 'Middle';
    } else if (categorized.age >= 15 && categorized.age <= 18) {
      categorized.ageGroup = 'Secondary';
    } else if (categorized.age >= 19) {
      categorized.ageGroup = 'Adult';
    }
    
    return categorized;
  }
  
  /**
   * Validates and standardizes marks to 0-100 range
   * @param {Object} subjects - Subject marks object
   * @returns {Object} Validated marks
   * @throws {ValidationError} If marks are invalid
   */
  standardizeMarks(subjects) {
    if (!subjects || typeof subjects !== 'object') {
      throw new Error('Subjects must be an object');
    }
    
    const standardized = {};
    const subjectNames = ['math', 'english', 'science', 'it'];
    
    for (const subject of subjectNames) {
      if (subjects[subject] !== undefined && subjects[subject] !== null) {
        const mark = subjects[subject];
        
        // Check if numeric
        if (typeof mark !== 'number' || isNaN(mark)) {
          throw new Error(`Mark for ${subject} must be numeric`);
        }
        
        // Check range
        if (mark < 0 || mark > 100) {
          throw new Error(`Mark for ${subject} must be between 0 and 100`);
        }
        
        // Check decimal places
        const decimalPlaces = (mark.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
          throw new Error(`Mark for ${subject} must have at most 2 decimal places`);
        }
        
        standardized[subject] = mark;
      }
    }
    
    return standardized;
  }
  
  /**
   * Detects duplicate student IDs within a year
   * @param {string} studentId - Student ID to check
   * @param {number} year - Academic year
   * @returns {boolean} True if duplicate exists
   */
  async checkDuplicate(studentId, year) {
    const Student = require('../models/Student');
    const existing = await Student.findOne({ studentId, year });
    return !!existing;
  }
  
  /**
   * Processes bulk student import
   * @param {Array} students - Array of student records
   * @param {number} year - Academic year
   * @returns {Object} Import results with success/error counts
   */
  async processBulkImport(students, year) {
    const Student = require('../models/Student');
    
    const results = {
      imported: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    };
    
    for (const studentData of students) {
      try {
        // Clean and normalize the record
        let cleaned = this.cleanRecord(studentData);
        cleaned.name = this.normalizeName(cleaned.name);
        cleaned.year = year;
        
        // Check for duplicates
        const isDuplicate = await this.checkDuplicate(cleaned.studentId, year);
        if (isDuplicate) {
          results.duplicates++;
          results.failed++;
          results.errors.push({
            studentId: cleaned.studentId,
            error: 'Duplicate student ID in this year'
          });
          continue;
        }
        
        // Validate marks
        if (cleaned.subjects) {
          cleaned.subjects = this.standardizeMarks(cleaned.subjects);
        }
        
        // Categorize student
        cleaned = this.categorizeStudent(cleaned);
        
        // Create student record
        await Student.create(cleaned);
        results.imported++;
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          studentId: studentData.studentId,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = new DataProcessor();
