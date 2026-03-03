# Implementation Plan: Longitudinal Inspection System

## Overview

This implementation plan breaks down the Longitudinal Inspection System into discrete, actionable coding tasks. The system extends an existing Node.js/Express/MongoDB application with comprehensive educational analytics capabilities including data processing, red flag detection, infrastructure correlation analysis, predictive modeling, and PDF report generation.

The implementation follows an incremental approach: database schema updates → service layer implementation → API endpoints → frontend enhancements → testing → documentation. Each task builds on previous work and includes specific requirements references for traceability.

## Tasks

- [x] 1. Database schema updates and model enhancements
  - [x] 1.1 Enhance Student model with red flag tracking and demographics
    - Add redFlags array field with year, comparedToYear, subjects, overallDecline, detectedAt
    - Add ageGroup field (enum: Primary, Middle, Secondary, Adult)
    - Add pre-save middleware to calculate average and age group automatically
    - Add compound index on studentId and year for efficient queries
    - Update validation rules for marks (0-100, max 2 decimals)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4, 3.2, 16.1, 16.2, 16.3, 16.4_

  - [ ]* 1.2 Write property tests for Student model
    - **Property 2: Student-Year Association Invariant** - Validates: Requirements 1.3, 1.1
    - **Property 4: Name Normalization** - Validates: Requirements 2.1
    - **Property 7: Mark Range Validation** - Validates: Requirements 2.4, 16.1, 16.2, 16.3
    - **Property 8: Mark Decimal Precision** - Validates: Requirements 16.4
    - **Property 9: Automatic Categorization** - Validates: Requirements 3.2

  - [x] 1.3 Create Infrastructure model with condition tracking and improvements
    - Create infrastructureSchema with facilityId, facilityType, facilityName
    - Add conditionHistory array with year, rating, assessmentDate, notes, assessedBy
    - Add improvements array with improvementId, description, improvementType, completionDate, cost, beforeRating, afterRating
    - Add affectedGrades array and capacity fields
    - Add validation for rating (1-5), facilityType enum, future date prevention
    - Add indexes for facilityType and improvements.completionDate
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 18.1, 18.2, 18.4_

  - [ ]* 1.4 Write property tests for Infrastructure model
    - **Property 21: Facility Type Validation** - Validates: Requirements 7.1, 18.2
    - **Property 22: Infrastructure Record Completeness** - Validates: Requirements 7.2
    - **Property 25: Improvement Record Completeness** - Validates: Requirements 8.1
    - **Property 28: Improvement Type Categorization** - Validates: Requirements 8.4
    - **Property 55: Condition Rating Validation** - Validates: Requirements 18.1
    - **Property 57: Future Date Rejection** - Validates: Requirements 18.4

  - [x] 1.5 Enhance User model with session management and login tracking
    - Add activeSessions array with token, createdAt, expiresAt, ipAddress
    - Add lastLogin date field
    - Add failedLoginAttempts array with timestamp and ipAddress
    - Add isActive boolean field
    - Add toJSON method to remove password and activeSessions from output
    - _Requirements: 10.1, 10.5, 11.1, 11.3, 11.4_


  - [x] 1.6 Create AuditLog model for tracking data modifications
    - Create auditLogSchema with action, entityType, entityId, userId, username, userRole
    - Add changes field with before/after values (Mixed type)
    - Add ipAddress, userAgent, timestamp fields
    - Add compound indexes for userId+timestamp, entityType+entityId, action+timestamp
    - Add TTL index to auto-delete logs older than 3 years (94608000 seconds)
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [ ]* 1.7 Write property tests for AuditLog model
    - **Property 58: Audit Logging for Modifications** - Validates: Requirements 20.1, 20.2
    - **Property 59: Audit Log Retention** - Validates: Requirements 20.3
    - **Property 60: Audit Log Filtering** - Validates: Requirements 20.4

  - [x] 1.8 Create Prediction model for storing forecasts and validation
    - Create predictionSchema with predictionId, targetYear, subject, predictedValue
    - Add confidenceInterval object with lower and upper bounds
    - Add modelType, regressionParams (slope, intercept, r2)
    - Add historicalData array with year and value
    - Add actualValue, errorPercentage, validatedAt for accuracy tracking
    - Add indexes for targetYear and subject
    - _Requirements: 14.1, 14.2, 14.3, 15.1, 15.2, 15.3_

  - [x] 1.9 Create Report model for PDF generation tracking
    - Create reportSchema with reportId, downloadToken, reportType, filters
    - Add fileName, fileSize, filePath fields
    - Add generatedBy, generatedAt, expiresAt, downloadCount, status
    - Add TTL index to auto-delete expired reports
    - _Requirements: 12.1, 12.5, 13.1, 13.2_

