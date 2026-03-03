const Student = require("../models/Student");
const redFlagDetector = require("../services/RedFlagDetector");
const correlationAnalyzer = require("../services/CorrelationAnalyzer");
const predictor = require("../services/Predictor");
const suggestionEngine = require("../services/SuggestionEngine");

/**
 * GET /api/analysis/trends
 * Get performance trends across years
 * Admin and Inspector access
 */
exports.getTrends = async (req, res) => {
  try {
    const { years, subject, gradeLevel, gender, semester } = req.query;

    // Parse years parameter
    const yearList = years 
      ? years.split(',').map(y => parseInt(y))
      : [2015, 2016, 2017];

    const trends = [];

    for (let year of yearList) {
      let query = { year };
      
      // Apply filters
      if (gradeLevel) {
        query.gradeLevel = parseInt(gradeLevel);
      }
      
      if (gender) {
        query.gender = gender;
      }

      const students = await Student.find(query).lean(); // Use lean() for faster queries

      if (students.length === 0) {
        trends.push({
          year,
          averageMark: 0,
          passRate: 0,
          subjectAverages: {},
          studentCount: 0
        });
        continue;
      }

      // Determine which semester data to use
      let semesterData = 'yearlyAverage'; // default
      if (semester === '1') {
        semesterData = 'semester1';
      } else if (semester === '2') {
        semesterData = 'semester2';
      } else if (semester === 'average' || !semester) {
        semesterData = 'yearlyAverage';
      }

      // Calculate subject averages
      const subjectAverages = {};
      const subjects = ['amharic', 'english', 'maths', 'physics', 'chemistry', 'biology', 'geography', 'history', 'civics', 'ict', 'hpe'];
      
      if (semesterData !== 'yearlyAverage') {
        subjects.forEach(subj => {
          const validMarks = students
            .map(s => s[semesterData]?.[subj])
            .filter(mark => mark != null);
          
          if (validMarks.length > 0) {
            subjectAverages[subj] = (
              validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length
            ).toFixed(2);
          }
        });
      }

      // Calculate overall average (or specific subject if filtered)
      let averageMark;
      if (subject && subject !== 'overall' && subjects.includes(subject)) {
        // Filter by specific subject
        if (semesterData === 'yearlyAverage') {
          // For yearly average, average the subject from both semesters
          const validMarks = students
            .map(s => {
              const s1 = s.semester1?.[subject];
              const s2 = s.semester2?.[subject];
              if (s1 != null && s2 != null) return (s1 + s2) / 2;
              return s1 || s2;
            })
            .filter(mark => mark != null);
          averageMark = validMarks.length > 0
            ? (validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length).toFixed(2)
            : 0;
        } else {
          const validMarks = students
            .map(s => s[semesterData]?.[subject])
            .filter(mark => mark != null);
          averageMark = validMarks.length > 0
            ? (validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length).toFixed(2)
            : 0;
        }
      } else {
        // Overall average
        if (semesterData === 'yearlyAverage') {
          averageMark = (
            students.reduce((sum, s) => sum + (s.yearlyAverage || 0), 0) / students.length
          ).toFixed(2);
        } else {
          averageMark = (
            students.reduce((sum, s) => sum + (s[semesterData]?.average || 0), 0) / students.length
          ).toFixed(2);
        }
      }

      // Calculate pass rate (average >= 50)
      let passCount;
      if (semesterData === 'yearlyAverage') {
        passCount = students.filter(s => (s.yearlyAverage || 0) >= 50).length;
      } else {
        passCount = students.filter(s => (s[semesterData]?.average || 0) >= 50).length;
      }
      const passRate = ((passCount / students.length) * 100).toFixed(2);

      trends.push({
        year,
        averageMark: parseFloat(averageMark),
        passRate: parseFloat(passRate),
        subjectAverages,
        studentCount: students.length
      });
    }

    // Classify trend
    let classification = "stable";
    let overallChange = "0%";
    
    if (trends.length >= 2) {
      const firstAvg = trends[0].averageMark;
      const lastAvg = trends[trends.length - 1].averageMark;
      const change = lastAvg - firstAvg;
      const percentChange = ((change / firstAvg) * 100).toFixed(1);
      
      overallChange = `${change > 0 ? '+' : ''}${percentChange}%`;
      
      if (change > 2) {
        classification = "improving";
      } else if (change < -2) {
        classification = "declining";
      }
    }

    res.json({
      trends,
      classification,
      overallChange
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ 
      message: "Failed to retrieve trends", 
      error: error.message 
    });
  }
};

/**
 * GET /api/analysis/red-flags
 * Get students with failing grades (average < 50)
 * Admin and Inspector access
 */
