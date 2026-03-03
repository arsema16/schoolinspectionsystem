class SuggestionEngine {
  /**
   * Analyzes trends and generates actionable suggestions
   * @param {Array} trends - Array of trend data from multiple years
   * @param {Array} redFlags - Array of red-flagged students
   * @returns {Object} Analysis and suggestions
   */
  async generateSuggestions(trends, redFlags) {
    const suggestions = {
      overall: [],
      subjects: [],
      grades: [],
      priority: 'medium',
      summary: ''
    };

    if (!trends || trends.length < 2) {
      return {
        ...suggestions,
        summary: 'Insufficient data for analysis. Need at least 2 years of data.'
      };
    }

    // Analyze overall performance trend
    const performanceTrend = this.analyzePerformanceTrend(trends);
    const passRateTrend = this.analyzePassRateTrend(trends);
    
    // Analyze subject performance
    const subjectAnalysis = this.analyzeSubjects(trends);
    
    // Analyze grade-level performance
    const gradeAnalysis = this.analyzeGrades(redFlags);
    
    // Determine priority level
    const latestYear = trends[trends.length - 1];
    if (latestYear.passRate < 70 || latestYear.averageMark < 50) {
      suggestions.priority = 'critical';
    } else if (latestYear.passRate < 85 || performanceTrend.direction === 'declining') {
      suggestions.priority = 'high';
    } else if (latestYear.passRate < 95) {
      suggestions.priority = 'medium';
    } else {
      suggestions.priority = 'low';
    }

    // Generate overall suggestions
    if (performanceTrend.direction === 'declining') {
      suggestions.overall.push({
        type: 'warning',
        title: 'Declining Performance Trend',
        description: `Average performance has declined by ${Math.abs(performanceTrend.change).toFixed(1)}% over the past ${trends.length} years.`,
        recommendation: 'Conduct a comprehensive review of teaching methods and curriculum. Consider implementing intervention programs.'
      });
    } else if (performanceTrend.direction === 'improving') {
      suggestions.overall.push({
        type: 'success',
        title: 'Improving Performance Trend',
        description: `Average performance has improved by ${performanceTrend.change.toFixed(1)}% over the past ${trends.length} years.`,
        recommendation: 'Continue current strategies and share best practices across all grades.'
      });
    }

    if (passRateTrend.direction === 'declining') {
      suggestions.overall.push({
        type: 'critical',
        title: 'Declining Pass Rate',
        description: `Pass rate has dropped by ${Math.abs(passRateTrend.change).toFixed(1)}% to ${latestYear.passRate}%.`,
        recommendation: 'Immediate intervention required. Identify struggling students and provide targeted support.'
      });
    }

    // Subject-specific suggestions
    if (subjectAnalysis.weakest.length > 0) {
      subjectAnalysis.weakest.forEach(subject => {
        suggestions.subjects.push({
          type: 'warning',
          subject: subject.name,
          average: subject.average,
          description: `${subject.name} shows consistently low performance (${subject.average.toFixed(1)}% average).`,
          recommendation: `Allocate additional resources for ${subject.name}. Consider teacher training, tutoring programs, or curriculum review.`
        });
      });
    }

    if (subjectAnalysis.declining.length > 0) {
      subjectAnalysis.declining.forEach(subject => {
        suggestions.subjects.push({
          type: 'warning',
          subject: subject.name,
          change: subject.change,
          description: `${subject.name} performance has declined by ${Math.abs(subject.change).toFixed(1)}%.`,
          recommendation: `Investigate causes of decline in ${subject.name}. Review teaching methods and student feedback.`
        });
      });
    }

    // Grade-level suggestions
    if (gradeAnalysis.highRisk.length > 0) {
      gradeAnalysis.highRisk.forEach(grade => {
        suggestions.grades.push({
          type: 'critical',
          grade: grade.level,
          count: grade.count,
          percentage: grade.percentage,
          description: `Grade ${grade.level} has ${grade.count} students (${grade.percentage.toFixed(1)}%) at risk of failure.`,
          recommendation: `Implement grade-wide intervention for Grade ${grade.level}. Focus on early identification and support.`
        });
      });
    }

    // Generate summary
    suggestions.summary = this.generateSummary(suggestions, latestYear, performanceTrend);

    return suggestions;
  }

  analyzePerformanceTrend(trends) {
    const first = trends[0];
    const last = trends[trends.length - 1];
    const change = last.averageMark - first.averageMark;
    
    return {
      direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
      change: change,
      percentage: ((change / first.averageMark) * 100).toFixed(2)
    };
  }

  analyzePassRateTrend(trends) {
    const first = trends[0];
    const last = trends[trends.length - 1];
    const change = last.passRate - first.passRate;
    
    return {
      direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
      change: change
    };
  }

  analyzeSubjects(trends) {
    const latestYear = trends[trends.length - 1];
    const subjectAverages = latestYear.subjectAverages || {};
    
    const subjects = Object.entries(subjectAverages).map(([name, avg]) => ({
      name,
      average: parseFloat(avg)
    }));

    // Find weakest subjects (below 60%)
    const weakest = subjects.filter(s => s.average < 60).sort((a, b) => a.average - b.average);

    // Find declining subjects (if we have multiple years)
    const declining = [];
    if (trends.length >= 2) {
      const previousYear = trends[trends.length - 2];
      const prevSubjects = previousYear.subjectAverages || {};
      
      subjects.forEach(subject => {
        const prevAvg = parseFloat(prevSubjects[subject.name] || 0);
        if (prevAvg > 0) {
          const change = subject.average - prevAvg;
          if (change < -5) {
            declining.push({
              name: subject.name,
              change: change,
              current: subject.average,
              previous: prevAvg
            });
          }
        }
      });
    }

    return { weakest, declining };
  }

  analyzeGrades(redFlags) {
    const gradeDistribution = {};
    const gradeTotals = {};

    redFlags.forEach(student => {
      const grade = student.gradeLevel;
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    // Calculate percentages (assuming typical class sizes)
    const highRisk = Object.entries(gradeDistribution)
      .map(([grade, count]) => {
        // Estimate total students per grade (rough estimate)
        const estimatedTotal = count * 5; // Assume red flags are ~20% of total
        return {
          level: parseInt(grade),
          count: count,
          percentage: (count / estimatedTotal) * 100
        };
      })
      .filter(g => g.percentage > 15) // High risk if >15% failing
      .sort((a, b) => b.percentage - a.percentage);

    return { highRisk };
  }

  generateSummary(suggestions, latestYear, performanceTrend) {
    let summary = '';

    if (suggestions.priority === 'critical') {
      summary = `⚠️ CRITICAL: Immediate action required. `;
    } else if (suggestions.priority === 'high') {
      summary = `⚡ HIGH PRIORITY: Significant concerns identified. `;
    } else if (suggestions.priority === 'medium') {
      summary = `📊 MODERATE: Some areas need attention. `;
    } else {
      summary = `✅ GOOD: Performance is generally satisfactory. `;
    }

    summary += `Current pass rate: ${latestYear.passRate}%. `;
    
    if (performanceTrend.direction === 'declining') {
      summary += `Performance is declining (${performanceTrend.change.toFixed(1)}% drop). `;
    } else if (performanceTrend.direction === 'improving') {
      summary += `Performance is improving (${performanceTrend.change.toFixed(1)}% increase). `;
    }

    summary += `${suggestions.overall.length + suggestions.subjects.length + suggestions.grades.length} recommendations generated.`;

    return summary;
  }

  /**
   * Generates predictions for next year with recommendations
   * @param {Array} trends - Historical trend data
   * @returns {Object} Predictions and recommendations
   */
  async generatePredictions(trends) {
    const predictor = require('./Predictor');
    
    const predictions = {
      year: 2018,
      overall: null,
      subjects: [],
      recommendations: []
    };

    try {
      // Predict overall performance
      const years = trends.map(t => t.year);
      const averages = trends.map(t => t.averageMark);
      
      if (years.length >= 2) {
        const regression = predictor.calculateLinearRegression(years, averages);
        const predictedValue = regression.slope * 2018 + regression.intercept;
        const confidence = predictor.calculateConfidenceInterval(
          predictedValue,
          trends.map(t => ({ year: t.year, value: t.averageMark }))
        );

        predictions.overall = {
          predicted: predictedValue.toFixed(2),
          confidence: {
            lower: confidence.lower.toFixed(2),
            upper: confidence.upper.toFixed(2)
          },
          trend: regression.slope > 0 ? 'improving' : regression.slope < 0 ? 'declining' : 'stable',
          reliability: regression.r2 > 0.8 ? 'high' : regression.r2 > 0.5 ? 'medium' : 'low'
        };

        // Generate recommendations based on prediction
        if (predictedValue < 50) {
          predictions.recommendations.push({
            type: 'critical',
            title: 'Predicted Critical Performance',
            description: `2018 performance is predicted to be ${predictedValue.toFixed(1)}%, below passing threshold.`,
            action: 'Implement emergency intervention plan immediately. Consider curriculum overhaul and intensive teacher training.'
          });
        } else if (predictedValue < 60) {
          predictions.recommendations.push({
            type: 'warning',
            title: 'Predicted Low Performance',
            description: `2018 performance is predicted to be ${predictedValue.toFixed(1)}%, indicating continued struggles.`,
            action: 'Strengthen support systems. Increase tutoring programs and student engagement initiatives.'
          });
        } else if (regression.slope < 0) {
          predictions.recommendations.push({
            type: 'warning',
            title: 'Declining Trend Predicted',
            description: `Performance is predicted to continue declining to ${predictedValue.toFixed(1)}%.`,
            action: 'Investigate root causes of decline. Implement corrective measures before trend worsens.'
          });
        } else {
          predictions.recommendations.push({
            type: 'success',
            title: 'Positive Outlook',
            description: `2018 performance is predicted to be ${predictedValue.toFixed(1)}%.`,
            action: 'Maintain current strategies and continue monitoring progress.'
          });
        }
      }

      // Predict subject performance
      const latestYear = trends[trends.length - 1];
      if (latestYear.subjectAverages) {
        const subjects = ['amharic', 'english', 'maths', 'physics', 'chemistry', 'biology', 'geography', 'history', 'civics', 'ict', 'hpe'];
        
        for (const subject of subjects) {
          const subjectData = trends
            .filter(t => t.subjectAverages && t.subjectAverages[subject])
            .map(t => ({
              year: t.year,
              value: parseFloat(t.subjectAverages[subject])
            }));

          if (subjectData.length >= 2) {
            const subjectYears = subjectData.map(d => d.year);
            const subjectValues = subjectData.map(d => d.value);
            const regression = predictor.calculateLinearRegression(subjectYears, subjectValues);
            const predicted = regression.slope * 2018 + regression.intercept;

            predictions.subjects.push({
              name: subject,
              predicted: predicted.toFixed(2),
              trend: regression.slope > 0 ? 'improving' : regression.slope < 0 ? 'declining' : 'stable',
              change: (regression.slope * (2018 - subjectYears[subjectYears.length - 1])).toFixed(2)
            });
          }
        }
      }

    } catch (error) {
      console.error('Prediction error:', error);
      predictions.error = error.message;
    }

    return predictions;
  }
}

module.exports = new SuggestionEngine();