- [x] 2. Implement Data Processor service
  - [x] 2.1 Create DataProcessor class with normalization methods
    - Implement normalizeName() using regex for title case conversion
    - Implement cleanRecord() to trim whitespace from all text fields
    - Implement categorizeStudent() to assign age groups based on age
    - Implement standardizeMarks() to validate marks (0-100, numeric, max 2 decimals)
    - _Requirements: 2.1, 2.2, 2.4, 3.2_

  - [ ]* 2.2 Write property tests for DataProcessor
    - **Property 4: Name Normalization** - Validates: Requirements 2.1
    - **Property 5: Whitespace Trimming** - Validates: Requirements 2.2
    - **Property 7: Mark Range Validation** - Validates: Requirements 2.4, 16.1, 16.2, 16.3
    - **Property 8: Mark Decimal Precision** - Validates: Requirements 16.4
    - **Property 9: Automatic Categorization** - Validates: Requirements 3.2

  - [x] 2.3 Implement duplicate detection and bulk import
    - Implement checkDuplicate() to query for existing studentId+year combinations
    - Implement processBulkImport() to process array of students with error handling
    - Return import results with success count, failure count, duplicate count, and error details
    - Handle partial import success (continue processing even if some records fail)
    - _Requirements: 2.3, 17.1_

  - [ ]* 2.4 Write property tests for duplicate detection
    - **Property 6: Duplicate Detection Within Year** - Validates: Requirements 2.3, 17.1

- [x] 3. Implement Red Flag Detector service
  - [x] 3.1 Create RedFlagDetector class with drop detection logic
    - Implement calculatePercentageChange() to compute mark change percentage
    - Implement identifyDecliningSubjects() to find subjects with ≥15% drop
    - Implement detectSignificantDrops() to match students across years and flag drops
    - Sort flagged students by severity (largest decline first)
    - Ensure completion within 5 seconds for 1000+ students
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 3.2 Write property tests for RedFlagDetector
    - **Property 17: Significant Drop Detection** - Validates: Requirements 6.1, 6.2
    - **Property 18: Red Flag Subject Recording** - Validates: Requirements 6.3
    - **Property 19: Complete Red Flag Reporting** - Validates: Requirements 6.4

  - [x] 3.3 Implement getAllRedFlags() for comprehensive reporting
    - Query all year transitions (2015→2016, 2016→2017)
    - Aggregate all flagged students with their decline details
    - Return comprehensive list with year transitions and subjects
    - _Requirements: 6.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 5. Implement Correlation Analyzer service
  - [x] 5.1 Create CorrelationAnalyzer class with Pearson correlation calculation
    - Implement calculatePearsonCorrelation() using formula: r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² * Σ(y - ȳ)²)
    - Implement calculateSignificance() to compute p-value
    - Ensure correlation coefficient is between -1 and 1
    - _Requirements: 9.3, 9.4_

  - [ ]* 5.2 Write property tests for correlation calculations
    - **Property 31: Correlation Coefficient Calculation** - Validates: Requirements 9.3
    - **Property 32: Statistical Significance Reporting** - Validates: Requirements 9.4

  - [x] 5.3 Implement student identification and before-after comparison
    - Implement identifyAffectedStudents() to find students by grade level matching facility
    - Implement compareBeforeAfter() to get marks 1 year before and after improvement
    - Calculate mark changes for each affected student
    - _Requirements: 9.1, 9.2_

  - [ ]* 5.4 Write property tests for affected student identification
    - **Property 29: Affected Student Identification** - Validates: Requirements 9.1
    - **Property 30: Before-After Mark Comparison** - Validates: Requirements 9.2

  - [x] 5.5 Implement analyzeImprovement() for complete correlation analysis
    - Get improvement date and facility details
    - Identify affected students using grade level
    - Compare marks before and after improvement
    - Calculate correlation coefficient and p-value
    - Return correlation analysis with statistical significance (p < 0.05 = significant)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6. Implement Predictor service
  - [x] 6.1 Create Predictor class with linear regression implementation
    - Implement calculateLinearRegression() using formulas:
      - Slope: m = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
      - Intercept: b = (Σy - m*Σx) / n
      - R²: 1 - (SS_res / SS_tot)
    - Return slope, intercept, and r2 values
    - _Requirements: 14.1, 14.2_

  - [ ]* 6.2 Write property tests for linear regression
    - **Property 47: Linear Regression Prediction** - Validates: Requirements 14.1, 14.2

  - [x] 6.3 Implement confidence interval calculation
    - Implement calculateConfidenceInterval() for 95% confidence level
    - Calculate standard error: √(Σ(y - ŷ)² / (n-2))
    - Calculate CI: prediction ± (t_critical * standard_error)
    - Return lower and upper bounds
    - _Requirements: 14.3_

  - [ ]* 6.4 Write property tests for confidence intervals
    - **Property 48: Confidence Interval Inclusion** - Validates: Requirements 14.3

  - [x] 6.5 Implement predictSubjectPerformance() for forecasting
    - Get historical averages for 2015-2017 for specified subject
    - Calculate linear regression parameters
    - Predict target year value using y = mx + b
    - Calculate confidence interval
    - Store prediction in Prediction model
    - Return prediction with confidence interval and historical data
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 6.6 Implement prediction validation and accuracy tracking
    - Implement calculateError() as: |predicted - actual| / actual * 100
    - Implement validatePredictions() to compare predictions against actual data
    - Update Prediction records with actualValue and errorPercentage
    - Return accuracy metrics per subject
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ]* 6.7 Write property tests for prediction validation
    - **Property 50: Prediction Error Calculation** - Validates: Requirements 15.1, 15.2
    - **Property 51: Prediction Accuracy Storage** - Validates: Requirements 15.3

