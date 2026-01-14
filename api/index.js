require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB Atlas connection (free tier)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://testuser:testpass123@cluster0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;
  
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('assessment');
  cachedDb = db;
  
  // Seed if empty
  const count = await db.collection('exams').countDocuments();
  if (count === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.collection('users').insertOne({
      username: 'admin',
      email: 'admin@assessment.com',
      password: hashedPassword,
      role: 'admin',
      created_at: new Date()
    });
    
    const questions = [
      { question_text: 'What is JavaScript?', option_a: 'A programming language', option_b: 'A database', option_c: 'An operating system', option_d: 'A web browser', correct_answer: 'a', marks: 1 },
      { question_text: 'What does DOM stand for?', option_a: 'Document Object Model', option_b: 'Data Object Manager', option_c: 'Digital Operations Module', option_d: 'Dynamic Output Method', correct_answer: 'a', marks: 1 },
      { question_text: 'Which keyword is used to declare a variable?', option_a: 'var, let, const', option_b: 'variable', option_c: 'string', option_d: 'int', correct_answer: 'a', marks: 1 },
      { question_text: 'What is the result of typeof null?', option_a: 'object', option_b: 'null', option_c: 'undefined', option_d: 'boolean', correct_answer: 'a', marks: 1 },
      { question_text: 'What does === mean in JavaScript?', option_a: 'Strict equality comparison', option_b: 'Assignment', option_c: 'Greater than', option_d: 'Less than', correct_answer: 'a', marks: 1 },
      { question_text: 'What is a closure?', option_a: 'A function with access to outer scope', option_b: 'A loop', option_c: 'A data type', option_d: 'An error handler', correct_answer: 'a', marks: 1 },
      { question_text: 'What is async/await?', option_a: 'Handle asynchronous operations', option_b: 'Create loops', option_c: 'Declare variables', option_d: 'Define classes', correct_answer: 'a', marks: 1 },
      { question_text: 'What is JSON?', option_a: 'JavaScript Object Notation', option_b: 'Java Secure Network', option_c: 'JavaScript Output Node', option_d: 'Java Standard Name', correct_answer: 'a', marks: 1 },
      { question_text: 'What is an arrow function?', option_a: 'A shorter syntax for functions', option_b: 'A loop statement', option_c: 'A data type', option_d: 'A variable declaration', correct_answer: 'a', marks: 1 },
      { question_text: 'What is map()?', option_a: 'Transform array elements', option_b: 'Create variables', option_c: 'Handle errors', option_d: 'Define classes', correct_answer: 'a', marks: 1 }
    ];
    
    await db.collection('exams').insertOne({
      title: 'JavaScript Basics',
      description: 'Test your JavaScript knowledge',
      duration: 30,
      total_marks: 10,
      questions: questions,
      created_at: new Date()
    });
    console.log('✅ Database seeded');
  }
  
  return db;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Auth middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const db = await connectDB();
    const { username, email, password, role } = req.body;
    
    const existing = await db.collection('users').findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      username, email, password: hashedPassword, role: role || 'student', created_at: new Date()
    });

    const token = jwt.sign(
      { id: result.insertedId.toString(), username, role: role || 'student' },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registered successfully',
      token,
      user: { id: result.insertedId.toString(), username, email, role: role || 'student' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const db = await connectDB();
    const { email, password } = req.body;
    
    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// EXAM ROUTES
app.get('/api/exams', async (req, res) => {
  try {
    const db = await connectDB();
    const exams = await db.collection('exams').find({}).sort({ created_at: -1 }).toArray();
    res.json(exams.map(e => ({
      id: e._id.toString(),
      _id: e._id.toString(),
      title: e.title,
      description: e.description,
      duration: e.duration,
      total_marks: e.total_marks
    })));
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/exams/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const exam = await db.collection('exams').findOne({ _id: new ObjectId(req.params.id) });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const questions = exam.questions.map((q, i) => ({
      id: i + 1,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      marks: q.marks
    }));

    res.json({
      id: exam._id.toString(),
      _id: exam._id.toString(),
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      total_marks: exam.total_marks,
      questions
    });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/exams/:id/submit', async (req, res) => {
  try {
    const db = await connectDB();
    const { answers, userId } = req.body;
    
    const exam = await db.collection('exams').findOne({ _id: new ObjectId(req.params.id) });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    let score = 0;
    let totalMarks = 0;
    exam.questions.forEach((q, i) => {
      totalMarks += q.marks;
      if (answers[i + 1] === q.correct_answer) {
        score += q.marks;
      }
    });

    await db.collection('submissions').insertOne({
      user_id: userId || 'guest',
      exam_id: exam._id,
      answers,
      score,
      submitted_at: new Date()
    });

    res.json({
      message: 'Exam submitted successfully',
      score,
      totalMarks,
      percentage: Math.round((score / totalMarks) * 100)
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/exams', async (req, res) => {
  try {
    const db = await connectDB();
    const { title, description, duration, total_marks, questions } = req.body;
    
    const result = await db.collection('exams').insertOne({
      title, description, duration, total_marks, questions, created_at: new Date()
    });
    
    res.status(201).json({ message: 'Exam created', examId: result.insertedId.toString() });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Results & submissions
app.get('/api/submissions/me', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const submissions = await db.collection('submissions').find({ user_id: req.user.id }).toArray();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/submissions/all', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const submissions = await db.collection('submissions').find({}).toArray();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Video interviews
app.get('/api/interviews/questions', async (req, res) => {
  const questions = [
    { id: 1, question: 'Tell me about yourself and your experience' },
    { id: 2, question: 'What is your greatest strength?' },
    { id: 3, question: 'Describe a challenging project you worked on' }
  ];
  res.json(questions);
});

app.post('/api/interviews/submit', async (req, res) => {
  try {
    const db = await connectDB();
    const { title, question, video_url, userId } = req.body;
    
    const result = await db.collection('interviews').insertOne({
      user_id: userId || 'guest',
      title,
      question,
      video_url,
      ai_analysis: 'Good communication skills demonstrated',
      score: 85,
      created_at: new Date()
    });
    
    res.json({ message: 'Interview submitted', id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/interviews/me', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const interviews = await db.collection('interviews').find({ user_id: req.user.id }).toArray();
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/interviews/all', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const interviews = await db.collection('interviews').find({}).toArray();
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Export for Vercel
module.exports = app;

// Start server only if not in Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
