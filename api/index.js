require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/payment-proofs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF) and PDF files are allowed!'));
    }
  }
});

const app = express();
const PORT = process.env.PORT || 5005;

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:Rakshita%401234@cluster0.pp8rwbt.mongodb.net/assessmentdb?retryWrites=true&w=majority';

let db = null;
let isConnecting = false;
let connectionPromise = null;

// MongoDB Schema Models for Interviewers
const InterviewerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  specialization: { type: String }, // e.g., "Java", "Python", "MERN"
  experience: { type: Number }, // years of experience
  bio: { type: String },
  rating: { type: Number, default: 0 },
  totalInterviews: { type: Number, default: 0 },
  availability: [{
    day: String,
    timeSlots: [{ start: String, end: String }]
  }],
  isAvailable: { type: Boolean, default: true },
  role: { type: String, default: 'interviewer' },
  created_at: { type: Date, default: Date.now }
});

// Interview Request Schema - Student requests, HR approves
const InterviewRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  interviewType: { 
    type: String, 
    enum: ['human', 'ai'],
    required: true 
  },
  interviewMode: { 
    type: String, 
    enum: ['online', 'f2f', 'n/a'],
    default: 'online'
  },
  specialization: { type: String, required: true },
  proposedDates: [{
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // e.g., "10:00 AM - 11:00 AM"
    isAvailable: { type: Boolean, default: true }
  }],
  preferredLanguage: { type: String, default: 'English' },
  additionalNotes: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled'],
    default: 'pending' 
  },
  hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hrComments: { type: String },
  assignedInterviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interviewer' },
  scheduledDate: { type: Date },
  scheduledTimeSlot: { type: String },
  meetingLink: { type: String },
  location: { type: String }, // For F2F interviews
  rejectionReason: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const InterviewSessionSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRequest', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interviewer' },
  interviewType: { 
    type: String, 
    enum: ['human', 'ai'],
    required: true 
  },
  interviewMode: { 
    type: String, 
    enum: ['online', 'f2f'],
    default: 'online'
  },
  scheduledAt: { type: Date, required: true },
  startedAt: { type: Date },
  endedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled' 
  },
  videoRecordingUrl: { type: String },
  recordingChunks: [{ type: String }],
  transcript: { type: String },
  aiEvaluation: {
    technicalScore: { type: Number },
    communicationScore: { type: Number },
    problemSolvingScore: { type: Number },
    overallScore: { type: Number },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    feedback: { type: String },
    recommendation: { type: String },
    detailedAnalysis: { type: String }
  },
  interviewerFeedback: { type: String },
  duration: { type: Number },
  meetingLink: { type: String },
  location: { type: String },
  created_at: { type: Date, default: Date.now }
});

// HR/Admin Schema
const HRSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  department: { type: String, default: 'Human Resources' },
  role: { type: String, default: 'hr' },
  created_at: { type: Date, default: Date.now }
});

// Role Schema for dynamic role management
const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: { type: String },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Interviewer = mongoose.model('Interviewer', InterviewerSchema);
const InterviewRequest = mongoose.model('InterviewRequest', InterviewRequestSchema);
const InterviewSession = mongoose.model('InterviewSession', InterviewSessionSchema);
const HR = mongoose.model('HR', HRSchema);
const Role = mongoose.model('Role', RoleSchema);

async function connectDB() {
  // Return existing connection
  if (db && mongoose.connection.readyState === 1) {
    return db;
  }
  
  // Wait for ongoing connection attempt
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }
  
  // Start new connection
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      console.log('🔄 Connecting to MongoDB Atlas...');
      console.log('📍 Cluster: cluster0.pp8rwbt.mongodb.net');
      
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI, {
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          minPoolSize: 2,
        });
      }
      
      db = mongoose.connection.db;
      
      if (!db) {
        throw new Error('Database connection failed - db is null');
      }
      
      console.log('✅ MongoDB Atlas Connected Successfully!');
      
      // Seed if empty (only in development or first run)
      if (process.env.NODE_ENV !== 'production') {
        try {
          const count = await db.collection('exams').countDocuments();
          console.log(`📊 Found ${count} exams in database`);
          if (count === 0) {
            console.log('🌱 Seeding database...');
            await seedDatabase();
          }
        } catch (seedError) {
          console.error('Seed check error:', seedError.message);
        }
      }
      
      isConnecting = false;
      return db;
    } catch (error) {
      isConnecting = false;
      connectionPromise = null;
      db = null;
      
      console.error('\n❌ MongoDB Atlas Connection FAILED!\n');
      console.error('Error:', error.message);
      console.error('\n🔧 SOLUTION - Whitelist your IP in MongoDB Atlas:');
      console.error('1. Go to: https://cloud.mongodb.com');
      console.error('2. Click: Network Access (left sidebar)');
      console.error('3. Click: Add IP Address');
      console.error('4. Select: Allow Access from Anywhere (0.0.0.0/0)');
      console.error('5. Click: Confirm\n');
      throw error;
    }
  })();
  
  return connectionPromise;
}