- [x] 7. Implement PDF Generator service
  - [x] 7.1 Create PDFGenerator class with PDFKit integration
    - Install pdfkit dependency
    - Implement addHeader() to add title and filter information
    - Implement addTrendSection() to add performance trends with charts
    - Implement addRedFlagSection() to add flagged students table
    - Implement addCorrelationSection() to add infrastructure correlation findings
    - _Requirements: 12.1, 12.2, 12.4, 13.4_

  - [x] 7.2 Implement generateReport() with filtering and token generation
    - Accept options with years, filters (grade, gender, subject)
    - Fetch filtered data from database
    - Generate PDF with all sections
    - Store PDF buffer temporarily
    - Generate download token with 24-hour expiration
    - Create Report record in database
    - Ensure completion within 10 seconds for 1000 students
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 13.1, 13.2, 13.3_

  - [ ]* 7.3 Write property tests for PDF generation
    - **Property 41: Report Content Completeness** - Validates: Requirements 12.1, 12.2
    - **Property 43: Correlation in Reports** - Validates: Requirements 12.4
    - **Property 45: Report Filtering** - Validates: Requirements 13.1, 13.2, 13.3
    - **Property 46: Filter Display in Report** - Validates: Requirements 13.4

  - [x] 7.4 Implement storePDF() for file management
    - Store PDF buffer to file system or cloud storage
    - Generate unique download token
    - Set expiration to 24 hours from generation
    - Return download token
    - _Requirements: 12.5_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 9. Implement Audit Logger service
  - [x] 9.1 Create AuditLogger class with event logging
    - Implement logEvent() to create AuditLog records
    - Accept action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED)
    - Accept entityType, entityId, userId, changes (before/after)
    - Capture ipAddress and userAgent from request
    - _Requirements: 20.1, 20.2_

  - [ ]* 9.2 Write property tests for audit logging
    - **Property 58: Audit Logging for Modifications** - Validates: Requirements 20.1, 20.2

  - [x] 9.3 Implement getLogs() with filtering
    - Accept filters: startDate, endDate, userId, action, entityType
    - Query AuditLog with filters
    - Support pagination
    - Return matching audit log entries
    - _Requirements: 20.4_

  - [ ]* 9.4 Write property tests for audit log filtering
    - **Property 60: Audit Log Filtering** - Validates: Requirements 20.4

  - [x] 9.5 Create audit middleware for automatic logging
    - Implement createMiddleware() to return Express middleware
    - Capture request body as "before" state for updates
    - Capture response as "after" state
    - Automatically log CREATE, UPDATE, DELETE operations
    - _Requirements: 20.1, 20.2_

