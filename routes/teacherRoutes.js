const express = require('express');
const router = express.Router();
const TeacherPerformance = require('../models/TeacherPerformance');
const { protect } = require('../middleware/authMiddleware');

// GET /api/teachers - list all teachers with lesson plans
router.get('/', protect, async (req, res) => {
  try {
    const { gradeGroup, year } = req.query;
    const query = {};
    if (gradeGroup) query.gradeGroup = gradeGroup;
    const teachers = await TeacherPerformance.find(query).sort({ gradeGroup: 1, teacherName: 1 });

    // Filter lesson plans by year if requested
    if (year) {
      const y = parseInt(year);
      teachers.forEach(t => {
        t.lessonPlans = t.lessonPlans.filter(lp => lp.year === y);
      });
    }

    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch teachers', error: err.message });
  }
});

module.exports = router;
