class Predictor {
  /**
   * Calculates linear regression parameters
   * @param {Array} years - Array of years [2015, 2016, 2017]
   * @param {Array} averages - Array of average marks
   * @returns {Object} {slope, intercept, r2}
   */
  calculateLinearRegression(years, averages) {
    if (!years || !averages || years.length !== averages.length || years.length < 2) {
      throw new Error('Insufficient data for regression');
    }
    
    const n = years.length;
    
    // Calculate sums
    const sumX = years.reduce((a, b) => a + b, 0);
    const sumY = averages.reduce((a, b) => a + b, 0);
    const sumXY = years.reduce((sum, x, i) => sum + x * averages[i], 0);
    const sumX2 = years.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = averages.reduce((sum, y) => sum + y * y, 0);
    
    // Calculate slope: m = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Calculate intercept: b = (Σy - m*Σx) / n
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R² (coefficient of determination)
    const meanY = sumY / n;
    const ssTotal = averages.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
    const ssResidual = years.reduce((sum, x, i) => {
      const predicted = slope * x + intercept;
      return sum + Math.pow(averages[i] - predicted, 2);
    }, 0);
    
    const r2 = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);
    
    return {
      slope,
      intercept,
      r2
    };
  }
  
  /**
   * Calculates confidence interval for prediction
   * @param {number} prediction - Predicted value
   * @param {Array} historicalData - Historical data points
   * @param {number} confidence - Confidence level (default 0.95)
   * @returns {Object} {lower, upper}
   */
  calculateConfidenceInterval(prediction, historicalData, confidence = 0.95) {
    if (!historicalData || historicalData.length < 2) {
      // Return wide interval if insufficient data
      return {
        lower: prediction - 10,
        upper: prediction + 10
      };
    }
    
    const n = historicalData.length;
    
    // Calculate standard error: √(Σ(y - ŷ)² / (n-2))
    const years = historicalData.map(d => d.year);
    const values = historicalData.map(d => d.value);
    
    const regression = this.calculateLinearRegression(years, values);
    
    let sumSquaredResiduals = 0;
    for (let i = 0; i < n; i++) {
      const predicted = regression.slope * years[i] + regression.intercept;
      sumSquaredResiduals += Math.pow(values[i] - predicted, 2);
    }
    
    const standardError = Math.sqrt(sumSquaredResiduals / (n - 2));
    
    // t-critical value for 95% confidence (approximation)
    // For small samples, use t-distribution; for simplicity, using 1.96 (z-score)
    const tCritical = confidence === 0.95 ? 1.96 : 2.576;
    
    const margin = tCritical * standardError;
    
    return {
      lower: prediction - margin,
      upper: prediction + margin
    };
  }
  
  /**
   * Predicts future marks using linear regression
   * @param {string} subject - Subject to predict
   * @param {number} targetYear - Year to predict (e.g., 2018)
   * @returns {Object} Prediction with confidence interval
   */
  async predictSubjectPerformance(subject, targetYear) {
    const Student = require('../models/Student');
    const Prediction = require('../models/Prediction');
    
    // Get historical data (2015-2017)
    const years = [2015, 2016, 2017];
    const historicalData = [];
    
    for (const year of years) {
      const students = await Student.find({ year });
      
      if (students.length === 0) {
        continue;
      }
      
      let totalMark = 0;
      let count = 0;
      
      if (subject === 'overall') {
        // Calculate overall average
        students.forEach(student => {
          if (student.average !== undefined && student.average !== null) {
            totalMark += student.average;
            count++;
          }
        });
      } else {
        // Calculate subject average
        students.forEach(student => {
          const mark = student.subjects[subject];
          if (mark !== undefined && mark !== null) {
            totalMark += mark;
            count++;
          }
        });
      }
      
      if (count > 0) {
        historicalData.push({
          year,
          value: totalMark / count
        });
      }
    }
    
    if (historicalData.length < 2) {
      throw new Error('Insufficient historical data for prediction');
    }
    
    // Calculate regression
    const yearValues = historicalData.map(d => d.year);
    const markValues = historicalData.map(d => d.value);
    const regressionParams = this.calculateLinearRegression(yearValues, markValues);
    
    // Predict target year: y = mx + b
    const predictedValue = regressionParams.slope * targetYear + regressionParams.intercept;
    
    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(
      predictedValue,
      historicalData
    );
    
    // Generate prediction ID
    const predictionId = `PRED_${targetYear}_${subject}_${Date.now()}`;
    
    // Store prediction
    const prediction = await Prediction.create({
      predictionId,
      targetYear,
      subject,
      predictedValue,
      confidenceInterval,
      modelType: 'linear_regression',
      regressionParams,
      historicalData
    });
    
    return {
      predictionId,
      subject,
      targetYear,
      predictedValue,
      confidenceInterval,
      regressionParams,
      historicalData
    };
  }
  
  /**
   * Calculates prediction error percentage
   * @param {number} predicted - Predicted value
   * @param {number} actual - Actual value
   * @returns {number} Error percentage
   */
  calculateError(predicted, actual) {
    if (!actual || actual === 0) {
      return 0;
    }
    return Math.abs((predicted - actual) / actual) * 100;
  }
  
  /**
   * Compares predictions against actual results
   * @param {number} year - Year to validate
   * @returns {Object} Accuracy metrics per subject
   */
  async validatePredictions(year) {
    const Student = require('../models/Student');
    const Prediction = require('../models/Prediction');
    
    // Get all predictions for this year
    const predictions = await Prediction.find({ targetYear: year });
    
    if (predictions.length === 0) {
      throw new Error('No predictions found for this year');
    }
    
    const validations = [];
    
    for (const prediction of predictions) {
      // Get actual data for this year and subject
      const students = await Student.find({ year });
      
      if (students.length === 0) {
        continue;
      }
      
      let totalMark = 0;
      let count = 0;
      
      if (prediction.subject === 'overall') {
        students.forEach(student => {
          if (student.average !== undefined && student.average !== null) {
            totalMark += student.average;
            count++;
          }
        });
      } else {
        students.forEach(student => {
          const mark = student.subjects[prediction.subject];
          if (mark !== undefined && mark !== null) {
            totalMark += mark;
            count++;
          }
        });
      }
      
      if (count > 0) {
        const actualValue = totalMark / count;
        const errorPercentage = this.calculateError(prediction.predictedValue, actualValue);
        
        // Update prediction record
        prediction.actualValue = actualValue;
        prediction.errorPercentage = errorPercentage;
        prediction.validatedAt = new Date();
        await prediction.save();
        
        validations.push({
          subject: prediction.subject,
          predicted: prediction.predictedValue,
          actual: actualValue,
          errorPercentage,
          accuracy: errorPercentage < 5 ? 'high' : errorPercentage < 10 ? 'medium' : 'low'
        });
      }
    }
    
    return validations;
  }
}

module.exports = new Predictor();
