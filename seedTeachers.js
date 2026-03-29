require('dotenv').config();
const mongoose = require('mongoose');
const TeacherPerformance = require('./models/TeacherPerformance');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://schooladmin:arse123@cluster0.idnv9bs.mongodb.net/?appName=Cluster0');

const teachers = [
  // Grade 11 & 12
  {
    teacherName: 'Ato Samuel Girma', subject: 'Math', gradeGroup: '11-12', improvementRate: 95,
    performanceScore: 92, teachingMethodology: 'Problem-Based', professionalDevelopment: 'Advanced Calculus Workshop',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Algebra & Functions', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Well-structured, clear objectives.' },
      { year: 2016, topic: 'Grade 11 & 12 Trigonometry', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Strong focus on problem-solving.' },
      { year: 2017, topic: 'Grade 11 & 12 Calculus Fundamentals', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Excellent integration of real-world applications.' }
    ]
  },
  {
    teacherName: 'W/ro Helina Belay', subject: 'English', gradeGroup: '11-12', improvementRate: 80,
    performanceScore: 85, teachingMethodology: 'Communicative', professionalDevelopment: 'English Proficiency Level C1',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 English Grammar & Composition', gradeLevel: 'Grade 11', status: 'Needs Revision', feedback: 'More interactive activities needed.' },
      { year: 2016, topic: 'Grade 12 Literature: African Authors', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Improved student engagement, diverse texts.' },
      { year: 2017, topic: 'Grade 11 & 12 English Language Skills', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Focus on advanced vocabulary and essay writing.' }
    ]
  },
  {
    teacherName: 'Ato Dawit Tesfaye', subject: 'Chemistry', gradeGroup: '11-12', improvementRate: 82,
    performanceScore: 78, teachingMethodology: 'Lab-Integrated', professionalDevelopment: 'Chemical Safety Training',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Basic Organic Chemistry', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Good lab safety focus.' },
      { year: 2016, topic: 'Grade 12 Electrochemistry & Reaction Kinetics', gradeLevel: 'Grade 12', status: 'Needs Revision', feedback: 'Missing detailed lab experiment procedures.' },
      { year: 2017, topic: 'Grade 11 & 12 Chemical Bonding & Periodicity', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Strong theoretical explanations. Safety guidelines updated.' }
    ]
  },
  {
    teacherName: 'W/ro Tigist Amare', subject: 'Biology', gradeGroup: '11-12', improvementRate: 93,
    performanceScore: 88, teachingMethodology: 'Visual/Diagram', professionalDevelopment: 'Biotechnology Seminar',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Cell Biology & Genetics', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Excellent use of diagrams.' },
      { year: 2016, topic: 'Grade 12 Ecology & Environmental Science', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Good fieldwork proposal.' },
      { year: 2017, topic: 'Grade 11 & 12 Human Anatomy & Physiology', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Interactive learning.' }
    ]
  },
  {
    teacherName: 'Ato Yonas Kebede', subject: 'Physics', gradeGroup: '11-12', improvementRate: 91,
    performanceScore: 95, teachingMethodology: 'Inquiry-Based', professionalDevelopment: 'Space Science Certification',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Mechanics & Energy', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Clear experimental design.' },
      { year: 2016, topic: 'Grade 12 Waves, Optics & Thermodynamics', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Engaged students with practical demonstrations.' },
      { year: 2017, topic: 'Grade 11 & 12 Electromagnetism', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Advanced problem-solving integrated.' }
    ]
  },
  {
    teacherName: 'Ato Tadesse Alemu', subject: 'History', gradeGroup: '11-12', improvementRate: 65,
    performanceScore: 70, teachingMethodology: 'Lecture-Based', professionalDevelopment: 'Heritage Conservation',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Ancient African Civilizations', gradeLevel: 'Grade 11', status: 'Missing', feedback: 'Plan was not submitted for review.' },
      { year: 2016, topic: 'Grade 12 World Wars & Post-Colonial Africa', gradeLevel: 'Grade 12', status: 'In Review', feedback: 'Submitted late. Awaiting detailed primary source list.' },
      { year: 2017, topic: 'Grade 11 & 12 Ethiopian History: Medieval Period', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Improved submission timeliness. Good use of historical maps.' }
    ]
  },
  {
    teacherName: 'W/ro Martha Yosef', subject: 'Economics', gradeGroup: '11-12', improvementRate: 88,
    performanceScore: 82, teachingMethodology: 'Case-Study', professionalDevelopment: 'Macro-Economics Update',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Microeconomics Principles', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Good local market examples.' },
      { year: 2016, topic: 'Grade 12 Macroeconomics Theories', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Encouraged critical analysis of economic policies.' },
      { year: 2017, topic: 'Grade 11 & 12 Development Economics', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Relevant to Ethiopian context.' }
    ]
  },
  {
    teacherName: 'Ato Ephrem Zewde', subject: 'Geography', gradeGroup: '11-12', improvementRate: 87,
    performanceScore: 80, teachingMethodology: 'Field-Data', professionalDevelopment: 'GIS Software Training',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Physical Geography', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Good use of maps and field data.' },
      { year: 2016, topic: 'Grade 12 Human Geography: Urbanization', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Comprehensive data analysis tasks.' },
      { year: 2017, topic: 'Grade 11 & 12 Environmental Geography', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Promoted environmental awareness projects.' }
    ]
  },
  {
    teacherName: 'W/ro Bethlehem Hailu', subject: 'Civics', gradeGroup: '11-12', improvementRate: 92,
    performanceScore: 89, teachingMethodology: 'Group Debate', professionalDevelopment: 'Human Rights Law Course',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Ethiopian Governance', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Good focus on constitutional rights.' },
      { year: 2016, topic: 'Grade 12 Global Civics & Human Rights', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Encouraged debate on international issues.' },
      { year: 2017, topic: 'Grade 11 & 12 Responsible Citizenship', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Excellent community engagement projects.' }
    ]
  },
  {
    teacherName: 'Ato Kassahun Debebe', subject: 'Amharic', gradeGroup: '11-12', improvementRate: 89,
    performanceScore: 91, teachingMethodology: 'Literature-Analysis', professionalDevelopment: 'Modern Linguistics',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Amharic Grammar & Writing', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Clear grammar explanations.' },
      { year: 2016, topic: 'Grade 12 Amharic Literature & Poetry', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Rich analysis of classic texts.' },
      { year: 2017, topic: 'Grade 11 & 12 Amharic Composition & Oratory', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Improved student public speaking skills.' }
    ]
  },
  {
    teacherName: 'Ato Solomon Tsegaye', subject: 'Sport', gradeGroup: '11-12', improvementRate: 85,
    performanceScore: 84, teachingMethodology: 'Practical/Physical', professionalDevelopment: 'First Aid & CPR Certified',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Individual Sports & Fitness', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Focus on student health.' },
      { year: 2016, topic: 'Grade 12 Team Sports & Strategy', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Developed teamwork and leadership.' },
      { year: 2017, topic: 'Grade 11 & 12 Sports Science Basics', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Good theoretical foundation combined with practicals.' }
    ]
  },
  {
    teacherName: 'W/ro Tolantu Dibaba', subject: 'Afaan Oromo', gradeGroup: '11-12', improvementRate: 86,
    performanceScore: 93, teachingMethodology: 'Oral-Narrative', professionalDevelopment: 'Cultural Studies',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Afaan Oromo Reading & Comprehension', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Effective vocabulary building.' },
      { year: 2016, topic: 'Grade 12 Afaan Oromo Oral Traditions', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Celebrated cultural heritage.' },
      { year: 2017, topic: 'Grade 11 & 12 Afaan Oromo Advanced Writing', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Improved student essay quality.' }
    ]
  },
  {
    teacherName: 'Ato Bereket Mekonnen', subject: 'IT', gradeGroup: '11-12', improvementRate: 90,
    performanceScore: 98, teachingMethodology: 'ICT-Integrated', professionalDevelopment: 'Full-Stack Web Dev (Node.js)',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Computer Basics & MS Office', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Foundational digital literacy skills.' },
      { year: 2016, topic: 'Grade 12 Introduction to Programming (Scratch/Python)', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Strong focus on logical thinking.' },
      { year: 2017, topic: 'Grade 11 & 12 Web Design Fundamentals (HTML/CSS)', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Project-based learning encouraged creativity.' }
    ]
  },
  {
    teacherName: 'Ato Mohammed Nur', subject: 'Agriculture', gradeGroup: '11-12', improvementRate: 84,
    performanceScore: 87, teachingMethodology: 'Practical Farm-Work', professionalDevelopment: 'Sustainable Irrigation',
    lessonPlans: [
      { year: 2015, topic: 'Grade 11 Crop Production & Soil Science', gradeLevel: 'Grade 11', status: 'Approved', feedback: 'Practical, hands-on approach.' },
      { year: 2016, topic: 'Grade 12 Livestock Management & Farm Economics', gradeLevel: 'Grade 12', status: 'Approved', feedback: 'Integrated economic principles.' },
      { year: 2017, topic: 'Grade 11 & 12 Sustainable Agriculture', gradeLevel: 'Grade 11 & 12', status: 'Approved', feedback: 'Emphasized environmental responsibility.' }
    ]
  },

  // Grade 9 & 10
  {
    teacherName: 'Ato Henok Belachew', subject: 'Math', gradeGroup: '9-10', improvementRate: 94,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Number Systems & Basic Algebra', gradeLevel: 'Grade 9', status: 'Approved', feedback: 'Excellent foundational teaching.' },
      { year: 2016, topic: 'Grade 10 Geometry & Measurement', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Clear visual aids.' },
      { year: 2017, topic: 'Grade 9 & 10 Advanced Algebra & Introduction to Functions', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Strong problem-solving focus.' }
    ]
  },
  {
    teacherName: 'W/ro Sara Tefera', subject: 'English', gradeGroup: '9-10', improvementRate: 75,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 English Reading & Writing', gradeLevel: 'Grade 9', status: 'Needs Revision', feedback: 'More structured reading activities needed.' },
      { year: 2016, topic: 'Grade 10 English Comprehension & Essay Writing', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Improved lesson structure.' },
      { year: 2017, topic: 'Grade 9 & 10 English Communication Skills', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Good focus on oral and written communication.' }
    ]
  },
  {
    teacherName: 'Ato Tesfaye Worku', subject: 'Chemistry', gradeGroup: '9-10', improvementRate: 78,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Introduction to Chemistry', gradeLevel: 'Grade 9', status: 'Needs Revision', feedback: 'Lab safety protocols insufficient.' },
      { year: 2016, topic: 'Grade 10 Chemical Reactions & Stoichiometry', gradeLevel: 'Grade 10', status: 'Needs Revision', feedback: 'Still lacking detailed safety plans for experiments.' },
      { year: 2017, topic: 'Grade 9 & 10 Acids, Bases & Salts', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Safety now thoroughly covered. Practical demonstrations clear.' }
    ]
  },
  {
    teacherName: 'W/ro Mulugeta Zenebe', subject: 'Biology', gradeGroup: '9-10', improvementRate: 90,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Introduction to Living Organisms', gradeLevel: 'Grade 9', status: 'Approved', feedback: 'Engaging and interactive.' },
      { year: 2016, topic: 'Grade 10 Plant & Animal Systems', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Good use of diagrams and models.' },
      { year: 2017, topic: 'Grade 9 & 10 Ecology & Human Health', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Relevant to student daily lives.' }
    ]
  },
  {
    teacherName: 'Ato Girma Tola', subject: 'Physics', gradeGroup: '9-10', improvementRate: 92,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Basic Mechanics & Forces', gradeLevel: 'Grade 9', status: 'Approved', feedback: 'Excellent practical demonstrations.' },
      { year: 2016, topic: 'Grade 10 Electricity & Magnetism Basics', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Clear problem-solving steps.' },
      { year: 2017, topic: 'Grade 9 & 10 Light, Sound & Energy', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Inquiry-based learning approach.' }
    ]
  },
  {
    teacherName: 'W/ro Rahel Negussie', subject: 'History', gradeGroup: '9-10', improvementRate: 62,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Ethiopian Ancient History', gradeLevel: 'Grade 9', status: 'Missing', feedback: 'Plan not submitted for review.' },
      { year: 2016, topic: 'Grade 10 World History: Industrial Revolution', gradeLevel: 'Grade 10', status: 'In Review', feedback: 'Submitted late. Requires more varied sources.' },
      { year: 2017, topic: 'Grade 9 & 10 African History: Colonial Period', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Improved submission. Good critical analysis prompts.' }
    ]
  },
  {
    teacherName: 'Ato Fikru Desalegn', subject: 'Economics', gradeGroup: '9-10', improvementRate: 86,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Basic Economic Concepts', gradeLevel: 'Grade 9', status: 'Approved', feedback: 'Relatable to student experiences.' },
      { year: 2016, topic: 'Grade 10 Markets & Business Principles', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Encouraged entrepreneurial thinking.' },
      { year: 2017, topic: 'Grade 9 & 10 Global Economy Introduction', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Good use of current events.' }
    ]
  },
  {
    teacherName: 'W/ro Senait Moges', subject: 'Geography', gradeGroup: '9-10', improvementRate: 50,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Physical Features of Ethiopia', gradeLevel: 'Grade 9', status: 'Missing', feedback: 'Plan not submitted.' },
      { year: 2016, topic: 'Grade 10 World Climate Zones', gradeLevel: 'Grade 10', status: 'Missing', feedback: 'Plan still missing for second consecutive year. Urgent.' },
      { year: 2017, topic: 'Grade 9 & 10 Population Geography', gradeLevel: 'Grade 9 & 10', status: 'Needs Revision', feedback: 'Submitted, but lacks activity for data analysis.' }
    ]
  },
  {
    teacherName: 'Ato Kebede Mengistu', subject: 'Civics', gradeGroup: '9-10', improvementRate: 88,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Rights & Responsibilities', gradeLevel: 'Grade 9', status: 'Approved', feedback: 'Fostered civic awareness.' },
      { year: 2016, topic: 'Grade 10 Government & Democracy', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Balanced discussions.' },
      { year: 2017, topic: 'Grade 9 & 10 Community Engagement', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Promoted volunteerism.' }
    ]
  },
  {
    teacherName: 'W/ro Atsede Gebre', subject: 'Amharic', gradeGroup: '9-10', improvementRate: 87,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Amharic Reading & Writing', gradeLevel: 'Grade 9', status: 'Approved', feedback: 'Strong foundational skills.' },
      { year: 2016, topic: 'Grade 10 Amharic Grammar & Composition', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Improved student writing.' },
      { year: 2017, topic: 'Grade 9 & 10 Amharic Literature Introduction', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Engaged students with classic stories.' }
    ]
  },
  {
    teacherName: 'Ato Tariku Bekele', subject: 'Sport', gradeGroup: '9-10', improvementRate: 83,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Fitness & Individual Drills', gradeLevel: 'Grade 9', status: 'Approved', feedback: 'Focused on basic physical development.' },
      { year: 2016, topic: 'Grade 10 Team Sports & Cooperation', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Developed teamwork.' },
      { year: 2017, topic: 'Grade 9 & 10 Health & Wellness', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Integrated health education.' }
    ]
  },
  {
    teacherName: 'Ato Jalata Kedir', subject: 'Afaan Oromo', gradeGroup: '9-10', improvementRate: 85,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Afaan Oromo Speaking & Listening', gradeLevel: 'Grade 9', status: 'Approved', feedback: 'Encouraged oral fluency.' },
      { year: 2016, topic: 'Grade 10 Afaan Oromo Cultural Texts', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Promoted cultural understanding.' },
      { year: 2017, topic: 'Grade 9 & 10 Afaan Oromo Writing & Grammar', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Improved written communication.' }
    ]
  },
  {
    teacherName: 'W/ro Eden Wolde', subject: 'IT', gradeGroup: '9-10', improvementRate: 89,
    lessonPlans: [
      { year: 2015, topic: 'Grade 9 Digital Literacy & Internet Safety', gradeLevel: 'Grade 9', status: 'Approved', feedback: 'Essential for modern students.' },
      { year: 2016, topic: 'Grade 10 Basic Computer Programming (Flowcharts)', gradeLevel: 'Grade 10', status: 'Approved', feedback: 'Introduced computational thinking.' },
      { year: 2017, topic: 'Grade 9 & 10 Using Productivity Software (MS Word, Excel)', gradeLevel: 'Grade 9 & 10', status: 'Approved', feedback: 'Practical skills for academic work.' }
    ]
  }
];

async function seed() {
  try {
    await TeacherPerformance.deleteMany({});
    console.log('Cleared existing teacher data');
    const result = await TeacherPerformance.insertMany(teachers);
    console.log(`Seeded ${result.length} teachers successfully`);
    mongoose.disconnect();
  } catch (err) {
    console.error('Seed error:', err);
    mongoose.disconnect();
  }
}

seed();
