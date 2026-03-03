const Report = require("../models/Report");
const pdfGenerator = require("../services/PDFGenerator");
const crypto = require("crypto");

/**
 * POST /api/reports/generate
 * Generate PDF report with custom filters
 * Admin and Inspector access
 */
exports.generateReport = async (req, res) => {
  try {
    const { reportType = 'performance_summary', filters = {} } = req.body;

    const validTypes = ['performance_summary', 'red_flags', 'infrastructure_correlation', 'predictions'];
    if (!validTypes.includes(reportType)) {
      return res.status(400).json({ 
        message: `reportType must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Generate unique IDs
    const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const downloadToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create report record with 'generating' status
    const report = await Report.create({
      reportId,
      downloadToken,
      reportType,
      filters,
      generatedBy: req.user.id,
      generatedAt: new Date(),
      expiresAt,
      status: 'generating'
    });

    // Generate PDF asynchronously
    pdfGenerator.generateReport({
      reportType,
      filters,
      reportId,
      downloadToken
    })
      .then(async (result) => {
        // Update report with success
        report.status = 'ready';
        report.fileName = result.fileName;
        report.fileSize = result.fileSize;
        report.filePath = result.filePath;
        await report.save();
      })
      .catch(async (error) => {
        console.error('PDF generation failed:', error);
        report.status = 'error';
        await report.save();
      });

    res.json({
      reportId,
      downloadToken,
      status: 'generating',
      estimatedTime: '10 seconds',
      expiresAt
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ 
      message: "Failed to generate report", 
      error: error.message 
    });
  }
};

/**
 * GET /api/reports/:reportId/status
 * Check report generation status
 * Admin and Inspector access
 */
exports.getReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findOne({ reportId });
    
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if expired
    if (new Date() > report.expiresAt) {
      return res.status(410).json({ 
        message: "Report has expired",
        status: 'expired'
      });
    }

    const response = {
      reportId: report.reportId,
      status: report.status,
      expiresAt: report.expiresAt
    };

    if (report.status === 'ready') {
      response.downloadUrl = `/api/reports/download/${report.downloadToken}`;
      response.fileSize = report.fileSize;
    }

    res.json(response);
  } catch (error) {
    console.error('Get report status error:', error);
    res.status(500).json({ 
      message: "Failed to retrieve report status", 
      error: error.message 
    });
  }
};

/**
 * GET /api/reports/download/:token
 * Download report PDF
 * Public access with valid token
 */
exports.downloadReport = async (req, res) => {
  try {
    const { token } = req.params;

    const report = await Report.findOne({ downloadToken: token });
    
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if expired
    if (new Date() > report.expiresAt) {
      return res.status(410).json({ 
        message: "Download link has expired" 
      });
    }

    // Check if ready
    if (report.status !== 'ready') {
      return res.status(400).json({ 
        message: `Report is not ready. Current status: ${report.status}` 
      });
    }

    // Increment download count
    report.downloadCount += 1;
    await report.save();

    // Stream PDF file
    const fs = require('fs');
    const path = require('path');

    if (!report.filePath || !fs.existsSync(report.filePath)) {
      return res.status(404).json({ 
        message: "Report file not found" 
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    
    const fileStream = fs.createReadStream(report.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ 
      message: "Failed to download report", 
      error: error.message 
    });
  }
};

/**
 * GET /api/reports/history
 * Get user's report history
 * Admin and Inspector access
 */
exports.getReportHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Query reports for current user
    const query = { generatedBy: req.user.id };

    const reports = await Report.find(query)
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-filePath -downloadToken');

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get report history error:', error);
    res.status(500).json({ 
      message: "Failed to retrieve report history", 
      error: error.message 
    });
  }
};
