# Admin Module - Complete Guide

## 🎯 Features Implemented

### 1. Admin Dashboard
- **Statistics Cards**: Total Students, Total Exams, Submissions, Revenue
- **Navigation Menu**: Quick access to all admin features
- **Recent Students**: List of newly registered students

### 2. Student Management (`/admin/students`)
- ✅ View all students with details (submissions, fees paid)
- ✅ Edit student information (username, email, status)
- ✅ Delete students
- ✅ Student status management (Active/Suspended/Inactive)

### 3. Exam Management (`/admin/exams`)
- ✅ Create new exams with questions
- ✅ Edit existing exams and questions
- ✅ Delete exams
- ✅ Question editor with multiple options
- ✅ Set marks per question
- ✅ Set exam duration and total marks

### 4. Fee Management (`/admin/fees`)
- ✅ Add fees for students
- ✅ View all fee transactions
- ✅ Update fee status (Pending/Paid/Cancelled)
- ✅ Revenue summary (Total Revenue, Pending Fees)

### 5. Reports & Analytics (`/admin/reports`)
- ✅ Exam performance statistics
- ✅ Student performance analysis
- ✅ Pass rates and average scores
- ✅ Export reports to CSV

### 6. Notifications (`/admin/notifications`)
- ✅ Send notifications to all users
- ✅ Send to all students
- ✅ Send to specific student
- ✅ Custom title and message

### 7. Submissions View (`/admin/submissions`)
- ✅ View all exam submissions
- ✅ See student answers
- ✅ View scores and percentages
- ✅ Filter by exam and student

## 🚀 How to Use

### Register as Admin
1. Go to `/register`
2. Fill in details
3. **Select "Admin" from the Role dropdown**
4. Click Register
5. You'll be redirected to `/admin/dashboard`

### Login as Admin
1. Go to `/login`
2. Enter admin credentials
   - Email: `admin@test.com`
   - Password: `admin123`
3. You'll be automatically redirected to admin dashboard

## 📍 Admin Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/dashboard` | AdminDashboard | Main admin dashboard with stats |
| `/admin/students` | StudentManagement | Manage student accounts |
| `/admin/exams` | ExamManagement | Create, edit, delete exams |
| `/admin/fees` | FeeManagement | Manage fees and payments |
| `/admin/reports` | ReportsPage | View analytics and reports |
| `/admin/notifications` | NotificationsPage | Send notifications |
| `/admin/submissions` | SubmissionsView | View all submissions |

## 🔌 API Endpoints

### Admin Dashboard
```
GET /api/admin/dashboard
```
Returns: stats (totalStudents, totalExams, totalSubmissions, totalRevenue), recentUsers, recentSubmissions

### Student Management
```
GET /api/admin/students - List all students with submissions and fees
PUT /api/admin/students/:id - Update student (username, email, status)
DELETE /api/admin/students/:id - Delete student
```

### Exam Management
```
POST /api/exams - Create new exam
PUT /api/exams/:id - Update exam
DELETE /api/exams/:id - Delete exam
GET /api/exams - List all exams
GET /api/exams/:id - Get exam with questions
```

### Fee Management
```
GET /api/admin/fees - List all fees with student details
POST /api/admin/fees - Add new fee (user_id, amount, description)
PUT /api/admin/fees/:id - Update fee status
```

### Reports
```
GET /api/admin/reports - Get exam and student performance stats
```

### Notifications
```
POST /api/admin/notifications - Send notification (title, message, target)
GET /api/notifications - Get notifications for user (query: user_id, role)
```

## 💾 Database Collections

### users
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: 'admin' | 'student',
  status: 'active' | 'suspended' | 'inactive',
  created_at: Date
}
```

### fees
```javascript
{
  user_id: ObjectId,
  amount: Number,
  description: String,
  status: 'pending' | 'paid' | 'cancelled',
  created_at: Date
}
```

### notifications
```javascript
{
  title: String,
  message: String,
  target: 'all' | 'students' | <user_id>,
  created_at: Date,
  read: Boolean
}
```

## 🎨 UI Features

### AdminDashboard
- 4 stat cards with total counts
- 6 navigation buttons with icons
- Recent students table
- Clean, modern design with inline styles

### Student Management
- Searchable table with all student data
- Edit modal with form
- Status badges (Active=Green, Suspended=Red)
- Delete confirmation

### Exam Management
- Create/Edit form with dynamic question builder
- Add/Remove questions
- All 4 options (A, B, C, D)
- Set correct answer and marks
- Exam cards with metadata

### Fee Management
- Add fee form with student dropdown
- Fee table with status badges
- Mark as Paid/Cancel actions
- Revenue summary cards

### Reports
- Two tables: Exam Performance & Student Performance
- Pass rate calculation with color coding
- Download CSV button
- Performance badges

### Notifications
- Simple form: Title, Message, Target
- Target options: All Users, All Students, Individual Student
- Guidelines and help text

### Submissions View
- Table of all submissions
- View details modal
- Shows all answers
- Score and percentage display

## 🔒 Security Notes

- No authentication middleware implemented yet (trust-based system)
- All admin routes are accessible if user knows the URLs
- Token stored in localStorage
- Consider adding JWT verification middleware for production

## 🛠️ Development

### Start Backend
```bash
cd C:\Per\OnlineAssessmentPortal
node api\index.js
```
Backend runs on http://localhost:5001

### Start Frontend
```bash
cd C:\Per\OnlineAssessmentPortal
npm start
```
Frontend runs on http://localhost:3000

## 📊 Testing

1. **Register Admin User**:
   ```bash
   POST http://localhost:5001/api/auth/register
   {
     "username": "admin",
     "email": "admin@test.com",
     "password": "admin123",
     "role": "admin"
   }
   ```

2. **Login**:
   ```bash
   POST http://localhost:5001/api/auth/login
   {
     "email": "admin@test.com",
     "password": "admin123"
   }
   ```

3. **Test Dashboard**:
   ```bash
   GET http://localhost:5001/api/admin/dashboard
   ```

## 🎉 Complete Feature List

✅ Admin registration with role selection
✅ Admin dashboard with statistics
✅ CRUD operations for students
✅ CRUD operations for exams and questions
✅ Fee management with status tracking
✅ Reports and analytics
✅ Notification system
✅ View all submissions and answers
✅ Role-based redirects (admin → admin dashboard, student → student dashboard)
✅ All components with inline styles (no external CSS needed)
✅ MongoDB Atlas integration
✅ 7 expert-level exams pre-seeded

## 🚦 Next Steps (Optional Enhancements)

- [ ] Add JWT verification middleware for admin routes
- [ ] Add pagination for large tables
- [ ] Add search/filter functionality
- [ ] Add charts for analytics (using Chart.js or Recharts)
- [ ] Add email notifications
- [ ] Add bulk operations (delete multiple students, etc.)
- [ ] Add audit logs
- [ ] Add password reset functionality
- [ ] Add profile picture upload
- [ ] Add dark mode

## 📝 Notes

- All admin components use React functional components with hooks
- Inline styles used for quick development
- No external UI libraries (pure React)
- MongoDB aggregation used for reports
- All timestamps stored as ISO dates
- Error handling with try-catch blocks
- Loading states for all API calls