exports.getRedFlags = async (req, res) => {
  try {
    const { yearFrom, yearTo, threshold = 50, gradeLevel, gender, subject, semester } = req.query;

    const fromYear = yearFrom ? parseInt(yearFrom) : 2015;
    const toYear = yearTo ? parseInt(yearTo) : fromYear; // Use same year if not provided
    const thresholdNum = parseFloat(threshold);

    // Build filters object
    const filters = {};
    if (gradeLevel) filters.gradeLevel = gradeLevel;
    if (gender) filters.gender = gender;
    if (subject) filters.subject = subject;
    if (semester) filters.semester = semester;

    const flaggedStudents = await redFlagDetector.detectSignificantDrops(
      fromYear, 
      toYear,
      thresholdNum,
      filters
    );

    // Get statistics
    const stats = await redFlagDetector.getRedFlagStats(toYear);

    res.json({
      flaggedStudents,
      totalFlagged: flaggedStudents.length,
      statistics: stats,
      yearFrom: fromYear,
      yearTo: toYear,
      threshold: thresholdNum,
      filters,
      detectedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get red flags error:', error);
    res.status(500).json({ 
      message: "Failed to detect red flags", 
      error: error.message 
    });
  }
};

/**
 * GET /api/analysis/correlations
 * Analyze infrastructure-performance correlations
 * Admin and Inspector access
 */
exports.getCorrelations = async (req, res) => {
  try {
    const { improvementId, facilityType } = req.query;

    if (improvementId) {
      // Analyze specific improvement
      const analysis = await correlationAnalyzer.analyzeImprovement(improvementId);
      
      return res.json({
        correlations: [analysis]
      });
    }

    if (facilityType) {
      // Analyze all improvements for a facility type
      const Infrastructure = require('../models/Infrastructure');
      
      const facilities = await Infrastructure.find({ facilityType });
      const correlations = [];

      for (let facility of facilities) {
        for (let improvement of facility.improvements) {
          try {
            const analysis = await correlationAnalyzer.analyzeImprovement(
              improvement.improvementId
            );
            correlations.push(analysis);
          } catch (err) {
            console.error(`Failed to analyze improvement ${improvement.improvementId}:`, err);
          }
        }
      }

      return res.json({ correlations });
    }

    // Return all correlations
    const Infrastructure = require('../models/Infrastructure');
    const allFacilities = await Infrastructure.find({});
    const correlations = [];

    for (let facility of allFacilities) {
      for (let improvement of facility.improvements) {
        try {
          const analysis = await correlationAnalyzer.analyzeImprovement(
            improvement.improvementId
          );
          correlations.push(analysis);
        } catch (err) {
          console.error(`Failed to analyze improvement ${improvement.improvementId}:`, err);
        }
      }
    }

    res.json({ correlations });
  } catch (error) {
    console.error('Get correlations error:', error);
    res.status(500).json({ 
      message: "Failed to analyze correlations", 
      error: error.message 
    });
  }
};

/**
 * GET /api/analysis/predictions
 * Generate performance predictions
 * Admin and Inspector access
 */
exports.getPredictions = async (req, res) => {
  try {
    const { targetYear = 2018, subject } = req.query;
    const year = parseInt(targetYear);

    if (subject) {
      // Predict specific subject
      const prediction = await predictor.predictSubjectPerformance(subject, year);
      
      return res.json({
        predictions: [prediction]
      });
    }

    // Predict all subjects
    const subjects = ['amharic', 'english', 'maths', 'physics', 'chemistry', 'biology', 'geography', 'history', 'civics', 'ict', 'hpe', 'overall'];
    const predictions = [];

    for (let subj of subjects) {
      try {
        const prediction = await predictor.predictSubjectPerformance(subj, year);
        predictions.push(prediction);
      } catch (err) {
        console.error(`Failed to predict ${subj}:`, err);
      }
    }

    res.json({ predictions });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ 
      message: "Failed to generate predictions", 
      error: error.message 
    });
  }
};

/**
 * POST /api/analysis/predictions/validate
 * Validate predictions against actual data
 * Admin only
 */
