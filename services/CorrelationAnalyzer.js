class CorrelationAnalyzer {
  /**
   * Calculates Pearson correlation coefficient
   * @param {Array} x - First dataset (e.g., improvement dates)
   * @param {Array} y - Second dataset (e.g., mark changes)
   * @returns {number} Correlation coefficient (-1 to 1)
   */
  calculatePearsonCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length === 0) {
      return 0;
    }
    
    const n = x.length;
    
    // Calculate means
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    // Calculate numerator: Σ((x - x̄)(y - ȳ))
    let numerator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
    }
    
    // Calculate denominator: √(Σ(x - x̄)² * Σ(y - ȳ)²)
    let sumSquaredX = 0;
    let sumSquaredY = 0;
    for (let i = 0; i < n; i++) {
      sumSquaredX += Math.pow(x[i] - meanX, 2);
      sumSquaredY += Math.pow(y[i] - meanY, 2);
    }
    
    const denominator = Math.sqrt(sumSquaredX * sumSquaredY);
    
    if (denominator === 0) {
      return 0;
    }
    
    const correlation = numerator / denominator;
    
    // Ensure result is between -1 and 1
    return Math.max(-1, Math.min(1, correlation));
  }
  
  /**
   * Calculates statistical significance (p-value)
   * @param {number} correlation - Correlation coefficient
   * @param {number} sampleSize - Number of data points
   * @returns {number} P-value
   */
  calculateSignificance(correlation, sampleSize) {
    if (sampleSize < 3) {
      return 1; // Not enough data for significance
    }
    
    // Calculate t-statistic
    const df = sampleSize - 2; // degrees of freedom
    const t = correlation * Math.sqrt(df / (1 - correlation * correlation));
    
    // Simplified p-value calculation (approximation)
    // For more accurate results, would use a t-distribution table
    const absT = Math.abs(t);
    
    // Rough approximation for p-value
    if (absT > 2.576) return 0.01;  // p < 0.01
    if (absT > 1.96) return 0.05;   // p < 0.05
    if (absT > 1.645) return 0.10;  // p < 0.10
    return 0.20; // p > 0.10
  }
  
  /**
   * Identifies students affected by infrastructure improvement
   * @param {string} facilityId - Infrastructure facility ID
   * @param {number} year - Year of improvement
   * @returns {Array} Array of student IDs using that facility
   */
  async identifyAffectedStudents(facilityId, year) {
    const Infrastructure = require('../models/Infrastructure');
    const Student = require('../models/Student');
    
    // Get facility details
    const facility = await Infrastructure.findOne({ facilityId });
    if (!facility || !facility.affectedGrades) {
      return [];
    }
    
    // Find students in affected grades for that year
    const students = await Student.find({
      year,
      gradeLevel: { $in: facility.affectedGrades }
    });
    
    return students.map(s => s.studentId);
  }
  
  /**
   * Compares marks before and after improvement
   * @param {Array} studentIds - Students to analyze
   * @param {Date} improvementDate - Date of improvement
   * @returns {Object} Before/after comparison statistics
   */
  async compareBeforeAfter(studentIds, improvementDate) {
    const Student = require('../models/Student');
    
    const improvementYear = improvementDate.getFullYear();
    const yearBefore = improvementYear - 1;
    const yearAfter = improvementYear + 1;
    
    const markChanges = [];
    
    for (const studentId of studentIds) {
      // Get student records before and after
      const beforeRecord = await Student.findOne({ studentId, year: yearBefore });
      const afterRecord = await Student.findOne({ studentId, year: yearAfter });
      
      if (beforeRecord && afterRecord) {
        const markChange = afterRecord.average - beforeRecord.average;
        markChanges.push({
          studentId,
          beforeAverage: beforeRecord.average,
          afterAverage: afterRecord.average,
          change: markChange
        });
      }
    }
    
    if (markChanges.length === 0) {
      return {
        beforeAverage: 0,
        afterAverage: 0,
        averageImprovement: 0,
        affectedStudents: 0
      };
    }
    
    const beforeAverage = markChanges.reduce((sum, m) => sum + m.beforeAverage, 0) / markChanges.length;
    const afterAverage = markChanges.reduce((sum, m) => sum + m.afterAverage, 0) / markChanges.length;
    const averageImprovement = afterAverage - beforeAverage;
    
    return {
      beforeAverage,
      afterAverage,
      averageImprovement,
      affectedStudents: markChanges.length,
      markChanges
    };
  }
  
  /**
   * Generates correlation report for specific improvement
   * @param {string} improvementId - Infrastructure improvement ID
   * @returns {Object} Correlation analysis with statistical significance
   */
  async analyzeImprovement(improvementId) {
    const Infrastructure = require('../models/Infrastructure');
    
    // Find the facility with this improvement
    const facility = await Infrastructure.findOne({
      'improvements.improvementId': improvementId
    });
    
    if (!facility) {
      throw new Error('Improvement not found');
    }
    
    // Get the specific improvement
    const improvement = facility.improvements.find(
      imp => imp.improvementId === improvementId
    );
    
    if (!improvement) {
      throw new Error('Improvement not found');
    }
    
    // Get improvement date and year
    const improvementDate = improvement.completionDate;
    const improvementYear = improvementDate.getFullYear();
    
    // Identify affected students
    const studentIds = await this.identifyAffectedStudents(
      facility.facilityId,
      improvementYear
    );
    
    // Compare marks before and after
    const comparison = await this.compareBeforeAfter(studentIds, improvementDate);
    
    if (comparison.affectedStudents === 0) {
      return {
        improvementId,
        facilityName: facility.facilityName,
        improvementType: improvement.improvementType,
        completionDate: improvementDate,
        affectedStudents: 0,
        correlationCoefficient: 0,
        pValue: 1,
        significance: 'insufficient_data'
      };
    }
    
    // Calculate correlation
    // Use improvement timing (days since start of year) vs mark changes
    const x = comparison.markChanges.map(() => improvementYear);
    const y = comparison.markChanges.map(m => m.change);
    
    const correlationCoefficient = this.calculatePearsonCorrelation(x, y);
    const pValue = this.calculateSignificance(correlationCoefficient, comparison.affectedStudents);
    
    return {
      improvementId,
      facilityName: facility.facilityName,
      improvementType: improvement.improvementType,
      completionDate: improvementDate,
      affectedStudents: comparison.affectedStudents,
      beforeAverage: comparison.beforeAverage,
      afterAverage: comparison.afterAverage,
      averageImprovement: comparison.averageImprovement,
      correlationCoefficient,
      pValue,
      significance: pValue < 0.05 ? 'significant' : 'not_significant'
    };
  }
}

module.exports = new CorrelationAnalyzer();
