# School Longitudinal Inspection System

A comprehensive web-based system for analyzing student performance data across multiple years, detecting at-risk students, and generating actionable insights for educational improvement.

## Features

- **Multi-Year Data Analysis**: Import and analyze student data from Excel files (2015-2017)
- **Advanced Filtering**: Filter by year, grade level, subject, gender, and semester
- **Red Flag Detection**: Automatically identify students with failing grades (below 50%)
- **Performance Predictions**: Predict future year performance using linear regression
- **Insights & Recommendations**: Generate priority-based recommendations for improvement
- **Infrastructure Analysis**: Analyze impact of school facilities on student performance
- **PDF Report Generation**: Export comprehensive reports with charts and statistics
- **Role-Based Access Control**: Separate permissions for Admin and Inspector roles
- **Audit Logging**: Track all system activities for accountability

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: JWT (JSON Web Tokens)
- **PDF Generation**: PDFKit
- **Excel Processing**: xlsx package

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/school-inspection-system.git
cd school-inspection-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Seed the admin user:
```bash
node seedAdmin.js
```

5. Import student data:
```bash
node importStudents.js 2015.xlsx
node importStudents.js 2016.xlsx
node importStudents.js 2017.xlsx
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Login with default admin credentials:
- Username: `admin`
- Password: `admin123`

## User Roles

### Admin
- Import/update/delete student data
- Manage users
- View audit logs
- Access all analytics and reports
- Validate predictions

### Inspector
- View all analytics and reports
- Generate PDF reports
- Cannot modify data or manage users

## Data Structure

The system analyzes 11 subjects:
- Amharic
- English
- Mathematics
- Physics
- Chemistry
- Biology
- Geography
- History
- Civics
- ICT
- H.P.E (Health & Physical Education)

Each student record includes:
- Semester 1 grades
- Semester 2 grades
- Yearly average
- Grade level (9-12)
- Gender
- Academic year

## Key Metrics

- **Average Performance**: Overall student performance percentage
- **Pass Rate**: Percentage of students passing all subjects
- **Red Flags**: Students with any subject below 50% or overall average below 50%
- **Subject Performance**: Average performance per subject
- **Infrastructure Impact**: Facility quality scores and recommendations

## Documentation

- `SYSTEM_DOCUMENTATION.pdf` - Complete system documentation
- `UNDERSTANDING_PERCENTAGES.pdf` - Explanation of all metrics and percentages
- `QUICK_REFERENCE_GUIDE.pdf` - Quick start guide for users

## Deployment

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Deploy!

### Deploy to Heroku

1. Install Heroku CLI
2. Login and create app:
```bash
heroku login
heroku create your-app-name
```

3. Set environment variables:
```bash
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
```

4. Deploy:
```bash
git push heroku main
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Analysis
- `GET /api/analysis/trends` - Get performance trends with filters
- `GET /api/analysis/red-flags` - Get at-risk students
- `GET /api/analysis/suggestions` - Get insights and recommendations
- `GET /api/analysis/predictions/2018` - Get 2018 predictions
- `GET /api/analysis/infrastructure` - Get infrastructure analysis

### Reports
- `POST /api/reports/generate` - Generate PDF report

### Students (Admin only)
- `GET /api/students` - Get all students
- `POST /api/students` - Add new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Audit (Admin only)
- `GET /api/audit/logs` - Get audit logs
- `GET /api/audit/export` - Export audit logs

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- MongoDB injection prevention
- Audit logging for all sensitive operations

## Performance Optimization

- Database indexing on frequently queried fields
- Lean queries for faster data retrieval
- Efficient filtering algorithms
- Caching of static resources

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@example.com or open an issue in the GitHub repository.

## Acknowledgments

- Built for educational institutions to improve student outcomes
- Designed for non-technical users (school administrators, education officers)
- Focuses on actionable insights and early intervention
