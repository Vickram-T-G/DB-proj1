# Attendance Management System - Backend

A secure and scalable Node.js backend for managing student attendance with role-based access control, email notifications, and comprehensive API endpoints.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Student, teacher, and admin roles with profile management
- **Course Management**: Create, update, and manage courses with student enrollment
- **Attendance Tracking**: Mark, view, and manage attendance records with statistics
- **Email Notifications**: Automated reminders and notifications system
- **Security**: Password hashing, rate limiting, input validation, and CORS protection
- **Database**: MongoDB with Mongoose ODM for data persistence

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **Validation**: express-validator
- **Security**: Helmet, express-rate-limit

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Installation

1. **Clone the repository and navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/attendance_db
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_SERVICE=gmail
   NODE_ENV=development
   ```

4. **Database Setup**

   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in `.env` file
   - The database and collections will be created automatically

5. **Email Configuration (Optional)**
   - For Gmail: Enable 2-factor authentication and generate an app password
   - Update `EMAIL_USER` and `EMAIL_PASS` in `.env` file
   - For other providers, update `EMAIL_SERVICE` accordingly

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Users (Admin Only)

- `GET /api/users` - Get all users with pagination
- `GET /api/users/students` - Get all students for enrollment
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/bulk-create` - Bulk create users

### Courses

- `POST /api/courses` - Create a new course (Teachers & Admins)
- `GET /api/courses` - Get courses (filtered by user role)
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course (Course Instructor or Admin)
- `POST /api/courses/:id/enroll` - Enroll students in course
- `DELETE /api/courses/:id/enroll/:studentId` - Remove student from course
- `GET /api/courses/:id/students` - Get course students

### Attendance

- `POST /api/attendance/:courseId` - Mark attendance for a course
- `GET /api/attendance/:courseId` - Get attendance records for a course
- `GET /api/attendance/:courseId/:date` - Get attendance for a specific date
- `PUT /api/attendance/:courseId/:date` - Update attendance for a specific date
- `POST /api/attendance/:courseId/:date/lock` - Lock attendance for a specific date
- `GET /api/attendance/:courseId/stats` - Get attendance statistics

### Email Notifications

- `POST /api/email/attendance-reminder` - Send attendance reminder to teachers
- `POST /api/email/bulk-reminder` - Send bulk attendance reminders
- `POST /api/email/student-notification` - Send notifications to students
- `POST /api/email/test` - Send test email

## User Roles

### Student

- View enrolled courses
- View personal attendance records and statistics
- Update profile settings

### Teacher

- Create and manage courses
- Enroll/remove students
- Mark and update attendance
- View course statistics
- Send notifications to students

### Admin

- All teacher permissions
- Manage all users
- Access all courses and attendance data
- Send bulk email reminders
- System-wide management

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user roles
- **Input Validation**: All inputs are validated using express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers for Express.js
- **Environment Variables**: Sensitive data stored in environment variables

## Database Schema

### User

- Basic info (name, email, password)
- Role (student, teacher, admin)
- Student ID (for students)
- Email notification preferences
- Account status

### Course

- Course details (name, code, description)
- Instructor reference
- Student enrollment list
- Schedule information
- Academic year and semester

### Attendance

- Course and date references
- Individual student attendance records
- Attendance status (present, absent, late, excused)
- Locking mechanism for data integrity
- Statistics tracking

## Error Handling

The API includes comprehensive error handling:

- Validation errors with detailed messages
- Authentication and authorization errors
- Database operation errors
- Email sending errors
- Proper HTTP status codes

## Development

### Project Structure

```
backend/
├── models/          # Database models
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── server.js        # Main server file
├── package.json     # Dependencies
└── .env            # Environment variables
```

### Adding New Features

1. Create models in `models/` directory
2. Add routes in `routes/` directory
3. Update `server.js` to include new routes
4. Add appropriate middleware for authentication/authorization
5. Test thoroughly with different user roles

## Production Deployment

1. **Environment Variables**: Update all environment variables for production
2. **Database**: Use a production MongoDB instance
3. **Email**: Configure production email service
4. **Security**: Change JWT secret and other sensitive values
5. **Process Manager**: Use PM2 or similar for process management
6. **Reverse Proxy**: Use Nginx or Apache as reverse proxy
7. **SSL**: Enable HTTPS with SSL certificates

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Test with different user roles
5. Update documentation if needed

## License

This project is licensed under the ISC License.