exports.validatePredictions = async (req, res) => {
  try {
    const { year, actualData } = req.body;

    if (!year) {
      return res.status(400).json({ 
        message: "Year is required" 
      });
    }

    const yearNum = parseInt(year);

    // If actualData provided, use it; otherwise fetch from database
    let validations;
    
    if (actualData) {
      // Validate using provided data
      const Prediction = require('../models/Prediction');
      const predictions = await Prediction.find({ targetYear: yearNum });
      
      validations = predictions.map(pred => {
        const actual = actualData[pred.subject];
        const error = predictor.calculateError(pred.predictedValue, actual);
        
        // Update prediction record
        pred.actualValue = actual;
        pred.errorPercentage = error;
        pred.validatedAt = new Date();
        pred.save();
        
        return {
          subject: pred.subject,
          predicted: pred.predictedValue,
          actual,
          errorPercentage: error,
          accuracy: (100 - error).toFixed(2)
        };
      });
    } else {
      // Fetch actual data from database and validate
      validations = await predictor.validatePredictions(yearNum);
    }

    res.json({ validations });
  } catch (error) {
    console.error('Validate predictions error:', error);
    res.status(500).json({ 
      message: "Failed to validate predictions", 
      error: error.message 
    });
  }
};

// Legacy endpoint for backward compatibility
exports.longitudinalAnalysis = exports.getTrends;

/**
 * GET /api/analysis/suggestions
 * Get AI-generated suggestions based on performance analysis
 * Admin and Inspector access
 */
exports.getSuggestions = async (req, res) => {
  try {
    const { years = '2015,2016,2017' } = req.query;
    const yearList = years.split(',').map(y => parseInt(y));

    // Get trends data
    const trends = [];
    for (let year of yearList) {
      const students = await Student.find({ year }).lean();
      
      if (students.length === 0) continue;

      // Calculate overall average
      const totalAvg = students.reduce((sum, s) => sum + (s.yearlyAverage || 0), 0) / students.length;
      const passCount = students.filter(s => (s.yearlyAverage || 0) >= 50).length;
      const passRate = (passCount / students.length) * 100;

      // Calculate subject averages
      const subjects = ['amharic', 'english', 'maths', 'physics', 'chemistry', 'biology', 'geography', 'history', 'civics', 'ict', 'hpe'];
      const subjectAverages = {};
      
      subjects.forEach(subject => {
        const validMarks = students
          .map(s => {
            const s1 = s.semester1?.[subject];
            const s2 = s.semester2?.[subject];
            if (s1 != null && s2 != null) return (s1 + s2) / 2;
            return s1 || s2;
          })
          .filter(mark => mark != null);
        
        if (validMarks.length > 0) {
          subjectAverages[subject] = (validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length).toFixed(2);
        }
      });

      trends.push({
        year,
        averageMark: parseFloat(totalAvg.toFixed(2)),
        passRate: parseFloat(passRate.toFixed(2)),
        studentCount: students.length,
        subjectAverages
      });
    }

    // Get red flags for analysis
    const allRedFlags = [];
    for (let year of yearList) {
      const flags = await redFlagDetector.detectSignificantDrops(year, year, 50, {});
      allRedFlags.push(...flags);
    }

    // Generate suggestions
    const suggestions = await suggestionEngine.generateSuggestions(trends, allRedFlags);

    res.json({
      suggestions,
      trendsAnalyzed: trends.length,
      redFlagsAnalyzed: allRedFlags.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ 
      message: "Failed to generate suggestions", 
      error: error.message 
    });
  }
};

/**
 * GET /api/analysis/predictions
 * Get predictions for 2018 based on historical data
 * Admin and Inspector access
 */
exports.get2018Predictions = async (req, res) => {
  try {
    const { years = '2015,2016,2017' } = req.query;
    const yearList = years.split(',').map(y => parseInt(y));

    // Get trends data
    const trends = [];
    for (let year of yearList) {
      const students = await Student.find({ year }).lean();
      
      if (students.length === 0) continue;

      // Calculate overall average
      const totalAvg = students.reduce((sum, s) => sum + (s.yearlyAverage || 0), 0) / students.length;
      const passCount = students.filter(s => (s.yearlyAverage || 0) >= 50).length;
      const passRate = (passCount / students.length) * 100;

      // Calculate subject averages
      const subjects = ['amharic', 'english', 'maths', 'physics', 'chemistry', 'biology', 'geography', 'history', 'civics', 'ict', 'hpe'];
      const subjectAverages = {};
      
      subjects.forEach(subject => {
        const validMarks = students
          .map(s => {
            const s1 = s.semester1?.[subject];
            const s2 = s.semester2?.[subject];
            if (s1 != null && s2 != null) return (s1 + s2) / 2;
            return s1 || s2;
          })
          .filter(mark => mark != null);
        
        if (validMarks.length > 0) {
          subjectAverages[subject] = (validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length).toFixed(2);
        }
      });

      trends.push({
        year,
        averageMark: parseFloat(totalAvg.toFixed(2)),
        passRate: parseFloat(passRate.toFixed(2)),
        studentCount: students.length,
        subjectAverages
      });
    }

    // Generate predictions
    const predictions = await suggestionEngine.generatePredictions(trends);

    res.json({
      predictions,
      basedOnYears: yearList,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ 
      message: "Failed to generate predictions", 
      error: error.message 
    });
  }
};

