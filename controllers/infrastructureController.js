const Infrastructure = require("../models/Infrastructure");
const auditLogger = require("../services/AuditLogger");
const correlationAnalyzer = require("../services/CorrelationAnalyzer");

/**
 * POST /api/infrastructure
 * Create new infrastructure facility
 * Admin and Inspector access
 */
exports.createFacility = async (req, res) => {
  try {
    const { facilityId, facilityType, facilityName, affectedGrades, capacity } = req.body;

    // Validate input
    if (!facilityId || !facilityType || !facilityName) {
      return res.status(400).json({ 
        message: "facilityId, facilityType, and facilityName are required" 
      });
    }

    if (!['classroom', 'laboratory', 'library'].includes(facilityType)) {
      return res.status(400).json({ 
        message: "facilityType must be one of: classroom, laboratory, library" 
      });
    }

    // Check if facility already exists
    const existing = await Infrastructure.findOne({ facilityId });
    if (existing) {
      return res.status(409).json({ 
        message: "Facility with this ID already exists" 
      });
    }

    // Create facility
    const facility = await Infrastructure.create({
      facilityId,
      facilityType,
      facilityName,
      affectedGrades: affectedGrades || [],
      capacity: capacity || 0,
      conditionHistory: [],
      improvements: []
    });

    // Log creation
    await auditLogger.logEvent({
      action: 'CREATE',
      entityType: 'Infrastructure',
      entityId: facility._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: {
        after: facility.toObject()
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(facility);
  } catch (error) {
    console.error('Create facility error:', error);
    res.status(500).json({ 
      message: "Failed to create facility", 
      error: error.message 
    });
  }
};

/**
 * POST /api/infrastructure/:facilityId/assessment
 * Add condition assessment to facility
 * Admin and Inspector access
 */
exports.addAssessment = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { year, rating, assessmentDate, notes } = req.body;

    // Validate input
    if (!year || !rating || !assessmentDate) {
      return res.status(400).json({ 
        message: "year, rating, and assessmentDate are required" 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "rating must be between 1 and 5" 
      });
    }

    const assessmentDateObj = new Date(assessmentDate);
    if (assessmentDateObj > new Date()) {
      return res.status(400).json({ 
        message: "assessmentDate cannot be in the future" 
      });
    }

    // Find facility
    const facility = await Infrastructure.findOne({ facilityId });
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    // Capture before state
    const before = facility.toObject();

    // Add assessment
    facility.conditionHistory.push({
      year,
      rating,
      assessmentDate: assessmentDateObj,
      notes: notes || '',
      assessedBy: req.user.id
    });

    await facility.save();

    // Log assessment
    await auditLogger.logEvent({
      action: 'UPDATE',
      entityType: 'Infrastructure',
      entityId: facility._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: {
        before,
        after: facility.toObject()
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(facility);
  } catch (error) {
    console.error('Add assessment error:', error);
    res.status(500).json({ 
      message: "Failed to add assessment", 
      error: error.message 
    });
  }
};

/**
 * POST /api/infrastructure/:facilityId/improvement
 * Record infrastructure improvement
 * Admin only
 */
exports.addImprovement = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { 
      improvementId, 
      description, 
      improvementType, 
      completionDate, 
      cost, 
      beforeRating, 
      afterRating 
    } = req.body;

    // Validate input
    if (!improvementId || !description || !improvementType || !completionDate) {
      return res.status(400).json({ 
        message: "improvementId, description, improvementType, and completionDate are required" 
      });
    }

    const validTypes = ['renovation', 'equipment_upgrade', 'new_construction', 'maintenance'];
    if (!validTypes.includes(improvementType)) {
      return res.status(400).json({ 
        message: `improvementType must be one of: ${validTypes.join(', ')}` 
      });
    }

    const completionDateObj = new Date(completionDate);
    if (completionDateObj > new Date()) {
      return res.status(400).json({ 
        message: "completionDate cannot be in the future" 
      });
    }

    // Find facility
    const facility = await Infrastructure.findOne({ facilityId });
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    // Capture before state
    const before = facility.toObject();

    // Add improvement
    facility.improvements.push({
      improvementId,
      description,
      improvementType,
      completionDate: completionDateObj,
      cost: cost || 0,
      beforeRating: beforeRating || null,
      afterRating: afterRating || null,
      recordedBy: req.user.id
    });

    await facility.save();

    // Log improvement
    await auditLogger.logEvent({
      action: 'UPDATE',
      entityType: 'Infrastructure',
      entityId: facility._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: {
        before,
        after: facility.toObject()
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    // Trigger correlation analysis asynchronously (don't wait for it)
    correlationAnalyzer.analyzeImprovement(improvementId)
      .catch(err => console.error('Correlation analysis failed:', err));

    res.json(facility);
  } catch (error) {
    console.error('Add improvement error:', error);
    res.status(500).json({ 
      message: "Failed to add improvement", 
      error: error.message 
    });
  }
};

/**
 * GET /api/infrastructure
 * Get all facilities with optional filtering
 * Admin and Inspector access
 */
exports.getFacilities = async (req, res) => {
  try {
    const { facilityType, year, minRating } = req.query;

    // Build query
    const query = {};
    
    if (facilityType) {
      query.facilityType = facilityType;
    }

    // Execute query
    let facilities = await Infrastructure.find(query);

    // Apply additional filters
    if (year || minRating) {
      facilities = facilities.filter(facility => {
        if (year) {
          const hasYear = facility.conditionHistory.some(
            h => h.year === parseInt(year)
          );
          if (!hasYear) return false;
        }

        if (minRating) {
          const latestRating = facility.conditionHistory.length > 0
            ? facility.conditionHistory[facility.conditionHistory.length - 1].rating
            : 0;
          if (latestRating < parseFloat(minRating)) return false;
        }

        return true;
      });
    }

    res.json({ facilities });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ 
      message: "Failed to retrieve facilities", 
      error: error.message 
    });
  }
};

/**
 * GET /api/infrastructure/:facilityId/history
 * Get complete history of a facility
 * Admin and Inspector access
 */
exports.getFacilityHistory = async (req, res) => {
  try {
    const { facilityId } = req.params;

    const facility = await Infrastructure.findOne({ facilityId })
      .populate('conditionHistory.assessedBy', 'username')
      .populate('improvements.recordedBy', 'username');

    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    // Sort improvements chronologically
    const sortedImprovements = [...facility.improvements].sort(
      (a, b) => new Date(a.completionDate) - new Date(b.completionDate)
    );

    // Calculate current rating
    const currentRating = facility.conditionHistory.length > 0
      ? facility.conditionHistory[facility.conditionHistory.length - 1].rating
      : null;

    // Calculate total investment
    const totalInvestment = facility.improvements.reduce(
      (sum, imp) => sum + (imp.cost || 0), 
      0
    );

    res.json({
      facilityId: facility.facilityId,
      facilityType: facility.facilityType,
      facilityName: facility.facilityName,
      currentRating,
      totalInvestment,
      conditionHistory: facility.conditionHistory,
      improvements: sortedImprovements,
      affectedGrades: facility.affectedGrades,
      capacity: facility.capacity
    });
  } catch (error) {
    console.error('Get facility history error:', error);
    res.status(500).json({ 
      message: "Failed to retrieve facility history", 
      error: error.message 
    });
  }
};

/**
 * PUT /api/infrastructure/:facilityId
 * Update facility information
 * Admin only
 */
exports.updateFacility = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const updates = req.body;

    const facility = await Infrastructure.findOne({ facilityId });
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    // Capture before state
    const before = facility.toObject();

    // Apply updates (excluding arrays and _id)
    const allowedUpdates = ['facilityName', 'facilityType', 'affectedGrades', 'capacity'];
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        facility[key] = updates[key];
      }
    });

    await facility.save();

    // Log update
    await auditLogger.logEvent({
      action: 'UPDATE',
      entityType: 'Infrastructure',
      entityId: facility._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: {
        before,
        after: facility.toObject()
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(facility);
  } catch (error) {
    console.error('Update facility error:', error);
    res.status(500).json({ 
      message: "Failed to update facility", 
      error: error.message 
    });
  }
};

/**
 * DELETE /api/infrastructure/:facilityId
 * Delete facility
 * Admin only
 */
exports.deleteFacility = async (req, res) => {
  try {
    const { facilityId } = req.params;

    const facility = await Infrastructure.findOne({ facilityId });
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    // Capture before state
    const before = facility.toObject();

    await Infrastructure.deleteOne({ facilityId });

    // Log deletion
    await auditLogger.logEvent({
      action: 'DELETE',
      entityType: 'Infrastructure',
      entityId: facility._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      changes: {
        before
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({ message: "Facility deleted successfully" });
  } catch (error) {
    console.error('Delete facility error:', error);
    res.status(500).json({ 
      message: "Failed to delete facility", 
      error: error.message 
    });
  }
};