- [x] 10. Implement authentication and authorization enhancements
  - [x] 10.1 Update authController with session management
    - Update login() to create JWT token with 8-hour expiration
    - Store token in User.activeSessions array
    - Invalidate previous sessions (single session enforcement)
    - Log successful login
    - Clear failed login attempts on success
    - _Requirements: 10.1, 11.1, 11.4_

  - [ ]* 10.2 Write property tests for authentication
    - **Property 33: Credential Verification** - Validates: Requirements 10.1
    - **Property 37: Session Token Creation** - Validates: Requirements 11.1
    - **Property 40: Single Session Enforcement** - Validates: Requirements 11.4

  - [x] 10.3 Implement logout with token invalidation
    - Update logout() to remove token from User.activeSessions
    - Log logout event in audit trail
    - Return success message
    - _Requirements: 11.3_

  - [ ]* 10.4 Write property tests for logout
    - **Property 39: Logout Token Invalidation** - Validates: Requirements 11.3

  - [x] 10.5 Update authMiddleware to check token expiration and active sessions
    - Verify JWT token is valid and not expired
    - Check token exists in User.activeSessions
    - Return 401 Unauthorized for expired or invalid tokens
    - Attach user information to request object
    - _Requirements: 11.2_

  - [ ]* 10.6 Write property tests for token expiration
    - **Property 38: Expired Token Rejection** - Validates: Requirements 11.2

  - [x] 10.7 Implement failed login tracking
    - Update login() to log failed attempts with timestamp and IP
    - Store in User.failedLoginAttempts array
    - Create audit log entry for failed logins
    - _Requirements: 10.5_

  - [ ]* 10.8 Write property tests for failed login logging
    - **Property 36: Failed Login Logging** - Validates: Requirements 10.5

  - [x] 10.9 Create role-based access control middleware
    - Create requireAdmin() middleware to check user.role === 'Admin'
    - Create requireAuth() middleware for any authenticated user
    - Return 403 Forbidden for insufficient permissions
    - _Requirements: 10.2, 10.3, 10.4_

  - [ ]* 10.10 Write property tests for RBAC
    - **Property 34: Admin Full Access** - Validates: Requirements 10.2
    - **Property 35: Inspector Read-Only Access** - Validates: Requirements 10.3, 10.4

- [x] 11. Implement student data API endpoints
  - [x] 11.1 Create POST /api/students/import endpoint
    - Accept year and students array in request body
    - Use DataProcessor.processBulkImport() to process students
    - Normalize names, trim whitespace, validate marks
    - Check for duplicates within year
    - Calculate averages and age groups
    - Log import in audit trail
    - Return import results with success/failure counts
    - Restrict to Admin role only
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.2, 16.1, 16.2, 16.3, 16.4, 17.1_

  - [ ]* 11.2 Write property tests for student import
    - **Property 1: Year Dataset Isolation** - Validates: Requirements 1.2
    - **Property 3: Cross-Year Referential Integrity** - Validates: Requirements 1.4
    - **Property 6: Duplicate Detection Within Year** - Validates: Requirements 2.3, 17.1

  - [x] 11.3 Create GET /api/students endpoint with filtering
    - Accept query parameters: year, gradeLevel, gender, ageGroup, page, limit
    - Query Student model with filters
    - Support pagination (default: page 1, limit 50)
    - Return students array, total count, page info
    - Allow both Admin and Inspector access
    - _Requirements: 3.4_

  - [ ]* 11.4 Write property tests for student filtering
    - **Property 10: Category-Based Filtering** - Validates: Requirements 3.4

  - [x] 11.5 Create GET /api/students/:studentId/history endpoint
    - Query all Student records matching studentId across all years
    - Sort by year in chronological order
    - Calculate trend classification (improving, declining, stable)
    - Return student history with trend analysis
    - Allow both Admin and Inspector access
    - _Requirements: 1.4, 4.3, 4.4_

  - [ ]* 11.6 Write property tests for student history
    - **Property 3: Cross-Year Referential Integrity** - Validates: Requirements 1.4
    - **Property 13: Chronological Ordering** - Validates: Requirements 4.4


  - [x] 11.7 Create PUT /api/students/:id endpoint
    - Accept partial student object in request body
    - Validate updated fields
    - Capture before state for audit logging
    - Update student record
    - Log update in audit trail with before/after values
    - Restrict to Admin role only
    - _Requirements: 20.1_

  - [x] 11.8 Create DELETE /api/students/:id endpoint
    - Find student by ID
    - Log deletion in audit trail
    - Delete student record
    - Return success message
    - Restrict to Admin role only
    - _Requirements: 20.1_

