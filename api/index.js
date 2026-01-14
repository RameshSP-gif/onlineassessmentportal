require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Database setup
const dbPath = path.join(__dirname, '..', 'assessment.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at:', dbPath);
  }
});

// Initialize database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    marks INTEGER DEFAULT 1,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exam_id INTEGER NOT NULL,
    answers TEXT NOT NULL,
    score INTEGER,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exam_id) REFERENCES exams(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS video_interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    question TEXT NOT NULL,
    video_url TEXT,
    ai_analysis TEXT,
    score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Auto-seed database if empty (for Vercel serverless environment)
  db.get('SELECT COUNT(*) as count FROM users', async (err, result) => {
    if (!err && result.count === 0) {
      console.log('🌱 Database is empty. Auto-seeding...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@assessment.com', hashedPassword, 'admin'],
        function(err) {
          if (err) {
            console.error('❌ Error creating admin:', err);
            return;
          }
          console.log('✅ Admin user created');
          
          // Create sample exam
          db.run('INSERT INTO exams (title, description, duration, total_marks, created_by) VALUES (?, ?, ?, ?, ?)',
            ['JavaScript Basics', 'Test your JavaScript knowledge', 30, 10, this.lastID],
            function(err) {
              if (err) {
                console.error('❌ Error creating exam:', err);
                return;
              }
              const examId = this.lastID;
              
              // Add sample questions
              const questions = [
                ['What is JavaScript?', 'A programming language', 'A database', 'An operating system', 'A web browser', 'a', 1],
                ['What does DOM stand for?', 'Document Object Model', 'Data Object Manager', 'Digital Operations Module', 'Dynamic Output Method', 'a', 1],
                ['Which keyword is used to declare a variable?', 'var, let, const', 'variable', 'string', 'int', 'a', 1],
                ['What is the result of typeof null?', 'object', 'null', 'undefined', 'boolean', 'a', 1],
                ['What does === mean in JavaScript?', 'Strict equality comparison', 'Assignment', 'Greater than', 'Less than', 'a', 1],
                ['What is a closure in JavaScript?', 'A function with access to outer scope', 'A loop', 'A data type', 'An error handler', 'a', 1],
                ['What is the purpose of async/await?', 'Handle asynchronous operations', 'Create loops', 'Declare variables', 'Define classes', 'a', 1],
                ['What is JSON?', 'JavaScript Object Notation', 'Java Secure Object Network', 'JavaScript Output Node', 'Java Standard Object Name', 'a', 1],
                ['What is an arrow function?', 'A shorter syntax for functions', 'A loop statement', 'A data type', 'A variable declaration', 'a', 1],
                ['What is the purpose of map()?', 'Transform array elements', 'Create variables', 'Handle errors', 'Define classes', 'a', 1]
              ];
              
              const stmt = db.prepare('INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
              questions.forEach(q => {
                stmt.run([examId, q[0], q[1], q[2], q[3], q[4], q[5], q[6]]);
              });
              stmt.finalize(() => {
                console.log('✅ Sample exam and questions created');
              });
            }
          );
        }
      );
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'student';

    db.run(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, userRole],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Server error' });
        }

        const token = jwt.sign(
          { id: this.lastID, username, role: userRole },
          process.env.JWT_SECRET || 'your_jwt_secret_key',
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, username, email, role: userRole }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// EXAM ROUTES
app.get('/api/exams', (req, res) => {
  db.all('SELECT * FROM exams ORDER BY created_at DESC', [], (err, exams) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(exams);
  });
});

app.get('/api/exams/:id', (req, res) => {
  const examId = req.params.id;
  db.get('SELECT * FROM exams WHERE id = ?', [examId], (err, exam) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    db.all('SELECT id, exam_id, question_text, option_a, option_b, option_c, option_d, marks FROM questions WHERE exam_id = ?', 
      [examId], (err, questions) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ ...exam, questions });
    });
  });
});

app.post('/api/exams', (req, res) => {
  const { title, description, duration, total_marks, questions } = req.body;
  if (!title || !duration || !total_marks || !questions || questions.length === 0) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.run(
    'INSERT INTO exams (title, description, duration, total_marks, created_by) VALUES (?, ?, ?, ?, ?)',
    [title, description, duration, total_marks, 1],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });

      const examId = this.lastID;
      const stmt = db.prepare(
        'INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );

      questions.forEach(q => {
        stmt.run([examId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.marks || 1]);
      });
      stmt.finalize();

      res.status(201).json({ message: 'Exam created successfully', examId });
    }
  );
});

