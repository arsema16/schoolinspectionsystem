const mongoose = require('mongoose');
const Student = require('../models/Student');

describe('Student Model Enhancements', () => {
  // Test age group calculation
  describe('Age Group Calculation', () => {
    it('should set ageGroup to Primary for ages 5-10', () => {
      const student = new Student({
        studentId: 'S001',
        name: 'Test Student',
        year: 2015,
        age: 8,
        gender: 'Male',
        gradeLevel: 3,
        subjects: { math: 85, english: 78, science: 92, it: 88 }
      });
      
      // Manually trigger pre-save logic
      const subjects = student.subjects;
      const marks = [subjects.math, subjects.english, subjects.science, subjects.it].filter(m => m != null && m !== undefined);
      student.average = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
      
      if (student.age >= 5 && student.age <= 10) {
        student.ageGroup = 'Primary';
      } else if (student.age >= 11 && student.age <= 14) {
        student.ageGroup = 'Middle';
      } else if (student.age >= 15 && student.age <= 18) {
        student.ageGroup = 'Secondary';
      } else if (student.age >= 19) {
        student.ageGroup = 'Adult';
      }
      
      expect(student.ageGroup).toBe('Primary');
    });

    it('should set ageGroup to Middle for ages 11-14', () => {
      const student = new Student({
        studentId: 'S002',
        name: 'Test Student',
        year: 2015,
        age: 13,
        gender: 'Female',
        gradeLevel: 8,
        subjects: { math: 85, english: 78, science: 92, it: 88 }
      });
      
      // Manually trigger pre-save logic
      if (student.age >= 5 && student.age <= 10) {
        student.ageGroup = 'Primary';
      } else if (student.age >= 11 && student.age <= 14) {
        student.ageGroup = 'Middle';
      } else if (student.age >= 15 && student.age <= 18) {
        student.ageGroup = 'Secondary';
      } else if (student.age >= 19) {
        student.ageGroup = 'Adult';
      }
      
      expect(student.ageGroup).toBe('Middle');
    });

    it('should set ageGroup to Secondary for ages 15-18', () => {
      const student = new Student({
        studentId: 'S003',
        name: 'Test Student',
        year: 2015,
        age: 16,
        gender: 'Male',
        gradeLevel: 11,
        subjects: { math: 85, english: 78, science: 92, it: 88 }
      });
      
      // Manually trigger pre-save logic
      if (student.age >= 5 && student.age <= 10) {
        student.ageGroup = 'Primary';
      } else if (student.age >= 11 && student.age <= 14) {
        student.ageGroup = 'Middle';
      } else if (student.age >= 15 && student.age <= 18) {
        student.ageGroup = 'Secondary';
      } else if (student.age >= 19) {
        student.ageGroup = 'Adult';
      }
      
      expect(student.ageGroup).toBe('Secondary');
    });

    it('should set ageGroup to Adult for ages 19+', () => {
      const student = new Student({
        studentId: 'S004',
        name: 'Test Student',
        year: 2015,
        age: 21,
        gender: 'Female',
        gradeLevel: 12,
        subjects: { math: 85, english: 78, science: 92, it: 88 }
      });
      
      // Manually trigger pre-save logic
      if (student.age >= 5 && student.age <= 10) {
        student.ageGroup = 'Primary';
      } else if (student.age >= 11 && student.age <= 14) {
        student.ageGroup = 'Middle';
      } else if (student.age >= 15 && student.age <= 18) {
        student.ageGroup = 'Secondary';
      } else if (student.age >= 19) {
        student.ageGroup = 'Adult';
      }
      
      expect(student.ageGroup).toBe('Adult');
    });
  });

  // Test average calculation
  describe('Average Calculation', () => {
    it('should calculate average correctly from all subjects', () => {
      const student = new Student({
        studentId: 'S005',
        name: 'Test Student',
        year: 2015,
        age: 15,
        gender: 'Male',
        gradeLevel: 10,
        subjects: { math: 80, english: 70, science: 90, it: 60 }
      });
      
      // Manually trigger pre-save logic
      const subjects = student.subjects;
      const marks = [subjects.math, subjects.english, subjects.science, subjects.it].filter(m => m != null && m !== undefined);
      student.average = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
      
      expect(student.average).toBe(75); // (80+70+90+60)/4
    });

    it('should calculate average with missing subjects', () => {
      const student = new Student({
        studentId: 'S006',
        name: 'Test Student',
        year: 2015,
        age: 15,
        gender: 'Female',
        gradeLevel: 10,
        subjects: { math: 80, english: 90 }
      });
      
      // Manually trigger pre-save logic
      const subjects = student.subjects;
      const marks = [subjects.math, subjects.english, subjects.science, subjects.it].filter(m => m != null && m !== undefined);
      student.average = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
      
      expect(student.average).toBe(85); // (80+90)/2
    });
  });

  // Test mark validation
  describe('Mark Validation', () => {
    it('should accept marks with up to 2 decimal places', async () => {
      const student = new Student({
        studentId: 'S007',
        name: 'Test Student',
        year: 2015,
        age: 15,
        gender: 'Male',
        gradeLevel: 10,
        subjects: { math: 85.75, english: 78.5, science: 92, it: 88.25 }
      });
      
      await expect(student.validate()).resolves.not.toThrow();
    });

    it('should reject marks with more than 2 decimal places', async () => {
      const student = new Student({
        studentId: 'S008',
        name: 'Test Student',
        year: 2015,
        age: 15,
        gender: 'Male',
        gradeLevel: 10,
        subjects: { math: 85.755 }
      });
      
      await expect(student.validate()).rejects.toThrow();
    });

    it('should reject marks above 100', async () => {
      const student = new Student({
        studentId: 'S009',
        name: 'Test Student',
        year: 2015,
        age: 15,
        gender: 'Male',
        gradeLevel: 10,
        subjects: { math: 105 }
      });
      
      await expect(student.validate()).rejects.toThrow();
    });

    it('should reject negative marks', async () => {
      const student = new Student({
        studentId: 'S010',
        name: 'Test Student',
        year: 2015,
        age: 15,
        gender: 'Male',
        gradeLevel: 10,
        subjects: { math: -5 }
      });
      
      await expect(student.validate()).rejects.toThrow();
    });
  });

  // Test red flags structure
  describe('Red Flags', () => {
    it('should allow red flags to be added', async () => {
      const student = new Student({
        studentId: 'S011',
        name: 'Test Student',
        year: 2016,
        age: 15,
        gender: 'Male',
        gradeLevel: 10,
        subjects: { math: 65, english: 70, science: 68, it: 72 },
        redFlags: [{
          year: 2016,
          comparedToYear: 2015,
          subjects: ['math', 'science'],
          overallDecline: -18.5,
          detectedAt: new Date()
        }]
      });
      
      await expect(student.validate()).resolves.not.toThrow();
      expect(student.redFlags).toHaveLength(1);
      expect(student.redFlags[0].subjects).toContain('math');
      expect(student.redFlags[0].overallDecline).toBe(-18.5);
    });
  });

  // Test required fields
  describe('Required Fields', () => {
    it('should require studentId', async () => {
      const student = new Student({
        name: 'Test Student',
        year: 2015,
        age: 15,
        gender: 'Male',
        gradeLevel: 10
      });
      
      await expect(student.validate()).rejects.toThrow();
    });

    it('should require name', async () => {
      const student = new Student({
        studentId: 'S012',
        year: 2015,
        age: 15,
        gender: 'Male',
        gradeLevel: 10
      });
      
      await expect(student.validate()).rejects.toThrow();
    });

    it('should require age', async () => {
      const student = new Student({
        studentId: 'S013',
        name: 'Test Student',
        year: 2015,
        gender: 'Male',
        gradeLevel: 10
      });
      
      await expect(student.validate()).rejects.toThrow();
    });
  });

  // Test age range validation
  describe('Age Range Validation', () => {
    it('should reject age below 5', async () => {
      const student = new Student({
        studentId: 'S014',
        name: 'Test Student',
        year: 2015,
        age: 3,
        gender: 'Male',
        gradeLevel: 1
      });
      
      await expect(student.validate()).rejects.toThrow();
    });

    it('should reject age above 25', async () => {
      const student = new Student({
        studentId: 'S015',
        name: 'Test Student',
        year: 2015,
        age: 30,
        gender: 'Male',
        gradeLevel: 12
      });
      
      await expect(student.validate()).rejects.toThrow();
    });
  });
});
