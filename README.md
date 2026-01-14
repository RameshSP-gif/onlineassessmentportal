# Online Assessment Portal

A comprehensive full-stack online assessment platform built with React and Express, featuring MCQ exams and AI-powered video interviews.

## Features

### For Students
- **User Authentication**: Secure registration and login system
- **MCQ Exams**: Take multiple-choice exams with timer
- **Video Interviews**: Record video responses with AI-powered analysis
- **Results Dashboard**: View exam scores and interview feedback
- **Real-time Timer**: Auto-submit when time expires

### For Admins
- **Exam Management**: Create and manage MCQ exams
- **Student Monitoring**: View all submissions and scores
- **Interview Analysis**: Review video interview performance
- **Analytics**: Track overall performance metrics

### Technical Features
- JWT-based authentication
- SQLite database for data persistence
- Webcam integration for video interviews
- Simulated AI analysis of interview responses
- Responsive design with modern UI

## Technology Stack

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- Modern CSS with gradient designs

### Backend
- Express.js
- SQLite3 database
- JWT authentication
- Bcrypt for password hashing
- CORS enabled

## Project Structure

```
online-assessment-portal/
├── api/
│   └── index.js                    # Express API (serverless-ready)
├── src/
│   ├── components/
│   │   ├── Login.js               # Login page
│   │   ├── Register.js            # Registration page
│   │   ├── Dashboard.js           # Student dashboard
│   │   ├── ExamList.js            # List of available exams
│   │   ├── TakeExam.js            # Exam taking interface
│   │   ├── Results.js             # View results
│   │   ├── VideoInterview.js      # Video interview component
│   │   ├── AdminDashboard.js      # Admin panel
│   │   └── CreateExam.js          # Create new exam
│   ├── App.js                     # Main app component
│   ├── api.js                     # API service layer
│   └── index.js                   # React entry point
├── public/
│   └── index.html                 # HTML template
├── .env                           # Environment variables
├── package.json                   # Dependencies
├── vercel.json                    # Vercel deployment config
└── README.md                      # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd OnlineAssessmentPortal
   ```

2. **Install dependencies** (already done)
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Edit `.env` file:
   ```env
   PORT=5000
   JWT_SECRET=your_secure_jwt_secret_here
   NODE_ENV=development
   ```

4. **Start the development servers**

   **Option A: Run both servers concurrently**
   ```bash
   npm run dev
   ```

   **Option B: Run separately**
   
   Terminal 1 (Backend):
   ```bash
   npm run server
   ```
   
   Terminal 2 (Frontend):
   ```bash
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Usage Guide

### Creating an Account

1. Navigate to the registration page
2. Choose role: **Student** or **Admin**
3. Fill in username, email, and password
4. Click "Register"

### For Students

**Taking an Exam:**
1. Login and go to Dashboard
2. Click "Take Exam"
3. Select an exam from the list
4. Answer all questions before time expires
5. Submit to see your score

**Video Interview:**
1. Click "Video Interview" from dashboard
2. Allow camera permissions
3. Read the question
4. Click "Start Recording"
5. Answer the question
6. Click "Stop & Submit"
7. View AI analysis and feedback

### For Admins

**Creating an Exam:**
1. Login as admin
2. Go to "Admin Panel"
3. Click "Create New Exam"
4. Fill in exam details (title, duration, description)
5. Add questions with 4 options each
6. Select correct answer for each question
7. Click "Create Exam"

**Viewing Results:**
1. Go to "Admin Dashboard"
2. View all student submissions
3. See scores, percentages, and timestamps
4. Review video interview performances

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Exams
- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get exam by ID with questions
- `POST /api/exams` - Create exam (Admin only)
- `POST /api/exams/:id/submit` - Submit exam answers

### Submissions
- `GET /api/submissions/me` - Get current user's submissions
- `GET /api/submissions/all` - Get all submissions (Admin only)

### Video Interviews
- `GET /api/interviews/questions` - Get interview questions
- `POST /api/interviews/submit` - Submit video interview
- `GET /api/interviews/me` - Get user's interviews
- `GET /api/interviews/all` - Get all interviews (Admin only)

## Database Schema

### Users
- id, username, email, password, role, created_at

### Exams
- id, title, description, duration, total_marks, created_by, created_at

### Questions
- id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks

### Submissions
- id, user_id, exam_id, answers, score, submitted_at

### Video Interviews
- id, user_id, title, question, video_url, ai_analysis, score, created_at

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

The `vercel.json` configuration is already set up for serverless deployment.

### Traditional Hosting

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Serve both API and static files from your server
3. Set up proper environment variables
4. Configure SQLite database path

## Environment Variables

```env
PORT=5000                           # Backend server port
JWT_SECRET=your_secret_key          # JWT signing secret
NODE_ENV=development                # Environment mode
REACT_APP_API_URL=/api             # API URL for frontend (optional)
```

## Features in Detail

### AI-Powered Analysis (Simulated)
The video interview feature includes simulated AI analysis that evaluates:
- **Confidence**: Body language and tone
- **Clarity**: Speech clarity and articulation
- **Relevance**: Answer relevance to question
- **Communication**: Overall communication skills

Each metric is scored 0-100, with personalized feedback.

### Exam Timer
- Real-time countdown timer
- Auto-submit when time expires
- Visual warning when time is running low

### Security
- Password hashing with bcrypt
- JWT token authentication
- Protected routes
- Role-based access control

## Troubleshooting

### Camera not working
- Ensure you've granted camera permissions
- Try using HTTPS (required for camera access in production)
- Check browser compatibility

### Database issues
- Database file is created automatically
- Located at: `./assessment.db`
- Delete and restart to reset

### Port already in use
- Change PORT in `.env` file
- Or stop other services using ports 3000/5000

## Future Enhancements

- Real video upload and storage
- Actual AI/ML integration for interview analysis
- Email notifications
- Export results to PDF
- More question types (true/false, essay)
- Exam scheduling
- Time-limited exam availability

## License

MIT License - Feel free to use for educational purposes

## Support

For issues or questions:
1. Check this README
2. Review the code comments
3. Test with sample data

---

**Happy Assessment! 🎓**