app.post('/api/exams/:id/submit', (req, res) => {
  const examId = req.params.id;
  const { answers, userId } = req.body;
  if (!answers) return res.status(400).json({ error: 'Answers are required' });

  db.all('SELECT id, correct_answer, marks FROM questions WHERE exam_id = ?', [examId], (err, questions) => {
    if (err) {
      console.error('Error fetching questions:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this exam' });
    }

    let score = 0;
    let totalMarks = 0;
    questions.forEach(q => {
      totalMarks += q.marks;
      if (answers[q.id] === q.correct_answer) {
        score += q.marks;
      }
    });

    // Store submission with or without userId
    const submissionUserId = userId || 1; // Default to 1 if no userId provided
    db.run(
      'INSERT INTO submissions (user_id, exam_id, answers, score) VALUES (?, ?, ?, ?)',
      [submissionUserId, examId, JSON.stringify(answers), score],
      function(err) {
        if (err) {
          console.error('Error saving submission:', err);
          return res.status(500).json({ error: 'Failed to save submission' });
        }
        console.log('Submission saved successfully:', this.lastID);
        res.json({ 
          message: 'Exam submitted successfully', 
          score, 
          totalMarks,
          percentage: Math.round((score / totalMarks) * 100),
          submissionId: this.lastID 
        });
      }
    );
  });
});

app.get('/api/submissions/me', auth, (req, res) => {
  db.all(
    `SELECT s.*, e.title, e.total_marks FROM submissions s 
     JOIN exams e ON s.exam_id = e.id WHERE s.user_id = ? ORDER BY s.submitted_at DESC`,
    [req.user.id],
    (err, submissions) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json(submissions);
    }
  );
});

app.get('/api/submissions/all', auth, isAdmin, (req, res) => {
  db.all(
    `SELECT s.*, e.title, e.total_marks, u.username, u.email FROM submissions s 
     JOIN exams e ON s.exam_id = e.id JOIN users u ON s.user_id = u.id ORDER BY s.submitted_at DESC`,
    [],
    (err, submissions) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json(submissions);
    }
  );
});

// INTERVIEW ROUTES
app.get('/api/interviews/questions', auth, (req, res) => {
  const questions = [
    { id: 1, question: 'Tell us about yourself and your background.' },
    { id: 2, question: 'What are your strengths and weaknesses?' },
    { id: 3, question: 'Describe a challenging project you worked on.' },
    { id: 4, question: 'Where do you see yourself in 5 years?' },
    { id: 5, question: 'Why should we hire you?' }
  ];
  res.json(questions);
});

app.post('/api/interviews/submit', auth, (req, res) => {
  const { title, question, videoData } = req.body;
  if (!title || !question) {
    return res.status(400).json({ error: 'Title and question are required' });
  }

  const aiAnalysis = {
    confidence: Math.floor(Math.random() * 30) + 70,
    clarity: Math.floor(Math.random() * 30) + 70,
    relevance: Math.floor(Math.random() * 30) + 70,
    communication: Math.floor(Math.random() * 30) + 70,
    feedback: 'Good response with clear communication. Shows confidence and relevant experience.'
  };

  const score = Math.floor((aiAnalysis.confidence + aiAnalysis.clarity + aiAnalysis.relevance + aiAnalysis.communication) / 4);

  db.run(
    'INSERT INTO video_interviews (user_id, title, question, video_url, ai_analysis, score) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, title, question, 'recorded', JSON.stringify(aiAnalysis), score],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.status(201).json({ message: 'Interview submitted successfully', interviewId: this.lastID, analysis: aiAnalysis, score });
    }
  );
});

app.get('/api/interviews/me', auth, (req, res) => {
  db.all(
    'SELECT * FROM video_interviews WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, interviews) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      const parsed = interviews.map(i => ({ ...i, ai_analysis: JSON.parse(i.ai_analysis) }));
      res.json(parsed);
    }
  );
});

app.get('/api/interviews/all', auth, isAdmin, (req, res) => {
  db.all(
    `SELECT vi.*, u.username, u.email FROM video_interviews vi 
     JOIN users u ON vi.user_id = u.id ORDER BY vi.created_at DESC`,
    [],
    (err, interviews) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      const parsed = interviews.map(i => ({ ...i, ai_analysis: JSON.parse(i.ai_analysis) }));
      res.json(parsed);
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server (for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