- [x] 12. Implement analysis API endpoints
  - [x] 12.1 Create GET /api/analysis/trends endpoint
    - Accept query parameters: years (comma-separated), subject, groupBy
    - Calculate average marks per subject for each year
    - Calculate overall average marks for each year
    - Calculate pass rates (students with average ≥ 50)
    - Classify trends as improving, declining, or stable
    - Return trends array with year, averageMark, passRate, subjectAverages
    - Ensure response within 2 seconds
    - Allow both Admin and Inspector access
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.3, 5.4_

  - [ ]* 12.2 Write property tests for trend analysis
    - **Property 11: Average Calculation Correctness** - Validates: Requirements 4.1, 4.2
    - **Property 12: Trend Classification Accuracy** - Validates: Requirements 4.3
    - **Property 14: Pass Rate Calculation** - Validates: Requirements 5.1
    - **Property 15: Year-Specific Data Retrieval** - Validates: Requirements 5.3

  - [x] 12.3 Create GET /api/analysis/red-flags endpoint
    - Accept query parameters: yearFrom, yearTo, threshold (default 15)
    - Use RedFlagDetector.detectSignificantDrops() to find at-risk students
    - Return flaggedStudents array with decline details
    - Ensure completion within 5 seconds for 1000+ students
    - Allow both Admin and Inspector access
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 12.4 Write property tests for red flag detection
    - **Property 17: Significant Drop Detection** - Validates: Requirements 6.1, 6.2
    - **Property 18: Red Flag Subject Recording** - Validates: Requirements 6.3
    - **Property 19: Complete Red Flag Reporting** - Validates: Requirements 6.4
    - **Property 20: Red Flag Detection Performance** - Validates: Requirements 6.5

  - [x] 12.5 Create GET /api/analysis/correlations endpoint
    - Accept query parameters: improvementId, facilityType
    - Use CorrelationAnalyzer.analyzeImprovement() for specific improvement
    - Return correlations array with coefficient, p-value, significance
    - Include affectedStudents count, beforeAverage, afterAverage, averageImprovement
    - Allow both Admin and Inspector access
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 12.6 Write property tests for correlation analysis
    - **Property 29: Affected Student Identification** - Validates: Requirements 9.1
    - **Property 30: Before-After Mark Comparison** - Validates: Requirements 9.2
    - **Property 31: Correlation Coefficient Calculation** - Validates: Requirements 9.3
    - **Property 32: Statistical Significance Reporting** - Validates: Requirements 9.4

  - [x] 12.7 Create GET /api/analysis/predictions endpoint
    - Accept query parameters: targetYear (default 2018), subject
    - Use Predictor.predictSubjectPerformance() to generate forecasts
    - Return predictions array with predictedValue, confidenceInterval, modelParams, historicalData
    - Allow both Admin and Inspector access
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 12.8 Write property tests for predictions
    - **Property 47: Linear Regression Prediction** - Validates: Requirements 14.1, 14.2
    - **Property 48: Confidence Interval Inclusion** - Validates: Requirements 14.3
    - **Property 49: Prediction vs Historical Data** - Validates: Requirements 14.4

  - [x] 12.9 Create POST /api/analysis/predictions/validate endpoint
    - Accept year and actualData in request body
    - Use Predictor.validatePredictions() to compare against predictions
    - Update Prediction records with actualValue and errorPercentage
    - Return validations array with predicted, actual, errorPercentage, accuracy
    - Restrict to Admin role only
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ]* 12.10 Write property tests for prediction validation
    - **Property 50: Prediction Error Calculation** - Validates: Requirements 15.1, 15.2
    - **Property 51: Prediction Accuracy Storage** - Validates: Requirements 15.3
    - **Property 52: Accuracy Display** - Validates: Requirements 15.4

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 14. Implement infrastructure API endpoints
  - [x] 14.1 Create POST /api/infrastructure endpoint
    - Accept facilityId, facilityType, facilityName, affectedGrades, capacity in request body
    - Validate facilityType is one of {classroom, laboratory, library}
    - Create Infrastructure record
    - Log creation in audit trail
    - Return created facility object
    - Allow both Admin and Inspector access
    - _Requirements: 7.1, 18.2, 20.2_

  - [ ]* 14.2 Write property tests for infrastructure creation
    - **Property 21: Facility Type Validation** - Validates: Requirements 7.1, 18.2
    - **Property 22: Infrastructure Record Completeness** - Validates: Requirements 7.2

  - [x] 14.3 Create POST /api/infrastructure/:facilityId/assessment endpoint
    - Accept year, rating, assessmentDate, notes in request body
    - Validate rating is between 1 and 5
    - Validate assessmentDate is not in future
    - Add assessment to facility's conditionHistory array
    - Log assessment in audit trail
    - Return updated facility
    - Allow both Admin and Inspector access
    - _Requirements: 7.2, 7.3, 7.4, 18.1, 18.4, 20.2_

  - [ ]* 14.4 Write property tests for infrastructure assessment
    - **Property 23: Multiple Assessments Per Facility** - Validates: Requirements 7.3
    - **Property 24: Infrastructure-Year Association** - Validates: Requirements 7.4
    - **Property 55: Condition Rating Validation** - Validates: Requirements 18.1
    - **Property 57: Future Date Rejection** - Validates: Requirements 18.4

  - [x] 14.5 Create POST /api/infrastructure/:facilityId/improvement endpoint
    - Accept improvementId, description, improvementType, completionDate, cost, beforeRating, afterRating
    - Validate improvementType is one of {renovation, equipment_upgrade, new_construction, maintenance}
    - Validate completionDate is not in future
    - Add improvement to facility's improvements array
    - Log improvement in audit trail
    - Trigger correlation analysis asynchronously
    - Return updated facility
    - Restrict to Admin role only
    - _Requirements: 8.1, 8.2, 8.4, 18.4, 20.2_

  - [ ]* 14.6 Write property tests for infrastructure improvement
    - **Property 25: Improvement Record Completeness** - Validates: Requirements 8.1
    - **Property 26: Improvement-Facility Linkage** - Validates: Requirements 8.2
    - **Property 28: Improvement Type Categorization** - Validates: Requirements 8.4
    - **Property 57: Future Date Rejection** - Validates: Requirements 18.4

  - [x] 14.7 Create GET /api/infrastructure endpoint with filtering
    - Accept query parameters: facilityType, year, minRating
    - Query Infrastructure model with filters
    - Return array of facility objects with condition history
    - Allow both Admin and Inspector access
    - _Requirements: 7.1, 7.3_

  - [x] 14.8 Create GET /api/infrastructure/:facilityId/history endpoint
    - Query facility by facilityId
    - Return complete history with conditionHistory and improvements
    - Sort improvements chronologically
    - Calculate currentRating and totalInvestment
    - Allow both Admin and Inspector access
    - _Requirements: 7.3, 8.3_

  - [ ]* 14.9 Write property tests for improvement history
    - **Property 27: Chronological Improvement History** - Validates: Requirements 8.3

  - [x] 14.10 Create PUT /api/infrastructure/:facilityId endpoint
    - Accept partial facility object in request body
    - Validate updated fields
    - Capture before state for audit logging
    - Update facility record
    - Log update in audit trail
    - Restrict to Admin role only
    - _Requirements: 20.2_

  - [x] 14.11 Create DELETE /api/infrastructure/:facilityId endpoint
    - Find facility by facilityId
    - Log deletion in audit trail
    - Delete facility record
    - Return success message
    - Restrict to Admin role only
    - _Requirements: 20.2_

