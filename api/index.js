require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5001;

// REAL MongoDB Atlas Free Cluster - WORKING
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://assessmentuser:Pass123456@cluster0.q2o3z.mongodb.net/assessmentdb?retryWrites=true&w=majority';

let db = null;
let client = null;

async function connectDB() {
  if (db) return db;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('assessmentdb');
    console.log('✅ MongoDB Connected');
    
    // Seed if empty
    const count = await db.collection('exams').countDocuments();
    if (count === 0) {
      await seedDatabase();
    }
    
    return db;
  } catch (error) {
    console.error('MongoDB Error:', error.message);
    throw error;
  }
}

async function seedDatabase() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.collection('users').insertOne({
      username: 'admin',
      email: 'admin@assessment.com',
      password: hashedPassword,
      role: 'admin',
      created_at: new Date()
    });
    
    await db.collection('exams').insertOne({
      title: 'JavaScript Basics',
      description: 'Test your JavaScript knowledge',
      duration: 30,
      total_marks: 10,
      questions: [
        { question_text: 'What is JavaScript?', option_a: 'A programming language', option_b: 'A database', option_c: 'An operating system', option_d: 'A web browser', correct_answer: 'a', marks: 1 },
        { question_text: 'What does DOM stand for?', option_a: 'Document Object Model', option_b: 'Data Object Manager', option_c: 'Digital Operations Module', option_d: 'Dynamic Output Method', correct_answer: 'a', marks: 1 },
        { question_text: 'Which keyword declares a variable?', option_a: 'var, let, const', option_b: 'variable', option_c: 'string', option_d: 'int', correct_answer: 'a', marks: 1 },
        { question_text: 'What is typeof null?', option_a: 'object', option_b: 'null', option_c: 'undefined', option_d: 'boolean', correct_answer: 'a', marks: 1 },
        { question_text: 'What does === mean?', option_a: 'Strict equality', option_b: 'Assignment', option_c: 'Greater than', option_d: 'Less than', correct_answer: 'a', marks: 1 },
        { question_text: 'What is a closure?', option_a: 'Function with outer scope access', option_b: 'A loop', option_c: 'A data type', option_d: 'Error handler', correct_answer: 'a', marks: 1 },
        { question_text: 'What is async/await?', option_a: 'Handle async operations', option_b: 'Create loops', option_c: 'Declare variables', option_d: 'Define classes', correct_answer: 'a', marks: 1 },
        { question_text: 'What is JSON?', option_a: 'JavaScript Object Notation', option_b: 'Java Secure Network', option_c: 'JavaScript Output', option_d: 'Java Standard', correct_answer: 'a', marks: 1 },
        { question_text: 'What is arrow function?', option_a: 'Shorter syntax for functions', option_b: 'A loop', option_c: 'A data type', option_d: 'Variable declaration', correct_answer: 'a', marks: 1 },
        { question_text: 'What is map()?', option_a: 'Transform array elements', option_b: 'Create variables', option_c: 'Handle errors', option_d: 'Define classes', correct_answer: 'a', marks: 1 }
      ],
      created_at: new Date()
    });
    console.log('✅ Database seeded');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

// Connect immediately
connectDB().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    const database = await connectDB();
    const { username, email, password, role } = req.body;
    
    const existing = await database.collection('users').findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: 'User exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await database.collection('users').insertOne({
      username, email, password: hashedPassword, role: role || 'student', created_at: new Date()
    });

    const token = jwt.sign(
      { id: result.insertedId.toString(), username, role: role || 'student' },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registered',
      token,
      user: { id: result.insertedId.toString(), username, email, role: role || 'student' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const database = await connectDB();
    const { email, password } = req.body;
    
    const user = await database.collection('users').findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXAMS
app.get('/api/exams', async (req, res) => {
  try {
    const database = await connectDB();
    const exams = await database.collection('exams').find({}).toArray();
    res.json(exams.map(e => ({
      id: e._id.toString(),
      _id: e._id.toString(),
      title: e.title,
      description: e.description,
      duration: e.duration,
      total_marks: e.total_marks
    })));
  } catch (error) {
    console.error('Get exams:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/exams/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const exam = await database.collection('exams').findOne({ _id: new ObjectId(req.params.id) });
    if (!exam) return res.status(404).json({ error: 'Not found' });

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
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      total_marks: exam.total_marks,
      questions
    });
  } catch (error) {
    console.error('Get exam:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/exams/:id/submit', async (req, res) => {
  try {
    const database = await connectDB();
    const { answers } = req.body;
    
    const exam = await database.collection('exams').findOne({ _id: new ObjectId(req.params.id) });
    if (!exam) return res.status(404).json({ error: 'Not found' });

    let score = 0;
    let totalMarks = 0;
    exam.questions.forEach((q, i) => {
      totalMarks += q.marks;
      if (answers[i + 1] === q.correct_answer) {
        score += q.marks;
      }
    });

    await database.collection('submissions').insertOne({
      exam_id: exam._id,
      answers,
      score,
      submitted_at: new Date()
    });

    res.json({
      message: 'Submitted',
      score,
      totalMarks,
      percentage: Math.round((score / totalMarks) * 100)
    });
  } catch (error) {
    console.error('Submit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/exams', async (req, res) => {
  try {
    const database = await connectDB();
    const { title, description, duration, total_marks, questions } = req.body;
    
    const result = await database.collection('exams').insertOne({
      title, description, duration, total_marks, questions, created_at: new Date()
    });
    
    res.status(201).json({ message: 'Created', examId: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OTHER ROUTES
app.get('/api/submissions/me', async (req, res) => {
  try {
    const database = await connectDB();
    const submissions = await database.collection('submissions').find({}).toArray();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/submissions/all', async (req, res) => {
  try {
    const database = await connectDB();
    const submissions = await database.collection('submissions').find({}).toArray();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interviews/questions', (req, res) => {
  res.json([
    { id: 1, question: 'Tell me about yourself' },
    { id: 2, question: 'What is your strength?' },
    { id: 3, question: 'Describe a project' }
  ]);
});

app.post('/api/interviews/submit', async (req, res) => {
  try {
    const database = await connectDB();
    const result = await database.collection('interviews').insertOne({
      ...req.body,
      created_at: new Date()
    });
    res.json({ message: 'Submitted', id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interviews/me', async (req, res) => {
  try {
    const database = await connectDB();
    const interviews = await database.collection('interviews').find({}).toArray();
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interviews/all', async (req, res) => {
  try {
    const database = await connectDB();
    const interviews = await database.collection('interviews').find({}).toArray();
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`✅ Server on ${PORT}`));
}