/**
 * GET /api/analysis/infrastructure
 * Get infrastructure impact analysis with recommendations
 * Admin and Inspector access
 */
exports.getInfrastructure = async (req, res) => {
  try {
    const { years = '2015,2016,2017' } = req.query;
    const yearList = years.split(',').map(y => parseInt(y));

    const Student = require('../models/Student');
    
    let overallPerformance = 0;
    let totalStudents = 0;
    
    for (const year of yearList) {
      const students = await Student.find({ year }).lean();
      if (students.length > 0) {
        overallPerformance += students.reduce((sum, s) => sum + (s.yearlyAverage || 0), 0);
        totalStudents += students.length;
      }
    }
    
    const avgPerformance = totalStudents > 0 ? overallPerformance / totalStudents : 0;
    const infrastructure = [];
    
    if (avgPerformance < 60) {
      infrastructure.push({
        facility: 'School Library',
        type: 'Learning Resource',
        impact: 'negative',
        impactScore: -8,
        description: 'Current library facilities are inadequate. Limited books and study materials available.',
        recommendation: 'Expand library collection with textbooks, reference materials, and digital resources.'
      });
    } else {
      infrastructure.push({
        facility: 'School Library',
        type: 'Learning Resource',
        impact: 'positive',
        impactScore: 5,
        description: 'Library facilities are adequate with good collection of learning materials.',
        recommendation: 'Continue maintaining library resources and consider adding more digital materials.'
      });
    }
    
    if (avgPerformance < 65) {
      infrastructure.push({
        facility: 'Science Laboratories',
        type: 'Practical Learning',
        impact: 'negative',
        impactScore: -12,
        description: 'Science labs lack modern equipment. Limited practical sessions affecting performance.',
        recommendation: 'Urgent: Upgrade lab equipment for Physics, Chemistry, and Biology.'
      });
    } else {
      infrastructure.push({
        facility: 'Science Laboratories',
        type: 'Practical Learning',
        impact: 'neutral',
        impactScore: 2,
        description: 'Science labs are functional but could benefit from equipment upgrades.',
        recommendation: 'Plan for gradual equipment modernization.'
      });
    }
    
    infrastructure.push({
      facility: 'Computer Laboratory',
      type: 'Technology',
      impact: avgPerformance > 70 ? 'positive' : 'negative',
      impactScore: avgPerformance > 70 ? 8 : -10,
      description: avgPerformance > 70 
        ? 'Computer lab is well-equipped with modern computers and internet access.'
        : 'Computer lab has outdated equipment. Limited computers available for ICT classes.',
      recommendation: avgPerformance > 70
        ? 'Maintain current equipment and consider adding programming courses.'
        : 'Priority: Upgrade computers and improve internet connectivity.'
    });
    
    if (totalStudents / yearList.length > 350) {
      infrastructure.push({
        facility: 'Classroom Capacity',
        type: 'Physical Space',
        impact: 'negative',
        impactScore: -6,
        description: 'Classrooms are overcrowded with student-to-space ratio exceeding recommended levels.',
        recommendation: 'Consider adding more classrooms or implementing shift systems.'
      });
    } else {
      infrastructure.push({
        facility: 'Classroom Capacity',
        type: 'Physical Space',
        impact: 'positive',
        impactScore: 4,
        description: 'Classroom capacity is adequate with good student-to-space ratio.',
        recommendation: 'Maintain current classroom standards.'
      });
    }
    
    infrastructure.push({
      facility: 'Sports & Recreation',
      type: 'Physical Education',
      impact: 'neutral',
      impactScore: 1,
      description: 'Basic sports facilities available including playground and sports equipment.',
      recommendation: 'Enhance sports programs to improve student physical health.'
    });
    
    if (avgPerformance < 60) {
      infrastructure.push({
        facility: 'Teacher Resource Center',
        type: 'Professional Development',
        impact: 'negative',
        impactScore: -7,
        description: 'Limited resources for teacher professional development.',
        recommendation: 'Establish teacher resource center with teaching aids and training materials.'
      });
    }

    res.json({
      infrastructure,
      totalFacilities: infrastructure.length,
      averageImpact: (infrastructure.reduce((sum, i) => sum + i.impactScore, 0) / infrastructure.length).toFixed(2),
      analyzedYears: yearList
    });
  } catch (error) {
    console.error('Get infrastructure error:', error);
    res.status(500).json({ message: 'Failed to analyze infrastructure', error: error.message });
  }
};
