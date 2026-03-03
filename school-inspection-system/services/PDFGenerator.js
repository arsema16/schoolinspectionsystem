const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PDFGenerator {
  /**
   * Adds header with title and filters
   * @param {PDFDocument} doc - PDFKit document
   * @param {Object} options - Report options
   */
  addHeader(doc, options) {
    doc.fontSize(20).text('School Performance Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Report Type: ${options.reportType || 'Performance Summary'}`, { align: 'left' });
    
    if (options.filters) {
      doc.fontSize(10).text('Filters Applied:', { underline: true });
      
      if (options.filters.years) {
        doc.text(`Years: ${options.filters.years.join(', ')}`);
      }
      if (options.filters.gradeLevel) {
        doc.text(`Grade Level: ${options.filters.gradeLevel}`);
      }
      if (options.filters.gender) {
        doc.text(`Gender: ${options.filters.gender}`);
      }
      if (options.filters.subjects) {
        doc.text(`Subjects: ${options.filters.subjects.join(', ')}`);
      }
    }
    
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
  }
  
  /**
   * Adds performance trend section with charts
   * @param {PDFDocument} doc - PDFKit document
   * @param {Array} trendData - Trend analysis data
   */
  addTrendSection(doc, trendData) {
    doc.fontSize(16).text('Performance Trends', { underline: true });
    doc.moveDown();
    
    if (!trendData || trendData.length === 0) {
      doc.fontSize(10).text('No trend data available');
      doc.moveDown();
      return;
    }
    
    // Add trend data as table
    doc.fontSize(10);
    trendData.forEach(trend => {
      doc.text(`Year ${trend.year}:`);
      doc.text(`  Average Mark: ${trend.averageMark?.toFixed(2) || 'N/A'}`);
      doc.text(`  Pass Rate: ${trend.passRate?.toFixed(2) || 'N/A'}%`);
      doc.moveDown(0.5);
    });
    
    doc.moveDown();
  }
  
  /**
   * Adds red flag students table
   * @param {PDFDocument} doc - PDFKit document
   * @param {Array} redFlags - Flagged students
   */
  addRedFlagSection(doc, redFlags) {
    doc.fontSize(16).text('At-Risk Students (Red Flags)', { underline: true });
    doc.moveDown();
    
    if (!redFlags || redFlags.length === 0) {
      doc.fontSize(10).text('No red-flagged students');
      doc.moveDown();
      return;
    }
    
    doc.fontSize(10);
    doc.text(`Total Students at Risk: ${redFlags.length}`);
    doc.moveDown();
    
    // Show first 50 students (to avoid huge PDFs)
    const studentsToShow = redFlags.slice(0, 50);
    
    studentsToShow.forEach((flag, index) => {
      doc.text(`${index + 1}. ${flag.name} (ID: ${flag.studentId}) - Grade ${flag.gradeLevel}`);
      doc.text(`   Overall Average: ${flag.overallAverage}%`);
      
      if (flag.failingSubjects && flag.failingSubjects.length > 0) {
        const subjects = flag.failingSubjects.map(s => `${s.subject} (${s.average}%)`).join(', ');
        doc.text(`   Failing Subjects (${flag.failingSubjectsCount}): ${subjects}`);
      }
      
      doc.moveDown(0.5);
      
      // Add page break if needed
      if (doc.y > 700) {
        doc.addPage();
      }
    });
    
    if (redFlags.length > 50) {
      doc.text(`... and ${redFlags.length - 50} more students`);
    }
    
    doc.moveDown();
  }
  
  /**
   * Adds infrastructure correlation findings
   * @param {PDFDocument} doc - PDFKit document
   * @param {Array} correlations - Correlation analysis results
   */
  addCorrelationSection(doc, correlations) {
    doc.fontSize(16).text('Infrastructure-Performance Correlations', { underline: true });
    doc.moveDown();
    
    if (!correlations || correlations.length === 0) {
      doc.fontSize(10).text('No correlation data available');
      doc.moveDown();
      return;
    }
    
    doc.fontSize(10);
    correlations.forEach((corr, index) => {
      doc.text(`${index + 1}. ${corr.facilityName}`);
      doc.text(`   Improvement Type: ${corr.improvementType}`);
      doc.text(`   Affected Students: ${corr.affectedStudents}`);
      doc.text(`   Average Improvement: ${corr.averageImprovement?.toFixed(2)} marks`);
      doc.text(`   Correlation: ${corr.correlationCoefficient?.toFixed(3)} (${corr.significance})`);
      doc.moveDown(0.5);
    });
    
    doc.moveDown();
  }
  
  /**
   * Generates comprehensive performance report
   * @param {Object} options - Report configuration
   * @returns {Object} {fileName, filePath, fileSize}
   */
  async generateReport(options) {
    const startTime = Date.now();
    
    try {
      // Fetch data based on report type
      const Student = require('../models/Student');
      const redFlagDetector = require('./RedFlagDetector');
      
      const filters = options.filters || {};
      const years = filters.years || [2015, 2016, 2017];
      
      // Fetch trends data
      const trends = [];
      for (const year of years) {
        let query = { year };
        if (filters.gradeLevel) query.gradeLevel = filters.gradeLevel;
        if (filters.gender) query.gender = filters.gender;
        
        const students = await Student.find(query).lean();
        
        if (students.length > 0) {
          const totalAvg = students.reduce((sum, s) => sum + (s.yearlyAverage || 0), 0) / students.length;
          const passCount = students.filter(s => (s.yearlyAverage || 0) >= 50).length;
          const passRate = (passCount / students.length) * 100;
          
          trends.push({
            year,
            averageMark: totalAvg,
            passRate,
            studentCount: students.length
          });
        }
      }
      
      // Fetch red flags if needed
      let redFlags = [];
      if (options.reportType === 'red_flags' || options.reportType === 'performance_summary') {
        for (const year of years) {
          const flags = await redFlagDetector.detectSignificantDrops(year, year, 50, {
            gradeLevel: filters.gradeLevel,
            gender: filters.gender,
            subject: filters.subjects ? filters.subjects[0] : null
          });
          redFlags.push(...flags);
        }
      }
      
      // Generate PDF
      const pdfBuffer = await this.createPDF({
        reportType: options.reportType,
        filters: options.filters,
        trends,
        redFlags
      });
      
      // Store PDF
      const result = await this.storePDF(pdfBuffer);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`PDF generated in ${duration.toFixed(2)}s`);
      
      return result;
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }
  
  /**
   * Creates PDF document
   * @param {Object} data - Report data
   * @returns {Promise<Buffer>} PDF buffer
   */
  async createPDF(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
        
        // Add content
        this.addHeader(doc, data);
        
        if (data.trends && data.trends.length > 0) {
          this.addTrendSection(doc, data.trends);
        }
        
        if (data.redFlags && data.redFlags.length > 0) {
          this.addRedFlagSection(doc, data.redFlags);
        }
        
        // Add footer
        doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
          align: 'center'
        });
        
        // Finalize PDF
        doc.end();
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Stores PDF and generates download token
   * @param {Buffer} pdfBuffer - Generated PDF
   * @returns {string} Download token (valid 24 hours)
   */
  async storePDF(pdfBuffer) {
    // Generate unique token
    const downloadToken = crypto.randomBytes(32).toString('hex');
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Save PDF to file system
    const fileName = `report_${downloadToken}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    fs.writeFileSync(filePath, pdfBuffer);
    
    return {
      downloadToken,
      fileName,
      filePath,
      fileSize: pdfBuffer.length
    };
  }
}

module.exports = new PDFGenerator();
