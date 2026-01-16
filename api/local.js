require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data store for local testing
const users = [];
const exams = [{
  _id: '1',
  title: 'JavaScript Basics',
  description: 'Test your JavaScript knowledge',
  duration: 30,
  questions: [
    {
      id: 1,
      question: 'What is JavaScript?',
      options: ['A programming language', 'A coffee type', 'A browser', 'An OS'],
      correctAnswer: 0
    },
    {
      id: 2,
      question: 'Which keyword declares a variable?',
      options: ['var', 'int', 'string', 'variable'],
      correctAnswer: 0
    },
    {
      id: 3,
      question: 'What does === operator do?',
      options: ['Assignment', 'Equality', 'Strict equality', 'Comparison'],
      correctAnswer: 2
    }
  ]
}];
const submissions = [];
const interviews = [];

// Helper to find user
const findUser = (username) => users.find(u => u.username === username);

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    if (findUser(username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      _id: String(users.length + 1),
      username,
      password: hashedPassword,
      email,
      role: role || 'student',
      createdAt: new Date()
    };
    
    users.push(newUser);
    
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, role: newUser.role },
      'secret_key_123',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = findUser(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      'secret_key_123',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/exams', (req, res) => {
  res.json(exams);
});

app.get('/api/exams/:id', (req, res) => {
  const exam = exams.find(e => e._id === req.params.id);
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found' });
  }
  res.json(exam);
});

app.post('/api/submissions', (req, res) => {
  try {
    const { examId, userId, answers, score } = req.body;
    
    const submission = {
      _id: String(submissions.length + 1),
      examId,
      userId,
      answers,
      score,
      submittedAt: new Date()
    };
    
    submissions.push(submission);
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting exam' });
  }
});

app.get('/api/submissions/user/:userId', (req, res) => {
  const userSubmissions = submissions.filter(s => s.userId === req.params.userId);
  res.json(userSubmissions);
});

app.post('/api/interviews', (req, res) => {
  try {
    const { userId, position, questions, responses } = req.body;
    
    const interview = {
      _id: String(interviews.length + 1),
      userId,
      position,
      questions,
      responses,
      score: 0,
      feedback: 'Interview recorded successfully',
      createdAt: new Date()
    };
    
    interviews.push(interview);
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Error saving interview' });
  }
});

app.get('/api/interviews/user/:userId', (req, res) => {
  const userInterviews = interviews.filter(i => i.userId === req.params.userId);
  res.json(userInterviews);
});

// Admin routes
app.post('/api/admin/exams', (req, res) => {
  try {
    const newExam = {
      _id: String(exams.length + 1),
      ...req.body,
      createdAt: new Date()
    };
    exams.push(newExam);
    res.json(newExam);
  } catch (error) {
    res.status(500).json({ message: 'Error creating exam' });
  }
});

app.delete('/api/admin/exams/:id', (req, res) => {
  const index = exams.findIndex(e => e._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Exam not found' });
  }
  exams.splice(index, 1);
  res.json({ message: 'Exam deleted' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Local server running on port ${PORT}`);
  console.log(`📝 Test with: http://localhost:${PORT}/api/exams`);
  console.log(`👤 Default admin: username=admin, password=admin123`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
});