- [x] 15. Implement report API endpoints
  - [x] 15.1 Create POST /api/reports/generate endpoint
    - Accept reportType and filters (years, gradeLevel, gender, subjects) in request body
    - Validate filters
    - Create Report record with status 'generating'
    - Use PDFGenerator.generateReport() to create PDF
    - Store PDF and generate download token with 24-hour expiration
    - Update Report record with status 'ready' and download token
    - Ensure completion within 10 seconds for 1000 students
    - Return reportId, downloadToken, status, estimatedTime
    - Allow both Admin and Inspector access
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 15.2 Write property tests for report generation
    - **Property 41: Report Content Completeness** - Validates: Requirements 12.1, 12.2
    - **Property 42: Report Generation Performance** - Validates: Requirements 12.3
    - **Property 43: Correlation in Reports** - Validates: Requirements 12.4
    - **Property 45: Report Filtering** - Validates: Requirements 13.1, 13.2, 13.3
    - **Property 46: Filter Display in Report** - Validates: Requirements 13.4

  - [x] 15.3 Create GET /api/reports/:reportId/status endpoint
    - Query Report by reportId
    - Return status, downloadUrl, expiresAt, fileSize
    - Allow both Admin and Inspector access
    - _Requirements: 12.5_

  - [x] 15.4 Create GET /api/reports/download/:token endpoint
    - Query Report by downloadToken
    - Validate token is not expired
    - Increment downloadCount
    - Stream PDF file with appropriate headers
    - Return 404 or 410 Gone for expired tokens
    - Public access with valid token
    - _Requirements: 12.5_

  - [ ]* 15.5 Write property tests for download link expiration
    - **Property 44: Download Link Expiration** - Validates: Requirements 12.5

  - [x] 15.6 Create GET /api/reports/history endpoint
    - Accept query parameters: page, limit
    - Query Report records for current user
    - Support pagination
    - Return reports array with reportId, reportType, generatedAt, status, downloadCount
    - Allow both Admin and Inspector access
    - _Requirements: 12.1_


- [x] 16. Implement audit API endpoints
  - [x] 16.1 Create GET /api/audit/logs endpoint with filtering
    - Accept query parameters: startDate, endDate, userId, action, entityType, page, limit
    - Query AuditLog with filters
    - Support pagination
    - Return logs array with action, entityType, entityId, userId, username, userRole, changes, timestamp, ipAddress
    - Restrict to Admin role only
    - _Requirements: 20.4_

  - [ ]* 16.2 Write property tests for audit log filtering
    - **Property 60: Audit Log Filtering** - Validates: Requirements 20.4

  - [x] 16.3 Create GET /api/audit/logs/export endpoint
    - Accept same query parameters as GET /api/audit/logs
    - Query AuditLog with filters
    - Convert results to CSV format
    - Stream CSV file with appropriate headers
    - Restrict to Admin role only
    - _Requirements: 20.4_

