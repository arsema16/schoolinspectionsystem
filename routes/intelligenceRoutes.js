const express = require("express");
const router = express.Router();

const YearStatistics = require("../models/YearStatistics");
const Laboratory = require("../models/Laboratory");
const Classroom = require("../models/Classroom");
const TeacherPerformance = require("../models/TeacherPerformance");

router.get("/api/report", async (req, res) => {
    try {

        const years = await YearStatistics.find().sort({ year: 1 });

        if (years.length === 0) {
            return res.json({ message: "No data available" });
        }

        // Highest entrance year
        const highestYear = years.reduce((max, y) =>
            y.avgEntranceScore > max.avgEntranceScore ? y : max
        );

        // Growth rate prediction
        let growth = 0;
        if (years.length >= 2) {
            growth = years[years.length - 1].avgGraduationScore -
                     years[years.length - 2].avgGraduationScore;
        }

        const predictedNext =
            years[years.length - 1].avgGraduationScore + growth;

        const recommendedEntranceTarget =
            highestYear.avgEntranceScore + 5;

        // Labs
        const labs = await Laboratory.find();
        const labIssues = labs.filter(l =>
            l.registeredStudents > l.capacity
        );

        // Classrooms
        const classes = await Classroom.find();
        const classIssues = classes.filter(c =>
            c.enrolledStudents > c.capacity
        );

        // Teachers
        const teachers = await TeacherPerformance.find();
        const bestTeacher = teachers.reduce((max, t) =>
            t.improvementRate > max.improvementRate ? t : max
        );

        res.json({
            highestEntranceYear: highestYear.year,
            highestEntranceScore: highestYear.avgEntranceScore,
            predictedNextGraduationScore: predictedNext,
            recommendedEntranceTarget,
            labMaintenance: labIssues,
            classroomMaintenance: classIssues,
            recommendedTeachingModel: bestTeacher.teacherName
        });

    } catch (err) {
        res.status(500).json({ error: "Intelligence engine failure" });
    }
});

module.exports = router;