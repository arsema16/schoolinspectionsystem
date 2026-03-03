class RedFlagDetector {
  /**
   * Detects students with failing grades (average < 50 OR any subject < 50)
   * @param {number} yearFrom - Starting year (e.g., 2015)
   * @param {number} yearTo - Ending year (e.g., 2016) - optional, if not provided uses yearFrom
   * @param {number} threshold - Threshold for failing (default 50)
   * @param {Object} filters - Optional filters: { gradeLevel, gender, subject, semester }
   * @returns {Array} Array of flagged students with failing grades
   */
  async detectSignificantDrops(yearFrom, yearTo, threshold = 50, filters = {}) {
    const Student = require('../models/Student');
    
    const startTime = Date.now();
    
    // If yearTo not provided, use yearFrom (single year check)
    const targetYear = yearTo || yearFrom;
    
    // Build query with filters
    const query = { year: targetYear };
    
    if (filters.gradeLevel) {
      query.gradeLevel = parseInt(filters.gradeLevel);
    }
    
    if (filters.gender) {
      query.gender = filters.gender;
    }
    
    // Get all students from target year with filters
    const students = await Student.find(query).lean();
    
    const flaggedStudents = [];
    
    // Determine which semester to check
    const semesterToCheck = filters.semester || 'average'; // 'average', '1', or '2'
    
    // Determine which subjects to check
    const allSubjects = ['amharic', 'english', 'maths', 'physics', 'chemistry', 'biology', 'geography', 'history', 'civics', 'ict', 'hpe'];
    const subjectsToCheck = filters.subject && filters.subject !== 'overall' 
      ? [filters.subject] 
      : allSubjects;
    
    // Check each student's performance
    for (const student of students) {
      const failingSubjects = [];
      const yearlyAvg = student.yearlyAverage || 0;
      
      // Check subjects based on filters
      for (const subject of subjectsToCheck) {
        let subjectAvg = null;
        let sem1Mark = null;
        let sem2Mark = null;
        
        // Determine which semester data to use
        if (semesterToCheck === '1') {
          // Only check semester 1
          sem1Mark = student.semester1?.[subject];
          subjectAvg = sem1Mark;
        } else if (semesterToCheck === '2') {
          // Only check semester 2
          sem2Mark = student.semester2?.[subject];
          subjectAvg = sem2Mark;
        } else {
          // Check average of both semesters
          sem1Mark = student.semester1?.[subject];
          sem2Mark = student.semester2?.[subject];
          
          if (sem1Mark != null && sem2Mark != null) {
            subjectAvg = (sem1Mark + sem2Mark) / 2;
          } else if (sem1Mark != null) {
            subjectAvg = sem1Mark;
          } else if (sem2Mark != null) {
            subjectAvg = sem2Mark;
          }
        }
        
        if (subjectAvg != null && subjectAvg < threshold) {
          failingSubjects.push({
            subject,
            average: subjectAvg.toFixed(2),
            semester1: sem1Mark,
            semester2: sem2Mark
          });
        }
      }
      
      // Flag student based on criteria
      let shouldFlag = false;
      
      if (filters.subject && filters.subject !== 'overall') {
        // If filtering by specific subject, only flag if that subject is failing
        shouldFlag = failingSubjects.length > 0;
      } else {
        // If no subject filter or "overall", flag if ANY subject fails OR overall average fails
        shouldFlag = failingSubjects.length > 0 || (yearlyAvg < threshold && yearlyAvg > 0);
      }
      
      if (shouldFlag) {
        flaggedStudents.push({
          studentId: student.studentId,
          name: student.name,
          gradeLevel: student.gradeLevel,
          gender: student.gender,
          year: targetYear,
          yearFrom: yearFrom,
          yearTo: targetYear,
          overallAverage: yearlyAvg.toFixed(2),
          overallDecline: (threshold - yearlyAvg).toFixed(2),
          failingSubjects,
          failingSubjectsCount: failingSubjects.length,
          decliningSubjects: failingSubjects, // For backward compatibility
          detectedAt: new Date()
        });
      }
    }
    
    // Sort by severity (most failing subjects first, then lowest average)
    flaggedStudents.sort((a, b) => {
      if (b.failingSubjectsCount !== a.failingSubjectsCount) {
        return b.failingSubjectsCount - a.failingSubjectsCount;
      }
      return parseFloat(a.overallAverage) - parseFloat(b.overallAverage);
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`Red flag detection: Found ${flaggedStudents.length} students with failing grades in year ${targetYear} (${duration.toFixed(2)}s)`);
    
    return flaggedStudents;
  }
  
  /**
   * Gets all red-flagged students for a specific year
   * @param {number} year - Year to check
   * @param {Object} filters - Optional filters: { gradeLevel, gender, subject, semester }
   * @returns {Array} List of failing students
   */
  async getRedFlagsForYear(year, filters = {}) {
    return await this.detectSignificantDrops(year, year, 50, filters);
  }
  
  /**
   * Gets all red-flagged students across multiple years
   * @param {Array} years - Array of years to check (default: [2015, 2016, 2017])
   * @returns {Array} Comprehensive list of at-risk students
   */
  async getAllRedFlags(years = [2015, 2016, 2017]) {
    const allFlags = [];
    
    for (const year of years) {
      const flags = await this.getRedFlagsForYear(year);
      allFlags.push(...flags);
    }
    
    return allFlags;
  }
  
  /**
   * Gets red flag statistics (optimized version)
   * @param {number} year - Year to analyze
   * @returns {Object} Statistics about failing students
   */
  async getRedFlagStats(year) {
    const Student = require('../models/Student');
    
    const totalStudents = await Student.countDocuments({ year });
    
    // Count students with overall average < 50
    const failingOverall = await Student.countDocuments({ 
      year, 
      yearlyAverage: { $lt: 50, $gt: 0 } 
    });
    
    // For now, use a simplified count (can be optimized further with aggregation)
    const failureRate = totalStudents > 0 
      ? ((failingOverall / totalStudents) * 100).toFixed(2)
      : 0;
    
    return {
      year,
      totalStudents,
      failingStudents: failingOverall,
      failingOverall,
      passingStudents: totalStudents - failingOverall,
      failureRate: parseFloat(failureRate)
    };
  }
}

module.exports = new RedFlagDetector();