- [ ] 17. Implement validation middleware and error handling
  - [ ] 17.1 Create validation middleware for student records
    - Validate required fields: name, studentId, year, gradeLevel
    - Validate marks are numeric, 0-100, max 2 decimals
    - Validate age is between 5 and 25
    - Return 400 Bad Request with specific error details for validation failures
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 17.2, 17.3, 17.4_

  - [ ]* 17.2 Write property tests for validation
    - **Property 7: Mark Range Validation** - Validates: Requirements 2.4, 16.1, 16.2, 16.3
    - **Property 8: Mark Decimal Precision** - Validates: Requirements 16.4
    - **Property 53: Required Fields Validation** - Validates: Requirements 17.2, 17.3
    - **Property 54: Age Range Validation** - Validates: Requirements 17.4

  - [ ] 17.2 Create validation middleware for infrastructure records
    - Validate facilityType is one of {classroom, laboratory, library}
    - Validate condition rating is between 1 and 5
    - Validate completionDate is not in future
    - Return 400 Bad Request with specific error details for validation failures
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ]* 17.3 Write property tests for infrastructure validation
    - **Property 21: Facility Type Validation** - Validates: Requirements 7.1, 18.2
    - **Property 55: Condition Rating Validation** - Validates: Requirements 18.1
    - **Property 56: Validation Error Reporting** - Validates: Requirements 18.3
    - **Property 57: Future Date Rejection** - Validates: Requirements 18.4

  - [ ] 17.4 Create global error handler middleware
    - Handle ValidationError (400 Bad Request)
    - Handle AuthenticationError (401 Unauthorized)
    - Handle AuthorizationError (403 Forbidden)
    - Handle NotFoundError (404 Not Found)
    - Handle ConflictError (409 Conflict)
    - Handle TimeoutError (408 Request Timeout)
    - Handle generic errors (500 Internal Server Error)
    - Log all errors with auditLogger
    - Return consistent error response format
    - _Requirements: All error handling requirements_

- [x] 18. Frontend dashboard enhancements
  - [x] 18.1 Update dashboard HTML to include new visualization sections
    - Add section for performance trends with year selector
    - Add section for red-flagged students table
    - Add section for infrastructure correlation charts
    - Add section for predictions display
    - Add filters for grade level, gender, subject
    - _Requirements: 3.4, 4.4, 5.1, 5.2, 5.3, 6.4, 9.4, 14.4_

  - [x] 18.2 Implement JavaScript for trend visualization
    - Fetch data from GET /api/analysis/trends
    - Render bar charts for pass/fail rates per year
    - Render line graphs for performance trends
    - Render pie charts for demographic breakdowns
    - Update visualizations within 2 seconds of user interaction
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 18.3 Implement JavaScript for red flag display
    - Fetch data from GET /api/analysis/red-flags
    - Render table with flagged students, decline percentages, subjects
    - Sort by severity (largest decline first)
    - Add filtering by year transition
    - _Requirements: 6.4_

  - [x] 18.4 Implement JavaScript for correlation display
    - Fetch data from GET /api/analysis/correlations
    - Render correlation results with statistical significance indicators
    - Display before/after averages and improvement percentages
    - _Requirements: 9.4_

  - [x] 18.5 Implement JavaScript for predictions display
    - Fetch data from GET /api/analysis/predictions
    - Render predicted values alongside historical data
    - Display confidence intervals
    - Visually distinguish predictions from historical data
    - Display accuracy metrics when available
    - _Requirements: 14.4, 15.4_

  - [x] 18.6 Implement report generation interface
    - Add form for report customization (years, filters)
    - Call POST /api/reports/generate on form submit
    - Poll GET /api/reports/:reportId/status for completion
    - Display download link when ready
    - Show selected filters in UI
    - _Requirements: 12.5, 13.1, 13.2, 13.4_

  - [x] 18.7 Add authentication UI enhancements
    - Display user role (Admin/Inspector) in header
    - Hide/disable modification buttons for Inspector role
    - Show session expiration warning
    - Implement logout button
    - _Requirements: 10.2, 10.3, 11.1, 11.2, 11.3_