async function seedDatabase() {
  try {
    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('exams').deleteMany({});
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.collection('users').insertOne({
      username: 'admin',
      email: 'admin@assessment.com',
      password: hashedPassword,
      role: 'admin',
      created_at: new Date()
    });
    
    // MERN Fullstack Exam
    await db.collection('exams').insertOne({
      title: 'MERN Fullstack Developer',
      description: 'Advanced MERN Stack - Extremely Difficult',
      duration: 45,
      total_marks: 15,
      questions: [
        { question_text: 'In React, what happens if you call setState() during render()?', option_a: 'Infinite loop and React crashes', option_b: 'setState is batched and applied after render', option_c: 'Component re-renders immediately', option_d: 'setState is ignored', correct_answer: 'a', marks: 1 },
        { question_text: 'What is the output of: console.log(typeof null === typeof undefined)?', option_a: 'false', option_b: 'true', option_c: 'undefined', option_d: 'TypeError', correct_answer: 'a', marks: 1 },
        { question_text: 'Which MongoDB aggregation stage comes FIRST for optimal performance?', option_a: '$match', option_b: '$project', option_c: '$sort', option_d: '$group', correct_answer: 'a', marks: 1 },
        { question_text: 'In Express middleware, calling next() multiple times will:', option_a: 'Throw "Cannot set headers after they are sent"', option_b: 'Execute next middleware multiple times', option_c: 'Do nothing after first call', option_d: 'Reset the middleware chain', correct_answer: 'a', marks: 1 },
        { question_text: 'React.memo() does shallow comparison. How to do deep comparison?', option_a: 'Pass custom comparison function as second argument', option_b: 'Use useMemo instead', option_c: 'Use PureComponent', option_d: 'Not possible', correct_answer: 'a', marks: 1 },
        { question_text: 'What is the default transaction isolation level in MongoDB?', option_a: 'Snapshot isolation', option_b: 'Read committed', option_c: 'Serializable', option_d: 'Read uncommitted', correct_answer: 'a', marks: 1 },
        { question_text: 'Node.js event loop: Which phase executes setImmediate() callbacks?', option_a: 'Check phase', option_b: 'Poll phase', option_c: 'Timer phase', option_d: 'Pending callbacks', correct_answer: 'a', marks: 1 },
        { question_text: 'In React Suspense, what does fallback render during?', option_a: 'Component lazy loading or data fetching', option_b: 'Component error', option_c: 'Component mounting', option_d: 'Component unmounting', correct_answer: 'a', marks: 1 },
        { question_text: 'Express res.json() vs res.send() - main difference?', option_a: 'res.json() always sets Content-Type to application/json', option_b: 'No difference', option_c: 'res.send() is faster', option_d: 'res.json() stringifies automatically', correct_answer: 'a', marks: 2 },
        { question_text: 'MongoDB: What index type for geo-spatial queries?', option_a: '2dsphere or 2d index', option_b: 'Text index', option_c: 'Compound index', option_d: 'Hashed index', correct_answer: 'a', marks: 2 },
        { question_text: 'React useEffect cleanup function runs:', option_a: 'Before next effect and on unmount', option_b: 'Only on unmount', option_c: 'After every render', option_d: 'Never if component stays mounted', correct_answer: 'a', marks: 1 },
        { question_text: 'Node.js cluster module: How are connections distributed?', option_a: 'Round-robin by default on most platforms', option_b: 'Random distribution', option_c: 'Least connections first', option_d: 'By process ID', correct_answer: 'a', marks: 1 },
        { question_text: 'In MongoDB, what happens to _id if not provided?', option_a: 'Auto-generated ObjectId', option_b: 'Error thrown', option_c: 'Uses array index', option_d: 'Uses timestamp', correct_answer: 'a', marks: 1 },
        { question_text: 'React Context re-renders: How to prevent unnecessary renders?', option_a: 'Split context, useMemo, or use selectors', option_b: 'Use Redux instead', option_c: 'Cannot prevent', option_d: 'Use shouldComponentUpdate', correct_answer: 'a', marks: 1 },
        { question_text: 'Express app.use() vs app.all() difference?', option_a: 'app.use() for middleware, app.all() for all HTTP methods on route', option_b: 'No difference', option_c: 'app.all() is deprecated', option_d: 'app.use() only for GET', correct_answer: 'a', marks: 1 }
      ],
      created_at: new Date()
    });

    // Java Fullstack Exam
    await db.collection('exams').insertOne({
      title: 'Java Fullstack Developer',
      description: 'Advanced Java & Spring Boot - Expert Level',
      duration: 45,
      total_marks: 15,
      questions: [
        { question_text: 'Java String pool: Where is it stored in JVM?', option_a: 'Heap (PermGen in Java 7, Metaspace in Java 8+)', option_b: 'Stack', option_c: 'Native memory', option_d: 'Code cache', correct_answer: 'a', marks: 1 },
        { question_text: 'Spring @Transactional default propagation level?', option_a: 'REQUIRED', option_b: 'REQUIRES_NEW', option_c: 'NESTED', option_d: 'SUPPORTS', correct_answer: 'a', marks: 1 },
        { question_text: 'What is the diamond problem in Java?', option_a: 'Multiple inheritance ambiguity (solved by interfaces)', option_b: 'Generic type erasure issue', option_c: 'Memory leak pattern', option_d: 'Concurrency deadlock', correct_answer: 'a', marks: 1 },
        { question_text: 'Hibernate: What is N+1 query problem?', option_a: '1 query for parent, N queries for children (use JOIN FETCH)', option_b: 'Query timeout issue', option_c: 'Connection pool exhaustion', option_d: 'Transaction isolation problem', correct_answer: 'a', marks: 2 },
        { question_text: 'Java volatile keyword guarantees?', option_a: 'Visibility across threads, not atomicity', option_b: 'Both visibility and atomicity', option_c: 'Only atomicity', option_d: 'Thread safety for objects', correct_answer: 'a', marks: 1 },
        { question_text: 'Spring Boot auto-configuration: How to disable specific config?', option_a: 'Use @SpringBootApplication(exclude={...})', option_b: 'Remove dependency', option_c: 'Set property to false', option_d: 'Cannot disable', correct_answer: 'a', marks: 1 },
        { question_text: 'Java ConcurrentHashMap vs Hashtable?', option_a: 'ConcurrentHashMap uses segment locking, Hashtable locks entire map', option_b: 'No difference', option_c: 'Hashtable is faster', option_d: 'ConcurrentHashMap not thread-safe', correct_answer: 'a', marks: 1 },
        { question_text: 'What is Spring Bean scope "prototype"?', option_a: 'New instance created each time bean is requested', option_b: 'One instance per application', option_c: 'One instance per HTTP session', option_d: 'One instance per HTTP request', correct_answer: 'a', marks: 1 },
        { question_text: 'Java 8 Stream.parallel(): When does it improve performance?', option_a: 'Large datasets with CPU-intensive operations', option_b: 'Always improves performance', option_c: 'Small datasets', option_d: 'Never use it', correct_answer: 'a', marks: 2 },
        { question_text: 'JPA @OneToMany: Which side should own the relationship?', option_a: '@ManyToOne side (inverse side)', option_b: '@OneToMany side', option_c: 'Either side', option_d: 'Neither side', correct_answer: 'a', marks: 1 },
        { question_text: 'Java synchronized block vs ReentrantLock?', option_a: 'ReentrantLock offers tryLock(), timed locking, interruptible locking', option_b: 'No difference', option_c: 'synchronized is always better', option_d: 'ReentrantLock is deprecated', correct_answer: 'a', marks: 1 },
        { question_text: 'Spring @Async: What happens if method throws exception?', option_a: 'Exception is lost unless using Future return type', option_b: 'Exception propagates to caller', option_c: 'Application crashes', option_d: 'Exception is logged automatically', correct_answer: 'a', marks: 1 },
        { question_text: 'Java Garbage Collection: Which GC is best for low latency?', option_a: 'G1GC or ZGC', option_b: 'Serial GC', option_c: 'Parallel GC', option_d: 'CMS (deprecated)', correct_answer: 'a', marks: 1 },
        { question_text: 'Hibernate first vs second level cache?', option_a: 'First level is session scope, second level is SessionFactory scope', option_b: 'Both are same', option_c: 'First level is optional', option_d: 'Second level is mandatory', correct_answer: 'a', marks: 1 },
        { question_text: 'Spring Boot Actuator: Which endpoint exposes sensitive info?', option_a: '/actuator/env and /actuator/configprops (should secure)', option_b: '/actuator/health', option_c: '/actuator/info', option_d: 'None are sensitive', correct_answer: 'a', marks: 1 }
      ],
      created_at: new Date()
    });

    // Python Fullstack Exam
    await db.collection('exams').insertOne({
      title: 'Python Fullstack Developer',
      description: 'Advanced Python & Django/Flask - Expert Level',
      duration: 45,
      total_marks: 15,
      questions: [
        { question_text: 'Python GIL (Global Interpreter Lock): What does it prevent?', option_a: 'True parallel execution of Python bytecode', option_b: 'Multithreading completely', option_c: 'Multiprocessing', option_d: 'Async/await', correct_answer: 'a', marks: 1 },
        { question_text: 'Django ORM select_related() vs prefetch_related()?', option_a: 'select_related for ForeignKey, prefetch_related for ManyToMany', option_b: 'Same thing', option_c: 'prefetch_related is deprecated', option_d: 'select_related is slower', correct_answer: 'a', marks: 2 },
        { question_text: 'Python *args vs **kwargs in function definition?', option_a: '*args for positional, **kwargs for keyword arguments', option_b: 'Same thing', option_c: '**kwargs only for classes', option_d: '*args only for lists', correct_answer: 'a', marks: 1 },
        { question_text: 'What is Python descriptor protocol?', option_a: '__get__, __set__, __delete__ methods for attribute access', option_b: 'Decorator pattern', option_c: 'Context manager protocol', option_d: 'Iterator protocol', correct_answer: 'a', marks: 2 },
        { question_text: 'Flask vs Django: Main architectural difference?', option_a: 'Flask is microframework, Django is batteries-included', option_b: 'Flask is slower', option_c: 'Django cannot scale', option_d: 'Flask requires Python 3.10+', correct_answer: 'a', marks: 1 },
        { question_text: 'Python asyncio: What is event loop?', option_a: 'Core of async execution managing coroutines', option_b: 'Thread pool executor', option_c: 'Process pool executor', option_d: 'Generator function', correct_answer: 'a', marks: 1 },
        { question_text: 'Django migrations: What if two branches create migrations?', option_a: 'Merge conflict, need to merge migrations manually', option_b: 'Django auto-merges', option_c: 'Last migration wins', option_d: 'Application crashes', correct_answer: 'a', marks: 1 },
        { question_text: 'Python list comprehension vs generator expression memory?', option_a: 'Generator uses lazy evaluation, less memory', option_b: 'Same memory usage', option_c: 'List comprehension is always better', option_d: 'Generator stores all values', correct_answer: 'a', marks: 1 },
        { question_text: 'What is Python metaclass?', option_a: 'Class of a class, controls class creation', option_b: 'Abstract class', option_c: 'Static class', option_d: 'Singleton pattern', correct_answer: 'a', marks: 2 },
        { question_text: 'Django N+1 query problem: How to detect?', option_a: 'Use django-debug-toolbar or connection.queries', option_b: 'Cannot detect', option_c: 'Django prevents it automatically', option_d: 'Check server logs', correct_answer: 'a', marks: 1 },
        { question_text: 'Python @staticmethod vs @classmethod?', option_a: '@classmethod receives cls, @staticmethod receives nothing', option_b: 'Same thing', option_c: '@staticmethod is deprecated', option_d: '@classmethod is faster', correct_answer: 'a', marks: 1 },
        { question_text: 'Flask application factory pattern: Why use it?', option_a: 'Multiple app instances, easier testing, better config', option_b: 'Required by Flask', option_c: 'Only for production', option_d: 'Performance optimization', correct_answer: 'a', marks: 1 },
        { question_text: 'Python with statement: What protocol does it use?', option_a: 'Context manager (__enter__ and __exit__)', option_b: 'Iterator protocol', option_c: 'Descriptor protocol', option_d: 'Decorator protocol', correct_answer: 'a', marks: 1 },
        { question_text: 'Django ATOMIC_REQUESTS setting: What does it do?', option_a: 'Wraps each view in transaction', option_b: 'Makes database atomic', option_c: 'Required for PostgreSQL', option_d: 'Improves query performance', correct_answer: 'a', marks: 1 },
        { question_text: 'Python async def vs def: Can you await regular function?', option_a: 'No, cannot await regular function', option_b: 'Yes, always', option_c: 'Only if it returns Future', option_d: 'Only in main thread', correct_answer: 'a', marks: 1 }
      ],
      created_at: new Date()
    });

    // Testing Exam
    await db.collection('exams').insertOne({
      title: 'Software Testing Expert',
      description: 'Advanced Testing Strategies - Selenium, Jest, JUnit',
      duration: 40,
      total_marks: 15,
      questions: [
        { question_text: 'Test pyramid: What should be the largest layer?', option_a: 'Unit tests (70%), Integration (20%), E2E (10%)', option_b: 'E2E tests', option_c: 'Integration tests', option_d: 'All equal', correct_answer: 'a', marks: 1 },
        { question_text: 'What is test flakiness?', option_a: 'Test randomly passes/fails without code changes', option_b: 'Test is too slow', option_c: 'Test has syntax error', option_d: 'Test needs refactoring', correct_answer: 'a', marks: 1 },
        { question_text: 'Selenium: Explicit wait vs Implicit wait?', option_a: 'Explicit waits for specific condition, Implicit waits globally', option_b: 'Same thing', option_c: 'Implicit is better', option_d: 'Explicit is deprecated', correct_answer: 'a', marks: 2 },
        { question_text: 'Jest mock vs spy: Key difference?', option_a: 'Mock replaces implementation, spy wraps original', option_b: 'No difference', option_c: 'Spy is deprecated', option_d: 'Mock is slower', correct_answer: 'a', marks: 1 },
        { question_text: 'What is mutation testing?', option_a: 'Introduces bugs to test if tests catch them', option_b: 'Tests database mutations', option_c: 'Tests state changes', option_d: 'Load testing technique', correct_answer: 'a', marks: 2 },
        { question_text: 'TDD vs BDD: Main difference?', option_a: 'BDD focuses on behavior in plain language, TDD on tests first', option_b: 'Same methodology', option_c: 'BDD is deprecated', option_d: 'TDD only for backend', correct_answer: 'a', marks: 1 },
        { question_text: 'Code coverage 100%: Does it guarantee bug-free code?', option_a: 'No, only measures lines executed not correctness', option_b: 'Yes, completely bug-free', option_c: 'Only if E2E tests included', option_d: 'Only for critical paths', correct_answer: 'a', marks: 2 },
        { question_text: 'Selenium StaleElementReferenceException: Cause?', option_a: 'DOM element reference no longer valid after page update', option_b: 'Element not found', option_c: 'Timeout error', option_d: 'Browser crashed', correct_answer: 'a', marks: 1 },
        { question_text: 'What is contract testing?', option_a: 'Verifies service interactions match agreed contract', option_b: 'Tests legal documents', option_c: 'Performance testing', option_d: 'Security testing', correct_answer: 'a', marks: 1 },
        { question_text: 'Jest snapshot testing: When does it fail?', option_a: 'When component output differs from saved snapshot', option_b: 'On syntax error', option_c: 'On import error', option_d: 'Never fails', correct_answer: 'a', marks: 1 },
        { question_text: 'Load testing vs Stress testing?', option_a: 'Load tests expected load, Stress tests breaking point', option_b: 'Same thing', option_c: 'Stress is subset of load', option_d: 'Load is deprecated', correct_answer: 'a', marks: 1 },
        { question_text: 'Mocking vs Stubbing in unit tests?', option_a: 'Mocks verify behavior, Stubs provide canned responses', option_b: 'Same thing', option_c: 'Stubbing is deprecated', option_d: 'Mocking only for APIs', correct_answer: 'a', marks: 1 },
        { question_text: 'Selenium Page Object Model: Main benefit?', option_a: 'Reduces code duplication and improves maintainability', option_b: 'Faster test execution', option_c: 'Required by Selenium', option_d: 'Better error messages', correct_answer: 'a', marks: 1 },
        { question_text: 'What is property-based testing?', option_a: 'Tests properties/invariants with generated inputs', option_b: 'Tests object properties', option_c: 'Tests configuration properties', option_d: 'Tests CSS properties', correct_answer: 'a', marks: 1 },
        { question_text: 'Integration test isolation: How to achieve?', option_a: 'Use test database, containers, or in-memory DB', option_b: 'Cannot achieve isolation', option_c: 'Use production database', option_d: 'Mock everything', correct_answer: 'a', marks: 1 }
      ],
      created_at: new Date()
    });

    // Cloud Computing Exam
    await db.collection('exams').insertOne({
      title: 'Cloud Architecture Expert',
      description: 'AWS, Azure, GCP - Advanced Cloud Concepts',
      duration: 45,
      total_marks: 15,
      questions: [
        { question_text: 'AWS S3 eventual consistency vs strong consistency?', option_a: 'S3 now provides strong consistency for all operations', option_b: 'Still eventual', option_c: 'Depends on region', option_d: 'Only for new objects', correct_answer: 'a', marks: 1 },
        { question_text: 'What is CAP theorem in distributed systems?', option_a: 'Cannot have Consistency, Availability, Partition tolerance simultaneously', option_b: 'Cloud Application Performance', option_c: 'Container Automation Protocol', option_d: 'Cost Allocation Policy', correct_answer: 'a', marks: 2 },
        { question_text: 'AWS Lambda cold start: What causes it?', option_a: 'New container initialization when function not recently invoked', option_b: 'Network latency', option_c: 'Code compilation', option_d: 'Database connection', correct_answer: 'a', marks: 1 },
        { question_text: 'Horizontal vs Vertical scaling in cloud?', option_a: 'Horizontal adds instances, Vertical increases instance size', option_b: 'Same thing', option_c: 'Vertical is always better', option_d: 'Horizontal only for databases', correct_answer: 'a', marks: 1 },
        { question_text: 'What is serverless cold start optimization?', option_a: 'Provisioned concurrency, smaller packages, warm-up pings', option_b: 'Use bigger instances', option_c: 'Cannot optimize', option_d: 'Avoid serverless', correct_answer: 'a', marks: 2 },
        { question_text: 'AWS RDS Multi-AZ vs Read Replica?', option_a: 'Multi-AZ for HA/failover, Read Replica for read scaling', option_b: 'Same thing', option_c: 'Multi-AZ is deprecated', option_d: 'Read Replica is backup', correct_answer: 'a', marks: 1 },
        { question_text: 'What is immutable infrastructure?', option_a: 'Replace servers instead of updating them', option_b: 'Cannot change configuration', option_c: 'Hardware cannot fail', option_d: 'Security hardening', correct_answer: 'a', marks: 1 },
        { question_text: 'Azure Blob Storage tiers: Which is cheapest per GB?', option_a: 'Archive tier', option_b: 'Hot tier', option_c: 'Cool tier', option_d: 'Premium tier', correct_answer: 'a', marks: 1 },
        { question_text: 'What is edge computing?', option_a: 'Processing data closer to source, not centralized cloud', option_b: 'CDN caching', option_c: 'Border security', option_d: 'Network edge routers', correct_answer: 'a', marks: 1 },
        { question_text: 'AWS VPC: What is CIDR block?', option_a: 'Classless Inter-Domain Routing for IP range', option_b: 'Container Image Docker Registry', option_c: 'Cloud Infrastructure Data Replication', option_d: 'Certificate Identity Distributed Resource', correct_answer: 'a', marks: 1 },
        { question_text: 'Kubernetes vs Docker Swarm: Main difference?', option_a: 'K8s more feature-rich and complex, Swarm simpler', option_b: 'Same thing', option_c: 'Swarm is deprecated', option_d: 'Docker Swarm is faster', correct_answer: 'a', marks: 1 },
        { question_text: 'What is cloud vendor lock-in?', option_a: 'Dependency on proprietary services makes migration difficult', option_b: 'Account gets locked', option_c: 'Security feature', option_d: 'Billing issue', correct_answer: 'a', marks: 1 },
        { question_text: 'AWS CloudFront: What does it cache?', option_a: 'Static and dynamic content at edge locations', option_b: 'Only images', option_c: 'Only HTML', option_d: 'Cannot cache anything', correct_answer: 'a', marks: 1 },
        { question_text: 'GCP Preemptible VMs: When do they shut down?', option_a: 'After 24 hours or when GCP needs capacity', option_b: 'Never shut down', option_c: 'After 1 hour', option_d: 'On billing cycle', correct_answer: 'a', marks: 2 },
        { question_text: 'What is multi-cloud strategy?', option_a: 'Using multiple cloud providers to avoid lock-in', option_b: 'Multiple accounts in one cloud', option_c: 'Multiple regions', option_d: 'Multiple applications', correct_answer: 'a', marks: 1 }
      ],
      created_at: new Date()
    });

    // DevOps Exam
    await db.collection('exams').insertOne({
      title: 'DevOps Engineering Expert',
      description: 'CI/CD, Docker, Kubernetes, Infrastructure as Code',
      duration: 45,
      total_marks: 15,
      questions: [
        { question_text: 'Docker image layer: What happens when you rebuild?', option_a: 'Only changed layers rebuild, rest cached', option_b: 'Everything rebuilds', option_c: 'Nothing rebuilds', option_d: 'Random layers rebuild', correct_answer: 'a', marks: 1 },
        { question_text: 'Kubernetes Pod vs Deployment vs StatefulSet?', option_a: 'Pod is single unit, Deployment for stateless, StatefulSet for stateful', option_b: 'All same', option_c: 'StatefulSet is deprecated', option_d: 'Deployment only for databases', correct_answer: 'a', marks: 2 },
        { question_text: 'What is blue-green deployment?', option_a: 'Two identical environments, switch traffic instantly', option_b: 'Gradual rollout', option_c: 'Color-coded monitoring', option_d: 'Rolling update', correct_answer: 'a', marks: 1 },
        { question_text: 'GitOps: What is it?', option_a: 'Git as single source of truth for declarative infrastructure', option_b: 'Git branching strategy', option_c: 'Git hosting service', option_d: 'Git CLI tool', correct_answer: 'a', marks: 2 },
        { question_text: 'Docker multi-stage build: Main benefit?', option_a: 'Smaller final image by excluding build dependencies', option_b: 'Faster builds', option_c: 'Better security only', option_d: 'Required for production', correct_answer: 'a', marks: 1 },
        { question_text: 'Kubernetes Service types: ClusterIP vs NodePort vs LoadBalancer?', option_a: 'ClusterIP internal, NodePort exposes on node, LoadBalancer external', option_b: 'All same', option_c: 'NodePort is deprecated', option_d: 'LoadBalancer only for AWS', correct_answer: 'a', marks: 2 },
        { question_text: 'What is Infrastructure as Code (IaC)?', option_a: 'Managing infrastructure through code/config files', option_b: 'Writing application code', option_c: 'Infrastructure monitoring', option_d: 'Security scanning', correct_answer: 'a', marks: 1 },
        { question_text: 'Terraform apply vs plan?', option_a: 'Plan shows changes, apply executes them', option_b: 'Same thing', option_c: 'Plan is deprecated', option_d: 'Apply only shows preview', correct_answer: 'a', marks: 1 },
        { question_text: 'What is canary deployment?', option_a: 'Gradual rollout to small percentage before full release', option_b: 'Deploy to production directly', option_c: 'Rollback strategy', option_d: 'Testing environment', correct_answer: 'a', marks: 1 },
        { question_text: 'Docker ENTRYPOINT vs CMD?', option_a: 'ENTRYPOINT always runs, CMD is default args (can override)', option_b: 'Same thing', option_c: 'CMD is deprecated', option_d: 'ENTRYPOINT only for images', correct_answer: 'a', marks: 1 },
        { question_text: 'Kubernetes HPA (Horizontal Pod Autoscaler): What does it scale based on?', option_a: 'CPU, memory, or custom metrics', option_b: 'Time of day', option_c: 'Random intervals', option_d: 'Manual trigger only', correct_answer: 'a', marks: 1 },
        { question_text: 'What is observability in DevOps?', option_a: 'Logs, metrics, traces to understand system internal state', option_b: 'Just monitoring', option_c: 'Just logging', option_d: 'Security auditing', correct_answer: 'a', marks: 1 },
        { question_text: 'CI/CD: What is continuous deployment vs continuous delivery?', option_a: 'Deployment auto-deploys to prod, Delivery requires manual approval', option_b: 'Same thing', option_c: 'Deployment is deprecated', option_d: 'Delivery is faster', correct_answer: 'a', marks: 2 },
        { question_text: 'Kubernetes ConfigMap vs Secret?', option_a: 'Secret for sensitive data (base64), ConfigMap for config', option_b: 'Same thing', option_c: 'ConfigMap is encrypted', option_d: 'Secret is deprecated', correct_answer: 'a', marks: 1 },
        { question_text: 'What is shift-left testing in DevOps?', option_a: 'Testing earlier in development cycle', option_b: 'Testing in left environment', option_c: 'Left-to-right code review', option_d: 'Geographic load balancing', correct_answer: 'a', marks: 1 }
      ],
      created_at: new Date()
    });

    // JavaScript Basics (original exam - kept for compatibility)
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
    
    console.log('✅ Database seeded with 7 exams - extremely difficult questions');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

// Connect immediately
connectDB().catch(err => console.error('Initial connection error:', err));

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// JWT secret key - same as login endpoint
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123';

// Auth middleware to verify JWT token and check role
const verifyAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Required role: ' + roles.join(' or ') });
  }
  
  next();
};