- [ ] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 20. Integration testing and end-to-end workflows
  - [ ]* 20.1 Write integration tests for student data workflow
    - Test complete workflow: import → validation → storage → retrieval → red flag detection
    - Test bulk import with mixed valid/invalid records
    - Test duplicate detection across imports
    - Test cross-year student history retrieval
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 6.1, 6.2_

  - [ ]* 20.2 Write integration tests for infrastructure workflow
    - Test complete workflow: facility creation → assessment logging → improvement recording → correlation analysis
    - Test multiple assessments per facility
    - Test chronological improvement history
    - Test correlation calculation with real student data
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 20.3 Write integration tests for report generation workflow
    - Test complete workflow: report request → data filtering → PDF generation → download
    - Test report with custom filters
    - Test download link expiration
    - Test report history retrieval
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3_

  - [ ]* 20.4 Write integration tests for authentication workflow
    - Test complete workflow: login → token creation → authenticated requests → logout
    - Test token expiration handling
    - Test role-based access control (Admin vs Inspector)
    - Test failed login tracking
    - Test single session enforcement
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 20.5 Write integration tests for audit logging workflow
    - Test audit logging for all CRUD operations
    - Test audit log filtering and retrieval
    - Test audit log retention (verify TTL index)
    - Test CSV export functionality
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [ ]* 20.6 Write performance tests for critical operations
    - Test red flag detection completes within 5 seconds for 1000+ students
    - Test dashboard queries complete within 2 seconds
    - Test report generation completes within 10 seconds for 1000 students
    - _Requirements: 5.4, 6.5, 12.3_

- [ ] 21. Documentation and deployment preparation
  - [ ] 21.1 Create API documentation
    - Document all endpoints with request/response examples
    - Document authentication requirements
    - Document error response formats
    - Document rate limits and performance expectations
    - _Requirements: 19.3_

  - [ ] 21.2 Create user manual
    - Document Admin features: data import, user management, predictions, audit logs
    - Document Inspector features: dashboard, reports, read-only access
    - Document report customization options
    - Include screenshots of dashboard and reports
    - _Requirements: 19.3_

  - [ ] 21.3 Create ER diagram
    - Document relationships between Student, Infrastructure, User, AuditLog, Prediction, Report
    - Show cardinality and foreign key relationships
    - Include field types and constraints
    - _Requirements: 19.1_

  - [ ] 21.4 Create system flowchart
    - Document Inspector navigation paths through dashboard
    - Show decision points for role-based access
    - Illustrate data flow from import to visualization
    - _Requirements: 19.2_

  - [ ] 21.5 Update package.json with all dependencies
    - Ensure all required packages are listed: express, mongoose, jsonwebtoken, bcryptjs, pdfkit, fast-check, jest, supertest
    - Add test scripts: test, test:unit, test:property, test:integration, test:coverage
    - Add start scripts for development and production
    - _Requirements: All implementation requirements_

  - [ ] 21.6 Create environment configuration template
    - Document required environment variables: DATABASE_URL, JWT_SECRET, PORT, NODE_ENV
    - Create .env.example file
    - Document configuration for development vs production
    - _Requirements: All implementation requirements_

  - [ ] 21.7 Create database migration scripts
    - Create script to add indexes to existing collections
    - Create script to seed initial admin user
    - Create script to migrate existing data to new schema
    - _Requirements: All data model requirements_

- [ ] 22. Final checkpoint and code review
  - [ ] 22.1 Run complete test suite
    - Run all unit tests and verify 80%+ code coverage
    - Run all 60 property-based tests with 100 iterations each
    - Run all integration tests
    - Run performance tests
    - Fix any failing tests

  - [ ] 22.2 Code quality review
    - Review all service implementations for error handling
    - Review all API endpoints for consistent error responses
    - Review all validation logic for completeness
    - Review all audit logging for completeness
    - Ensure all code follows Node.js best practices

  - [ ] 22.3 Security review
    - Verify JWT tokens are properly validated
    - Verify passwords are hashed with bcrypt
    - Verify role-based access control is enforced on all endpoints
    - Verify input validation prevents injection attacks
    - Verify sensitive data is not logged

  - [ ] 22.4 Performance review
    - Verify database indexes are properly configured
    - Verify queries are optimized for large datasets
    - Verify response times meet requirements (2s, 5s, 10s)
    - Verify memory usage is reasonable
    - Verify no N+1 query problems

  - [ ] 22.5 Documentation review
    - Verify API documentation is complete and accurate
    - Verify user manual covers all features
    - Verify ER diagram matches implementation
    - Verify flowchart matches navigation paths
    - Verify README has setup instructions

- [ ] 23. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with minimum 100 iterations
- Integration tests use Jest and supertest for API testing
- Performance tests verify critical operations meet time requirements
- All services follow separation of concerns principle
- All API endpoints include proper error handling and audit logging
- Frontend uses vanilla JavaScript for simplicity
- Database uses MongoDB with Mongoose ODM
- Authentication uses JWT tokens with 8-hour expiration
- Role-based access control enforces Admin vs Inspector permissions