// Health check
app.get('/api', async (req, res) => {
  try {
    const database = await connectDB();
    const count = await database.collection('exams').countDocuments();
    res.json({ 
      status: 'running', 
      message: 'Online Assessment Portal API',
      exams: count,
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      database: 'disconnected'
    });
  }
});

// AUTH
// OTP storage (in production, use Redis or database)
const otpStore = new Map();
const nodemailer = require('nodemailer');

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Send OTP endpoint
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 5-minute expiry
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send email with OTP
    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER || 'Online Assessment Portal <noreply@assessment.com>',
        to: email,
        subject: 'Your OTP for Registration',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">Online Assessment Portal</h2>
            <p>Your OTP for registration is:</p>
            <h1 style="background: #f7fafc; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; color: #2d3748; border-radius: 8px;">${otp}</h1>
            <p style="color: #718096; font-size: 14px;">This OTP is valid for 5 minutes.</p>
            <p style="color: #718096; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      });
      console.log(`📧 OTP sent to ${email}: ${otp}`);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Fallback: still allow registration in dev mode
      console.log(`📧 [DEV MODE] OTP for ${email}: ${otp}`);
    }
    
    res.json({
      message: 'OTP sent successfully to your email',
      // Always return OTP for testing (in production, remove this)
      otp: otp
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP and register
app.post('/api/auth/register', async (req, res) => {
  try {
    const database = await connectDB();
    const { username, email, password, role, otp } = req.body;
    
    // For student registration, verify OTP
    if (role === 'student' || !role) {
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP required for student registration' });
      }

      const storedOTP = otpStore.get(email);
      if (!storedOTP) {
        return res.status(400).json({ error: 'OTP expired or not found. Please request a new OTP' });
      }

      if (storedOTP.expiresAt < Date.now()) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP expired. Please request a new OTP' });
      }

      if (storedOTP.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      // OTP verified, delete it
      otpStore.delete(email);
    }
    
    const existing = await database.collection('users').findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await database.collection('users').insertOne({
      username, 
      email, 
      password: hashedPassword, 
      role: role || 'student',
      phone: email,
      phoneVerified: (role === 'student' || !role) ? true : false,
      created_at: new Date()
    });

    const token = jwt.sign(
      { id: result.insertedId.toString(), username, role: role || 'student' },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registered successfully',
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
    const { username, password } = req.body;
    
    const user = await database.collection('users').findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
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

// INTERVIEWER AUTH & MANAGEMENT
app.post('/api/interviewer/register', async (req, res) => {
  try {
    await connectDB();
    const { username, email, password, fullName, specialization, experience, bio } = req.body;
    
    const existing = await Interviewer.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const interviewer = new Interviewer({
      username,
      email,
      password: hashedPassword,
      fullName,
      specialization,
      experience,
      bio
    });
    
    await interviewer.save();
    
    const token = jwt.sign(
      { id: interviewer._id.toString(), username, role: 'interviewer' },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Interviewer registered successfully',
      token,
      interviewer: {
        id: interviewer._id.toString(),
        username: interviewer.username,
        email: interviewer.email,
        fullName: interviewer.fullName,
        role: 'interviewer'
      }
    });
  } catch (error) {
    console.error('Interviewer register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/interviewer/login', async (req, res) => {
  try {
    await connectDB();
    const { username, password } = req.body;
    
    const interviewer = await Interviewer.findOne({ username });
    if (!interviewer) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, interviewer.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: interviewer._id.toString(), username: interviewer.username, role: 'interviewer' },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      interviewer: {
        id: interviewer._id.toString(),
        username: interviewer.username,
        email: interviewer.email,
        fullName: interviewer.fullName,
        role: 'interviewer',
        specialization: interviewer.specialization,
        rating: interviewer.rating,
        totalInterviews: interviewer.totalInterviews
      }
    });
  } catch (error) {
    console.error('Interviewer login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get interviewer's assigned interviews
app.get('/api/interviewer/:id/interviews', async (req, res) => {
  try {
    await connectDB();
    const sessions = await InterviewSession.find({ interviewerId: req.params.id })
      .populate('studentId', 'username email')
      .sort({ scheduledAt: -1 });
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update interview session status
app.patch('/api/interview-session/:id/status', async (req, res) => {
  try {
    await connectDB();
    const { status, startedAt, endedAt } = req.body;
    
    const updateData = { status };
    if (startedAt) updateData.startedAt = new Date(startedAt);
    if (endedAt) updateData.endedAt = new Date(endedAt);
    
    const session = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save video recording chunks
app.post('/api/interview-session/:id/recording', async (req, res) => {
  try {
    await connectDB();
    const { chunkUrl } = req.body;
    
    const session = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      { $push: { recordingChunks: chunkUrl } },
      { new: true }
    );
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finalize recording with full URL
app.patch('/api/interview-session/:id/recording-complete', async (req, res) => {
  try {
    await connectDB();
    const { videoRecordingUrl } = req.body;
    
    const session = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      { $set: { videoRecordingUrl } },
      { new: true }
    );
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save transcript
app.post('/api/interview-session/:id/transcript', async (req, res) => {
  try {
    await connectDB();
    const { transcript } = req.body;
    
    const session = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      { $set: { transcript } },
      { new: true }
    );
    
    // Trigger AI evaluation after transcript is saved
    // This will be called automatically
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate AI evaluation and feedback
app.post('/api/interview-session/:id/evaluate', async (req, res) => {
  try {
    await connectDB();
    const session = await InterviewSession.findById(req.params.id);
    
    if (!session || !session.transcript) {
      return res.status(400).json({ error: 'Transcript not available for evaluation' });
    }
    
    // AI Evaluation using simple keyword and sentiment analysis
    // In production, this would use advanced LLM like GPT-4, Claude, or custom trained models
    const transcript = session.transcript.toLowerCase();
    
    // Technical score based on technical keywords
    const technicalKeywords = [
      'algorithm', 'data structure', 'complexity', 'optimization', 'design pattern',
      'api', 'database', 'scalability', 'performance', 'architecture',
      'object-oriented', 'functional', 'async', 'synchronous', 'framework'
    ];
    const technicalScore = Math.min(100, technicalKeywords.filter(k => transcript.includes(k)).length * 7 + 40);
    
    // Communication score based on clarity indicators
    const communicationKeywords = [
      'because', 'therefore', 'however', 'for example', 'in other words',
      'specifically', 'essentially', 'basically', 'actually'
    ];
    const communicationScore = Math.min(100, communicationKeywords.filter(k => transcript.includes(k)).length * 10 + 50);
    
    // Problem-solving score based on approach keywords
    const problemSolvingKeywords = [
      'first', 'then', 'next', 'finally', 'approach', 'solution', 'strategy',
      'consider', 'analyze', 'implement', 'test', 'edge case'
    ];
    const problemSolvingScore = Math.min(100, problemSolvingKeywords.filter(k => transcript.includes(k)).length * 8 + 45);
    
    const overallScore = Math.round((technicalScore + communicationScore + problemSolvingScore) / 3);
    
    // Generate strengths and weaknesses
    const strengths = [];
    const weaknesses = [];
    
    if (technicalScore >= 70) {
      strengths.push('Strong technical knowledge and terminology');
    } else {
      weaknesses.push('Could improve technical vocabulary and concepts understanding');
    }
    
    if (communicationScore >= 70) {
      strengths.push('Clear and articulate communication style');
    } else {
      weaknesses.push('Communication could be more structured and clear');
    }
    
    if (problemSolvingScore >= 70) {
      strengths.push('Systematic problem-solving approach');
    } else {
      weaknesses.push('Problem-solving approach needs more structure');
    }
    
    // Generate detailed feedback
    const feedback = `
Based on the interview analysis:

Technical Performance (${technicalScore}/100): ${technicalScore >= 70 ? 'Excellent' : technicalScore >= 50 ? 'Good' : 'Needs Improvement'}
- Demonstrated understanding of key technical concepts
- ${technicalScore >= 70 ? 'Strong grasp of industry terminology' : 'Should deepen technical knowledge'}

Communication Skills (${communicationScore}/100): ${communicationScore >= 70 ? 'Excellent' : communicationScore >= 50 ? 'Good' : 'Needs Improvement'}
- ${communicationScore >= 70 ? 'Articulates thoughts clearly and effectively' : 'Could improve clarity and structure in responses'}

Problem Solving (${problemSolvingScore}/100): ${problemSolvingScore >= 70 ? 'Excellent' : problemSolvingScore >= 50 ? 'Good' : 'Needs Improvement'}
- ${problemSolvingScore >= 70 ? 'Shows systematic approach to problem-solving' : 'Would benefit from more structured problem-solving methodology'}
    `.trim();
    
    const recommendation = overallScore >= 75 ? 'Strong candidate - Highly recommended for next round' :
                          overallScore >= 60 ? 'Good candidate - Recommended with some reservations' :
                          overallScore >= 45 ? 'Average candidate - Requires further evaluation' :
                          'Below expectations - Not recommended at this time';
    
    const aiEvaluation = {
      technicalScore,
      communicationScore,
      problemSolvingScore,
      overallScore,
      strengths,
      weaknesses,
      feedback,
      recommendation
    };
    
    session.aiEvaluation = aiEvaluation;
    await session.save();
    
    res.json({ aiEvaluation });
  } catch (error) {
    console.error('AI evaluation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get interview session details with playback
app.get('/api/interview-session/:id', async (req, res) => {
  try {
    await connectDB();
    const session = await InterviewSession.findById(req.params.id)
      .populate('studentId', 'username email')
      .populate('interviewerId', 'username fullName specialization');
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add interviewer feedback
app.post('/api/interview-session/:id/feedback', async (req, res) => {
  try {
    await connectDB();
    const { interviewerFeedback } = req.body;
    
    const session = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      { $set: { interviewerFeedback } },
      { new: true }
    );
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign interview to interviewer (admin endpoint)
app.post('/api/admin/assign-interview', async (req, res) => {
  try {
    await connectDB();
    const { studentId, interviewerId, interviewId, scheduledAt } = req.body;
    
    const session = new InterviewSession({
      studentId,
      interviewerId,
      interviewId,
      scheduledAt: new Date(scheduledAt),
      status: 'scheduled'
    });
    
    await session.save();
    
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all interviewers (admin endpoint)
app.get('/api/admin/interviewers', async (req, res) => {
  try {
    await connectDB();
    const interviewers = await Interviewer.find({}).select('-password');
    res.json(interviewers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== NEW INTERVIEW REQUEST SYSTEM ===============

// Student: Submit interview request
app.post('/api/interview-request', verifyAuth, requireRole(['student']), async (req, res) => {
  try {
    await connectDB();
    const {
      studentId,
      studentName,
      studentEmail,
      interviewType,
      interviewMode,
      specialization,
      proposedDates,
      preferredLanguage,
      additionalNotes
    } = req.body;

    const request = new InterviewRequest({
      studentId,
      studentName,
      studentEmail,
      interviewType,
      interviewMode: interviewType === 'ai' ? 'n/a' : interviewMode,
      specialization,
      proposedDates,
      preferredLanguage,
      additionalNotes,
      status: 'pending'
    });

    await request.save();

    res.status(201).json({
      message: 'Interview request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Interview request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Student: Get their interview requests
app.get('/api/student/:studentId/interview-requests', async (req, res) => {
  try {
    await connectDB();
    const requests = await InterviewRequest.find({ studentId: req.params.studentId })
      .populate('assignedInterviewerId', 'fullName specialization email')
      .sort({ created_at: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student: Cancel interview request
app.patch('/api/interview-request/:id/cancel', async (req, res) => {
  try {
    await connectDB();
    const request = await InterviewRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        updated_at: new Date()
      },
      { new: true }
    );
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HR: Get all interview requests
app.get('/api/hr/interview-requests', verifyAuth, requireRole(['hr']), async (req, res) => {
  try {
    await connectDB();
    const { status } = req.query;
    
    const filter = status ? { status } : {};
    const requests = await InterviewRequest.find(filter)
      .populate('studentId', 'username email')
      .populate('assignedInterviewerId', 'fullName specialization')
      .sort({ created_at: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HR: Approve interview request and schedule
app.post('/api/hr/interview-request/:id/approve', verifyAuth, requireRole(['hr']), async (req, res) => {
  try {
    await connectDB();
    const {
      hrId,
      hrComments,
      assignedInterviewerId,
      scheduledDate,
      scheduledTimeSlot,
      meetingLink,
      location
    } = req.body;

    const request = await InterviewRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update request
    request.status = 'approved';
    request.hrId = hrId;
    request.hrComments = hrComments;
    request.assignedInterviewerId = assignedInterviewerId;
    request.scheduledDate = new Date(scheduledDate);
    request.scheduledTimeSlot = scheduledTimeSlot;
    request.meetingLink = meetingLink;
    request.location = location;
    request.updated_at = new Date();
    
    await request.save();

    // Create interview session
    const session = new InterviewSession({
      requestId: request._id,
      studentId: request.studentId,
      interviewerId: assignedInterviewerId,
      interviewType: request.interviewType,
      interviewMode: request.interviewMode,
      scheduledAt: new Date(scheduledDate),
      status: 'scheduled',
      meetingLink,
      location
    });

    await session.save();

    // Update request status to scheduled
    request.status = 'scheduled';
    await request.save();

    res.json({
      message: 'Interview approved and scheduled',
      request,
      session
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// HR: Reject interview request
app.post('/api/hr/interview-request/:id/reject', verifyAuth, requireRole(['hr']), async (req, res) => {
  try {
    await connectDB();
    const { hrId, rejectionReason } = req.body;

    const request = await InterviewRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        hrId,
        rejectionReason,
        updated_at: new Date()
      },
      { new: true }
    );
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HR: Get dashboard statistics
app.get('/api/hr/dashboard-stats', verifyAuth, requireRole(['hr']), async (req, res) => {
  try {
    await connectDB();
    
    const pendingRequests = await InterviewRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await InterviewRequest.countDocuments({ status: 'approved' });
    const scheduledInterviews = await InterviewSession.countDocuments({ status: 'scheduled' });
    const completedInterviews = await InterviewSession.countDocuments({ status: 'completed' });
    const totalInterviewers = await Interviewer.countDocuments();
    
    const recentRequests = await InterviewRequest.find()
      .populate('studentId', 'username email')
      .sort({ created_at: -1 })
      .limit(10);
    
    res.json({
      stats: {
        pendingRequests,
        approvedRequests,
        scheduledInterviews,
        completedInterviews,
        totalInterviewers
      },
      recentRequests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Super AI Interview - Generate AI questions and conduct interview
app.post('/api/ai-interview/start', async (req, res) => {
  try {
    await connectDB();
    const { sessionId } = req.body;
    
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Generate AI interview questions based on specialization
    const questions = generateAIInterviewQuestions(session);
    
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Super AI Interview - Submit answer and get next question
app.post('/api/ai-interview/answer', async (req, res) => {
  try {
    await connectDB();
    const { sessionId, questionId, answer, currentQuestion } = req.body;
    
    // Analyze answer using AI
    const analysis = analyzeAIAnswer(answer, currentQuestion);
    
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Super AI Interview - Complete and generate comprehensive evaluation
app.post('/api/ai-interview/complete', async (req, res) => {
  try {
    await connectDB();
    const { sessionId, answers, transcript } = req.body;
    
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Generate comprehensive AI evaluation
    const evaluation = generateComprehensiveAIEvaluation(answers, transcript);
    
    session.transcript = transcript;
    session.aiEvaluation = evaluation;
    session.status = 'completed';
    session.endedAt = new Date();
    session.duration = Math.round((new Date() - new Date(session.startedAt)) / 60000);
    
    await session.save();

    res.json({ evaluation, session });
  } catch (error) {
    console.error('AI interview completion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// HR Authentication
app.post('/api/hr/register', async (req, res) => {
  try {
    await connectDB();
    const { username, email, password, fullName, department } = req.body;
    
    const existing = await HR.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const hr = new HR({
      username,
      email,
      password: hashedPassword,
      fullName,
      department
    });
    
    await hr.save();
    
    const token = jwt.sign(
      { id: hr._id.toString(), username, role: 'hr' },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'HR registered successfully',
      token,
      hr: {
        id: hr._id.toString(),
        username: hr.username,
        email: hr.email,
        fullName: hr.fullName,
        role: 'hr'
      }
    });
  } catch (error) {
    console.error('HR register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hr/login', async (req, res) => {
  try {
    await connectDB();
    const { username, password } = req.body;
    
    const hr = await HR.findOne({ username });
    if (!hr) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, hr.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: hr._id.toString(), username: hr.username, role: 'hr' },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      hr: {
        id: hr._id.toString(),
        username: hr.username,
        email: hr.email,
        fullName: hr.fullName,
        role: 'hr'
      }
    });
  } catch (error) {
    console.error('HR login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate AI interview questions
function generateAIInterviewQuestions(session) {
  const questionBank = {
    'MERN Stack': [
      {
        id: 1,
        question: 'Explain the difference between React Context API and Redux. When would you use each?',
        expectedKeywords: ['state management', 'prop drilling', 'scalability', 'middleware'],
        difficulty: 'medium'
      },
      {
        id: 2,
        question: 'How do you optimize the performance of a React application?',
        expectedKeywords: ['memo', 'useMemo', 'useCallback', 'lazy loading', 'code splitting'],
        difficulty: 'medium'
      },
      {
        id: 3,
        question: 'Describe how you would implement authentication in a MERN application.',
        expectedKeywords: ['JWT', 'bcrypt', 'middleware', 'protected routes', 'tokens'],
        difficulty: 'hard'
      },
      {
        id: 4,
        question: 'What are MongoDB indexes and why are they important?',
        expectedKeywords: ['query performance', 'indexing', 'compound index', 'unique'],
        difficulty: 'easy'
      },
      {
        id: 5,
        question: 'How do you handle errors in Express.js?',
        expectedKeywords: ['middleware', 'try-catch', 'error handling', 'status codes'],
        difficulty: 'easy'
      }
    ],
    'Java Full Stack': [
      {
        id: 1,
        question: 'Explain the Spring Boot dependency injection and its benefits.',
        expectedKeywords: ['IoC', 'DI', 'loose coupling', 'autowired', 'beans'],
        difficulty: 'medium'
      },
      {
        id: 2,
        question: 'How do you handle transactions in Spring?',
        expectedKeywords: ['@Transactional', 'ACID', 'rollback', 'isolation'],
        difficulty: 'medium'
      },
      {
        id: 3,
        question: 'What is the difference between JPA and Hibernate?',
        expectedKeywords: ['specification', 'implementation', 'ORM', 'entity'],
        difficulty: 'easy'
      },
      {
        id: 4,
        question: 'Explain RESTful API design principles.',
        expectedKeywords: ['HTTP methods', 'stateless', 'resources', 'endpoints'],
        difficulty: 'medium'
      },
      {
        id: 5,
        question: 'How do you optimize database queries in Hibernate?',
        expectedKeywords: ['fetch', 'N+1', 'caching', 'lazy loading'],
        difficulty: 'hard'
      }
    ],
    'Python Full Stack': [
      {
        id: 1,
        question: 'Explain Django ORM and its advantages.',
        expectedKeywords: ['ORM', 'QuerySet', 'migrations', 'models'],
        difficulty: 'medium'
      },
      {
        id: 2,
        question: 'How do you implement caching in Django?',
        expectedKeywords: ['Redis', 'Memcached', 'cache', 'performance'],
        difficulty: 'medium'
      },
      {
        id: 3,
        question: 'What is the GIL in Python and how does it affect performance?',
        expectedKeywords: ['Global Interpreter Lock', 'threads', 'multiprocessing'],
        difficulty: 'hard'
      },
      {
        id: 4,
        question: 'Explain async/await in Python.',
        expectedKeywords: ['asyncio', 'coroutines', 'event loop', 'non-blocking'],
        difficulty: 'medium'
      },
      {
        id: 5,
        question: 'How do you secure a Django application?',
        expectedKeywords: ['CSRF', 'XSS', 'SQL injection', 'authentication'],
        difficulty: 'medium'
      }
    ],
    'DevOps': [
      {
        id: 1,
        question: 'Explain the CI/CD pipeline and its components.',
        expectedKeywords: ['continuous integration', 'continuous deployment', 'automation', 'testing'],
        difficulty: 'medium'
      },
      {
        id: 2,
        question: 'How do you containerize an application using Docker?',
        expectedKeywords: ['Dockerfile', 'image', 'container', 'layers'],
        difficulty: 'medium'
      },
      {
        id: 3,
        question: 'What is Kubernetes and why use it?',
        expectedKeywords: ['orchestration', 'pods', 'services', 'scaling'],
        difficulty: 'hard'
      },
      {
        id: 4,
        question: 'Explain Infrastructure as Code (IaC).',
        expectedKeywords: ['Terraform', 'CloudFormation', 'version control', 'automation'],
        difficulty: 'medium'
      },
      {
        id: 5,
        question: 'How do you monitor applications in production?',
        expectedKeywords: ['logging', 'metrics', 'alerts', 'Prometheus', 'Grafana'],
        difficulty: 'medium'
      }
    ]
  };

  const defaultQuestions = [
    {
      id: 1,
      question: 'Tell me about your experience with full-stack development.',
      expectedKeywords: ['frontend', 'backend', 'database', 'API'],
      difficulty: 'easy'
    },
    {
      id: 2,
      question: 'Describe a challenging project you worked on and how you solved it.',
      expectedKeywords: ['problem-solving', 'solution', 'implementation'],
      difficulty: 'medium'
    },
    {
      id: 3,
      question: 'How do you ensure code quality in your projects?',
      expectedKeywords: ['testing', 'code review', 'best practices', 'standards'],
      difficulty: 'medium'
    },
    {
      id: 4,
      question: 'Explain your approach to debugging complex issues.',
      expectedKeywords: ['debugging', 'tools', 'methodology', 'systematic'],
      difficulty: 'medium'
    },
    {
      id: 5,
      question: 'How do you stay updated with new technologies?',
      expectedKeywords: ['learning', 'documentation', 'community', 'practice'],
      difficulty: 'easy'
    }
  ];

  // Find questions for specialization or use default
  const questions = questionBank[session.specialization] || defaultQuestions;
  
  return questions;
}

// Helper function to analyze AI answer
function analyzeAIAnswer(answer, question) {
  const answerLower = answer.toLowerCase();
  const keywords = question.expectedKeywords || [];
  
  let keywordsFound = 0;
  keywords.forEach(keyword => {
    if (answerLower.includes(keyword.toLowerCase())) {
      keywordsFound++;
    }
  });
  
  const score = Math.min(100, Math.round((keywordsFound / keywords.length) * 100));
  const feedback = score >= 70 ? 'Excellent answer with good technical depth' :
                  score >= 50 ? 'Good answer, but could include more technical details' :
                  score >= 30 ? 'Adequate answer, missing some key concepts' :
                  'Answer needs more technical depth and detail';
  
  return {
    score,
    feedback,
    keywordsFound,
    totalKeywords: keywords.length,
    suggestions: score < 70 ? `Consider mentioning: ${keywords.slice(keywordsFound).join(', ')}` : 'Great coverage!'
  };
}

// Helper function to generate comprehensive AI evaluation
function generateComprehensiveAIEvaluation(answers, transcript) {
  const transcriptLower = transcript.toLowerCase();
  
  // Technical analysis
  const technicalKeywords = [
    'algorithm', 'data structure', 'complexity', 'optimization', 'design pattern',
    'api', 'database', 'scalability', 'performance', 'architecture',
    'object-oriented', 'functional', 'async', 'framework', 'testing',
    'debugging', 'deployment', 'security', 'authentication', 'authorization'
  ];
  const technicalScore = Math.min(100, technicalKeywords.filter(k => transcriptLower.includes(k)).length * 5 + 30);
  
  // Communication analysis
  const communicationKeywords = [
    'because', 'therefore', 'however', 'for example', 'in other words',
    'specifically', 'essentially', 'actually', 'let me explain', 'to clarify'
  ];
  const communicationScore = Math.min(100, communicationKeywords.filter(k => transcriptLower.includes(k)).length * 8 + 40);
  
  // Problem-solving analysis
  const problemSolvingKeywords = [
    'first', 'then', 'next', 'finally', 'approach', 'solution', 'strategy',
    'consider', 'analyze', 'implement', 'test', 'edge case', 'optimize'
  ];
  const problemSolvingScore = Math.min(100, problemSolvingKeywords.filter(k => transcriptLower.includes(k)).length * 7 + 35);
  
  // Calculate answer scores
  let totalAnswerScore = 0;
  if (answers && answers.length > 0) {
    answers.forEach(ans => {
      totalAnswerScore += ans.score || 0;
    });
    totalAnswerScore = Math.round(totalAnswerScore / answers.length);
  }
  
  // Weighted overall score
  const overallScore = Math.round(
    (technicalScore * 0.35) + 
    (communicationScore * 0.25) + 
    (problemSolvingScore * 0.25) +
    (totalAnswerScore * 0.15)
  );
  
  // Generate strengths and weaknesses
  const strengths = [];
  const weaknesses = [];
  
  if (technicalScore >= 75) strengths.push('Strong technical knowledge and expertise');
  else if (technicalScore < 60) weaknesses.push('Technical knowledge needs improvement');
  
  if (communicationScore >= 75) strengths.push('Excellent communication and articulation skills');
  else if (communicationScore < 60) weaknesses.push('Communication could be more clear and structured');
  
  if (problemSolvingScore >= 75) strengths.push('Systematic and methodical problem-solving approach');
  else if (problemSolvingScore < 60) weaknesses.push('Problem-solving methodology needs development');
  
  if (totalAnswerScore >= 75) strengths.push('Comprehensive answers with good technical coverage');
  else if (totalAnswerScore < 60) weaknesses.push('Answers could be more detailed and comprehensive');
  
  // Generate detailed feedback
  const detailedAnalysis = `
🎯 COMPREHENSIVE AI INTERVIEW EVALUATION

📊 PERFORMANCE BREAKDOWN:

Technical Competency: ${technicalScore}/100 ${technicalScore >= 75 ? '⭐ Excellent' : technicalScore >= 60 ? '✓ Good' : '⚠ Needs Work'}
${technicalScore >= 75 ? '- Demonstrates strong command of technical concepts and industry standards' :
  technicalScore >= 60 ? '- Shows good understanding with room for deeper technical knowledge' :
  '- Requires significant improvement in technical fundamentals'}

Communication Skills: ${communicationScore}/100 ${communicationScore >= 75 ? '⭐ Excellent' : communicationScore >= 60 ? '✓ Good' : '⚠ Needs Work'}
${communicationScore >= 75 ? '- Articulates ideas clearly with excellent structure and clarity' :
  communicationScore >= 60 ? '- Communicates effectively with minor improvements needed' :
  '- Communication needs better structure and clarity'}

Problem Solving: ${problemSolvingScore}/100 ${problemSolvingScore >= 75 ? '⭐ Excellent' : problemSolvingScore >= 60 ? '✓ Good' : '⚠ Needs Work'}
${problemSolvingScore >= 75 ? '- Shows systematic, analytical approach to problem-solving' :
  problemSolvingScore >= 60 ? '- Demonstrates good problem-solving with scope for refinement' :
  '- Problem-solving approach lacks systematic methodology'}

Answer Quality: ${totalAnswerScore}/100 ${totalAnswerScore >= 75 ? '⭐ Excellent' : totalAnswerScore >= 60 ? '✓ Good' : '⚠ Needs Work'}
${totalAnswerScore >= 75 ? '- Provides comprehensive, well-thought-out answers' :
  totalAnswerScore >= 60 ? '- Answers are adequate with potential for more depth' :
  '- Answers need more detail and technical accuracy'}

🎯 KEY STRENGTHS:
${strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

⚠️ AREAS FOR IMPROVEMENT:
${weaknesses.length > 0 ? weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n') : 'None identified - Strong performance across all areas'}

💡 RECOMMENDATIONS FOR CANDIDATE:
${overallScore >= 80 ? '- Maintain current skill level and continue learning advanced concepts\n- Consider mentoring opportunities to share knowledge' :
  overallScore >= 65 ? '- Focus on strengthening weak areas identified above\n- Practice more technical problems and scenarios' :
  '- Dedicate time to fundamental concept review\n- Build practical projects to gain hands-on experience\n- Consider structured learning programs or certifications'}
  `.trim();
  
  const recommendation = overallScore >= 85 ? '🌟 HIGHLY RECOMMENDED - Exceptional candidate with strong technical and soft skills. Ready for immediate hiring.' :
                        overallScore >= 75 ? '✅ STRONGLY RECOMMENDED - Strong candidate who meets all requirements. Recommended for next round.' :
                        overallScore >= 65 ? '👍 RECOMMENDED - Good candidate with minor gaps. Conditional approval with focused training.' :
                        overallScore >= 50 ? '⚠️ CONDITIONAL - Average performance with significant gaps. Requires additional evaluation or training.' :
                        '❌ NOT RECOMMENDED - Below expectations. Candidate needs substantial skill development before reconsideration.';
  
  return {
    technicalScore,
    communicationScore,
    problemSolvingScore,
    overallScore,
    strengths,
    weaknesses,
    feedback: detailedAnalysis,
    recommendation,
    detailedAnalysis
  };
}

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

app.post('/api/exams/:id/submit', verifyAuth, requireRole(['student']), async (req, res) => {
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

app.put('/api/exams/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const { title, description, duration, total_marks, questions } = req.body;
    
    await database.collection('exams').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, description, duration, total_marks, questions, updated_at: new Date() } }
    );
    
    res.json({ message: 'Exam updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/exams/:id', async (req, res) => {
  try {
    const database = await connectDB();
    await database.collection('exams').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN ROUTES
app.get('/api/admin/dashboard', verifyAuth, requireRole(['admin']), async (req, res) => {
  try {
    const database = await connectDB();
    
    const totalStudents = await database.collection('users').countDocuments({ role: 'student' });
    const totalExams = await database.collection('exams').countDocuments();
    const totalSubmissions = await database.collection('submissions').countDocuments();
    const totalRevenue = await database.collection('fees').aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    
    const recentSubmissions = await database.collection('submissions').find({})
      .sort({ submitted_at: -1 }).limit(10).toArray();
    
    const recentUsers = await database.collection('users').find({ role: 'student' })
      .sort({ created_at: -1 }).limit(10).toArray();
    
    res.json({
      stats: {
        totalStudents,
        totalExams,
        totalSubmissions,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentSubmissions,
      recentUsers: recentUsers.map(u => ({ id: u._id.toString(), username: u.username, email: u.email, created_at: u.created_at }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/students', verifyAuth, requireRole(['admin']), async (req, res) => {
  try {
    const database = await connectDB();
    const students = await database.collection('users').find({ role: 'student' }).toArray();
    
    const enriched = await Promise.all(students.map(async (student) => {
      const submissions = await database.collection('submissions').countDocuments({ user_id: student._id });
      const fees = await database.collection('fees').find({ user_id: student._id }).toArray();
      const totalPaid = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
      
      return {
        id: student._id.toString(),
        username: student.username,
        email: student.email,
        created_at: student.created_at,
        totalSubmissions: submissions,
        totalPaid,
        status: student.status || 'active'
      };
    }));
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/students/:id', verifyAuth, requireRole(['admin']), async (req, res) => {
  try {
    const database = await connectDB();
    await database.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/students/:id', verifyAuth, requireRole(['admin']), async (req, res) => {
  try {
    const database = await connectDB();
    const { username, email, status } = req.body;
    
    await database.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { username, email, status, updated_at: new Date() } }
    );
    
    res.json({ message: 'Student updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/fees', async (req, res) => {
  try {
    const database = await connectDB();
    const fees = await database.collection('fees').find({}).sort({ created_at: -1 }).toArray();
    
    const enriched = await Promise.all(fees.map(async (fee) => {
      const user = await database.collection('users').findOne({ _id: fee.user_id });
      return {
        id: fee._id.toString(),
        user_id: fee.user_id.toString(),
        username: user?.username || 'Unknown',
        amount: fee.amount,
        status: fee.status,
        description: fee.description,
        created_at: fee.created_at
      };
    }));
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/fees', async (req, res) => {
  try {
    const database = await connectDB();
    const { user_id, amount, description } = req.body;
    
    await database.collection('fees').insertOne({
      user_id: new ObjectId(user_id),
      amount: parseFloat(amount),
      description,
      status: 'pending',
      created_at: new Date()
    });
    
    res.json({ message: 'Fee added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/fees/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const { status } = req.body;
    
    await database.collection('fees').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updated_at: new Date() } }
    );
    
    res.json({ message: 'Fee status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/reports', async (req, res) => {
  try {
    const database = await connectDB();
    
    const examStats = await database.collection('submissions').aggregate([
      { $group: {
        _id: '$exam_id',
        totalAttempts: { $sum: 1 },
        avgScore: { $avg: '$score' }
      }}
    ]).toArray();
    
    const userPerformance = await database.collection('submissions').aggregate([
      { $group: {
        _id: '$user_id',
        totalExams: { $sum: 1 },
        avgScore: { $avg: '$score' }
      }}
    ]).toArray();
    
    res.json({ examStats, userPerformance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/notifications', async (req, res) => {
  try {
    const database = await connectDB();
    const { title, message, target } = req.body;
    
    await database.collection('notifications').insertOne({
      title,
      message,
      target, // 'all', 'students', or specific user_id
      created_at: new Date(),
      read: false
    });
    
    res.json({ message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const database = await connectDB();
    const { user_id, role } = req.query;
    
    let query = { $or: [{ target: 'all' }] };
    if (role === 'student') query.$or.push({ target: 'students' });
    if (user_id) query.$or.push({ target: user_id });
    
    const notifications = await database.collection('notifications')
      .find(query).sort({ created_at: -1 }).limit(20).toArray();
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OTHER ROUTES
app.get('/api/submissions/me', verifyAuth, requireRole(['student']), async (req, res) => {
  try {
    const database = await connectDB();
    const submissions = await database.collection('submissions').find({}).toArray();
    
    // Enrich submissions with exam details and calculated percentage
    const enrichedSubmissions = await Promise.all(submissions.map(async (sub) => {
      const exam = await database.collection('exams').findOne({ _id: sub.exam_id });
      const totalMarks = exam ? exam.total_marks : 10;
      
      return {
        id: sub._id.toString(),
        _id: sub._id.toString(),
        title: exam ? exam.title : 'Unknown Exam',
        score: sub.score || 0,
        total_marks: totalMarks,
        percentage: Math.round(((sub.score || 0) / totalMarks) * 100),
        submitted_at: sub.submitted_at,
        exam_id: sub.exam_id.toString()
      };
    }));
    
    res.json(enrichedSubmissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/submissions/all', async (req, res) => {
  try {
    const database = await connectDB();
    const submissions = await database.collection('submissions').find({}).toArray();
    
    // Enrich submissions with exam details
    const enrichedSubmissions = await Promise.all(submissions.map(async (sub) => {
      const exam = await database.collection('exams').findOne({ _id: sub.exam_id });
      const totalMarks = exam ? exam.total_marks : 10;
      
      return {
        id: sub._id.toString(),
        title: exam ? exam.title : 'Unknown Exam',
        score: sub.score || 0,
        total_marks: totalMarks,
        percentage: Math.round(((sub.score || 0) / totalMarks) * 100),
        submitted_at: sub.submitted_at
      };
    }));
    
    res.json(enrichedSubmissions);
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

// INTERVIEW MANAGEMENT ROUTES (Similar to Exams)
app.get('/api/interview-courses', async (req, res) => {
  try {
    const database = await connectDB();
    const courses = await database.collection('interview_courses').find({}).toArray();
    res.json(courses.map(c => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      duration: c.duration,
      questions: c.questions?.length || 0,
      fee: c.fee || 200,
      created_at: c.created_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interview-courses/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const course = await database.collection('interview_courses').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!course) return res.status(404).json({ error: 'Interview course not found' });
    
    res.json({
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      duration: course.duration,
      questions: course.questions || [],
      fee: course.fee || 200
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Interview Payment Routes
app.post('/api/interview-payments/create-order', async (req, res) => {
  try {
    const { courseId, userId } = req.body;
    
    const database = await connectDB();
    const existingPayment = await database.collection('interview_payments').findOne({
      course_id: new ObjectId(courseId),
      user_id: userId,
      status: 'completed'
    });
    
    if (existingPayment) {
      return res.status(400).json({ 
        error: 'Payment already completed for this interview',
        paymentId: existingPayment._id.toString()
      });
    }
    
    const orderId = 'interview_' + Date.now() + Math.random().toString(36).substr(2, 9);
    const amount = 200;
    
    const payment = await database.collection('interview_payments').insertOne({
      course_id: new ObjectId(courseId),
      user_id: userId,
      order_id: orderId,
      amount: amount,
      currency: 'INR',
      status: 'pending',
      created_at: new Date()
    });
    
    res.json({
      orderId,
      amount,
      currency: 'INR',
      paymentId: payment.insertedId.toString()
    });
  } catch (error) {
    console.error('Create interview order error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/interview-payments/upload-screenshot', upload.single('screenshot'), async (req, res) => {
  try {
    const { orderId, courseId, userId } = req.body;
    const screenshot = req.file ? `/uploads/payment-proofs/${req.file.filename}` : null;
    
    if (!screenshot) {
      return res.status(400).json({ error: 'Screenshot is required' });
    }
    
    const database = await connectDB();
    const result = await database.collection('interview_payments').updateOne(
      { order_id: orderId },
      { 
        $set: { 
          screenshot,
          status: 'pending_verification',
          uploaded_at: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Payment order not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Screenshot uploaded successfully',
      screenshot 
    });
  } catch (error) {
    console.error('Upload screenshot error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interview-payments/status/:courseId/:userId', async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    console.log(`🔍 Checking interview payment - CourseID: ${courseId}, UserID: ${userId}`);
    
    const database = await connectDB();
    const payment = await database.collection('interview_payments').findOne({
      course_id: new ObjectId(courseId),
      user_id: userId
    });
    
    console.log(`💳 Interview Payment:`, payment ? {
      order_id: payment.order_id,
      status: payment.status,
      user_id: payment.user_id
    } : 'No payment record');
    
    if (payment) {
      res.json({ 
        paid: payment.status === 'completed',
        status: payment.status,
        orderId: payment.order_id,
        payment: {
          id: payment._id.toString(),
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.created_at,
          completedAt: payment.completed_at,
          screenshot: payment.screenshot
        }
      });
    } else {
      res.json({ 
        paid: false,
        status: 'not_paid',
        orderId: null,
        payment: null
      });
    }
  } catch (error) {
    console.error('Get interview payment status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Interview Payment Approval
app.get('/api/admin/interview-payments/pending', async (req, res) => {
  try {
    const database = await connectDB();
    const payments = await database.collection('interview_payments')
      .find({ status: 'pending_verification' })
      .sort({ created_at: -1 })
      .toArray();
    
    const enrichedPayments = await Promise.all(payments.map(async (payment) => {
      const course = await database.collection('interview_courses').findOne({ 
        _id: payment.course_id 
      });
      const user = await database.collection('users').findOne({ 
        _id: new ObjectId(payment.user_id) 
      });
      
      return {
        id: payment._id.toString(),
        orderId: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        courseTitle: course ? course.title : 'Unknown Course',
        courseId: payment.course_id.toString(),
        userId: payment.user_id,
        username: user ? user.username : 'Unknown',
        userEmail: user ? user.email : 'Unknown',
        screenshot: payment.screenshot,
        createdAt: payment.created_at
      };
    }));
    
    res.json(enrichedPayments);
  } catch (error) {
    console.error('Get pending interview payments error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/interview-payments/approve', async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log(`✅ Admin approving interview payment: ${orderId}`);
    
    const database = await connectDB();
    const result = await database.collection('interview_payments').updateOne(
      { order_id: orderId },
      { 
        $set: { 
          status: 'completed',
          verified_by: 'admin',
          verified_at: new Date(),
          completed_at: new Date()
        }
      }
    );
    
    console.log(`📝 Update result - Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Interview payment approved successfully' 
    });
  } catch (error) {
    console.error('Approve interview payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/interview-payments/reject', async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    
    const database = await connectDB();
    const result = await database.collection('interview_payments').updateOne(
      { order_id: orderId },
      { 
        $set: { 
          status: 'rejected',
          rejection_reason: reason,
          rejected_by: 'admin',
          rejected_at: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Interview payment rejected' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Interview Scheduling
app.post('/api/interview-schedule', async (req, res) => {
  try {
    const { courseId, userId, scheduledDate, interviewerEmail } = req.body;
    
    const database = await connectDB();
    const schedule = await database.collection('interview_schedules').insertOne({
      course_id: new ObjectId(courseId),
      user_id: userId,
      scheduled_date: new Date(scheduledDate),
      interviewer_email: interviewerEmail,
      status: 'scheduled',
      created_at: new Date()
    });
    
    res.json({ 
      success: true,
      scheduleId: schedule.insertedId.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interview-schedule/:userId', async (req, res) => {
  try {
    const database = await connectDB();
    const schedules = await database.collection('interview_schedules')
      .find({ user_id: req.params.userId })
      .sort({ scheduled_date: 1 })
      .toArray();
    
    const enrichedSchedules = await Promise.all(schedules.map(async (schedule) => {
      const course = await database.collection('interview_courses').findOne({ 
        _id: schedule.course_id 
      });
      
      return {
        id: schedule._id.toString(),
        courseTitle: course ? course.title : 'Unknown',
        courseId: schedule.course_id.toString(),
        scheduledDate: schedule.scheduled_date,
        interviewerEmail: schedule.interviewer_email,
        status: schedule.status
      };
    }));
    
    res.json(enrichedSchedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment Routes
app.post('/api/payments/create-order', verifyAuth, requireRole(['student']), async (req, res) => {
  try {
    const { examId, userId } = req.body;
    
    // Check if payment already exists
    const database = await connectDB();
    const existingPayment = await database.collection('payments').findOne({
      exam_id: new ObjectId(examId),
      user_id: userId,
      status: 'completed'
    });
    
    if (existingPayment) {
      return res.status(400).json({ 
        error: 'Payment already completed for this exam',
        paymentId: existingPayment._id.toString()
      });
    }
    
    // Create order (simulated for free gateway)
    const orderId = 'order_' + Date.now() + Math.random().toString(36).substr(2, 9);
    const amount = 200; // Rs 200
    
    const payment = await database.collection('payments').insertOne({
      exam_id: new ObjectId(examId),
      user_id: userId,
      order_id: orderId,
      amount: amount,
      currency: 'INR',
      status: 'pending',
      created_at: new Date()
    });
    
    res.json({
      orderId,
      amount,
      currency: 'INR',
      paymentId: payment.insertedId.toString()
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/verify', async (req, res) => {
  try {
    const { orderId, paymentId, signature, examId, userId } = req.body;
    
    const database = await connectDB();
    
    // In production, verify signature with Razorpay
    // For demo, we'll accept any payment
    const verified = true;
    
    if (verified) {
      await database.collection('payments').updateOne(
        { order_id: orderId },
        { 
          $set: { 
            status: 'completed',
            payment_id: paymentId,
            signature: signature,
            completed_at: new Date()
          }
        }
      );
      
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments/status/:examId/:userId', async (req, res) => {
  try {
    const { examId, userId } = req.params;
    console.log(`🔍 Checking payment status - ExamID: ${examId}, UserID: ${userId}`);
    const database = await connectDB();
    
    // First try to find any payment record for this exam and user
    const payment = await database.collection('payments').findOne({
      exam_id: new ObjectId(examId),
      user_id: userId
    });
    
    console.log(`💳 Payment found:`, payment ? {
      order_id: payment.order_id,
      status: payment.status,
      user_id: payment.user_id,
      exam_id: payment.exam_id
    } : 'No payment record');
    
    if (payment) {
      res.json({ 
        paid: payment.status === 'completed',
        status: payment.status,
        orderId: payment.order_id,
        payment: {
          id: payment._id.toString(),
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.created_at,
          completedAt: payment.completed_at,
          screenshot: payment.screenshot
        }
      });
    } else {
      // No payment record found
      console.log(`❌ No payment record found for exam ${examId} and user ${userId}`);
      res.json({ 
        paid: false,
        status: null,
        orderId: null,
        payment: null
      });
    }
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for payment gateway notifications (Razorpay, PhonePe, etc.)
app.post('/api/payments/webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;
    const database = await connectDB();
    
    // Verify webhook signature in production
    // const signature = req.headers['x-razorpay-signature'];
    
    if (event === 'payment.captured' || event === 'payment.success') {
      const { order_id, payment_id, amount } = payload;
      
      await database.collection('payments').updateOne(
        { order_id: order_id },
        { 
          $set: { 
            status: 'completed',
            payment_id: payment_id,
            completed_at: new Date(),
            webhook_received: true
          }
        }
      );
      
      console.log(`✅ Payment completed via webhook: ${payment_id}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload payment screenshot
app.post('/api/payments/upload-screenshot', upload.single('screenshot'), async (req, res) => {
  try {
    const { orderId, examId, userId, transactionId, upiId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Screenshot is required' });
    }
    
    const database = await connectDB();
    const screenshotPath = req.file.path;
    
    await database.collection('payments').updateOne(
      { order_id: orderId },
      { 
        $set: { 
          screenshot: screenshotPath,
          transaction_id: transactionId,
          upi_id: upiId,
          status: 'pending_verification',
          uploaded_at: new Date()
        }
      }
    );
    
    console.log(`📸 Screenshot uploaded for order: ${orderId}`);
    res.json({ 
      success: true, 
      message: 'Screenshot uploaded successfully. Awaiting admin verification.',
      screenshot: screenshotPath
    });
  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simulate instant payment (for demo/QR code)
app.post('/api/payments/simulate-payment', async (req, res) => {
  try {
    const { orderId, examId, userId } = req.body;
    const database = await connectDB();
    
    // Simulate payment completion after 2-3 seconds (like scanning QR)
    const paymentId = 'pay_demo_' + Math.random().toString(36).substr(2, 9);
    
    await database.collection('payments').updateOne(
      { order_id: orderId },
      { 
        $set: { 
          status: 'completed',
          payment_id: paymentId,
          signature: 'sig_demo_' + Math.random().toString(36).substr(2, 9),
          completed_at: new Date(),
          simulated: true
        }
      }
    );
    
    console.log(`✅ Payment simulated for order: ${orderId}`);
    res.json({ 
      success: true, 
      message: 'Payment successful',
      paymentId: paymentId
    });
  } catch (error) {
    console.error('Simulate payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all pending payment verifications (Admin)
app.get('/api/admin/payments/pending', verifyAuth, requireRole(['admin']), async (req, res) => {
  try {
    const database = await connectDB();
    const pendingPayments = await database.collection('payments')
      .aggregate([
        { $match: { status: 'pending_verification' } },
        {
          $addFields: {
            exam_id_obj: { $toObjectId: '$exam_id' },
            user_id_obj: { $toObjectId: '$user_id' }
          }
        },
        {
          $lookup: {
            from: 'exams',
            localField: 'exam_id_obj',
            foreignField: '_id',
            as: 'examDetails'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id_obj',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: {
            path: '$examDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { uploaded_at: -1 } }
      ])
      .toArray();
    
    console.log(`📋 Found ${pendingPayments.length} pending payments`);
    res.json({ payments: pendingPayments });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ error: error.message, payments: [] });
  }
});

// Approve payment (Admin)
app.post('/api/admin/payments/approve', verifyAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { orderId, adminRemarks } = req.body;
    console.log(`✅ Admin approving payment for order: ${orderId}`);
    const database = await connectDB();
    
    const result = await database.collection('payments').updateOne(
      { order_id: orderId },
      { 
        $set: { 
          status: 'completed',
          verified_by: 'admin',
          admin_remarks: adminRemarks || 'Payment verified and approved',
          verified_at: new Date()
        }
      }
    );
    
    console.log(`📝 Update result - Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    console.log(`✅ Payment approved: ${orderId}`);
    res.json({ success: true, message: 'Payment approved successfully' });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject payment (Admin)
app.post('/api/admin/payments/reject', verifyAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { orderId, adminRemarks } = req.body;
    const database = await connectDB();
    
    const result = await database.collection('payments').updateOne(
      { order_id: orderId },
      { 
        $set: { 
          status: 'rejected',
          verified_by: 'admin',
          admin_remarks: adminRemarks || 'Payment rejected',
          verified_at: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    console.log(`❌ Payment rejected: ${orderId}`);
    res.json({ success: true, message: 'Payment rejected' });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Poll payment status (for real-time updates)
app.get('/api/payments/poll/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const database = await connectDB();
    
    const payment = await database.collection('payments').findOne({
      order_id: orderId
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ 
      status: payment.status,
      completed: payment.status === 'completed',
      paymentId: payment.payment_id,
      completedAt: payment.completed_at
    });
  } catch (error) {
    console.error('Poll payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROLE MANAGEMENT APIs ====================

// Get all roles
app.get('/api/admin/roles', async (req, res) => {
  try {
    await connectDB();
    const roles = await Role.find().sort({ created_at: -1 });
    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get role by ID
app.get('/api/admin/roles/:id', async (req, res) => {
  try {
    await connectDB();
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new role
app.post('/api/admin/roles', async (req, res) => {
  try {
    await connectDB();
    const { name, displayName, description, permissions, isActive } = req.body;
    
    const existing = await Role.findOne({ name });
    if (existing) return res.status(400).json({ error: 'Role already exists' });

    const role = new Role({
      name,
      displayName,
      description,
      permissions: permissions || [],
      isActive: isActive !== undefined ? isActive : true
    });
    
    await role.save();
    res.status(201).json({ message: 'Role created successfully', role });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update role
app.put('/api/admin/roles/:id', async (req, res) => {
  try {
    await connectDB();
    const { name, displayName, description, permissions, isActive } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    // Check if name is being changed to an existing name
    if (name && name !== role.name) {
      const existing = await Role.findOne({ name });
      if (existing) return res.status(400).json({ error: 'Role name already exists' });
    }

    if (name) role.name = name;
    if (displayName) role.displayName = displayName;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;
    if (isActive !== undefined) role.isActive = isActive;
    role.updated_at = new Date();
    
    await role.save();
    res.json({ message: 'Role updated successfully', role });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete role
app.delete('/api/admin/roles/:id', async (req, res) => {
  try {
    await connectDB();
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER MANAGEMENT APIs ====================

// Get all users with pagination and filters
app.get('/api/admin/users', async (req, res) => {
  try {
    const database = await connectDB();
    const { role, search, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await database.collection('users')
      .find(query)
      .project({ password: 0 }) // Exclude password
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await database.collection('users').countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get('/api/admin/users/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const user = await database.collection('users').findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } }
    );
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new user
app.post('/api/admin/users', async (req, res) => {
  try {
    const database = await connectDB();
    const { username, email, password, fullName, role } = req.body;
    
    const existing = await database.collection('users').findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await database.collection('users').insertOne({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: role || 'student',
      created_at: new Date()
    });

    const user = await database.collection('users').findOne(
      { _id: result.insertedId },
      { projection: { password: 0 } }
    );

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const { username, email, fullName, role, password } = req.body;
    
    const user = await database.collection('users').findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if username is being changed to an existing username
    if (username && username !== user.username) {
      const existing = await database.collection('users').findOne({ username });
      if (existing) return res.status(400).json({ error: 'Username already taken' });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    updateData.updated_at = new Date();

    await database.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    const updatedUser = await database.collection('users').findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } }
    );

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const user = await database.collection('users').findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await database.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign role to user
app.patch('/api/admin/users/:id/role', async (req, res) => {
  try {
    const database = await connectDB();
    const { role } = req.body;
    
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const user = await database.collection('users').findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await database.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role, updated_at: new Date() } }
    );

    const updatedUser = await database.collection('users').findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } }
    );

    res.json({ message: 'Role assigned successfully', user: updatedUser });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;

// Always listen in development
app.listen(PORT, () => console.log(`✅ Server on ${PORT}`));
