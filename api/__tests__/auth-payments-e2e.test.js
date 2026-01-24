const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

jest.setTimeout(30000);

let mongoServer;
let client;
let db;
let app;

const JWT_SECRET = 'test-secret';

const createToken = (user) => jwt.sign({ id: user._id.toString(), username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.NODE_ENV = 'test';
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();

  app = require('../index.js');
});

afterAll(async () => {
  await mongoose.connection.close();
  await client.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await db.collection('users').deleteMany({});
  await db.collection('exams').deleteMany({});
  await db.collection('payments').deleteMany({});
});

test('OTP -> register -> login flow', async () => {
  const otpRes = await request(app)
    .post('/api/auth/send-otp')
    .send({ email: 'u1@test.com' })
    .expect(200);

  expect(otpRes.body.otp).toHaveLength(6);

  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'user1',
      email: 'u1@test.com',
      password: 'pass1234',
      phone: '9876543210',
      otp: otpRes.body.otp,
      role: 'student'
    })
    .expect(201);

  expect(regRes.body.token).toBeDefined();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'user1', password: 'pass1234' })
    .expect(200);

  expect(loginRes.body.token).toBeDefined();
  expect(loginRes.body.user.username).toBe('user1');
});

test('profile returns user data with auth token', async () => {
  const user = { _id: new ObjectId(), username: 'u2', email: 'u2@test.com', role: 'student', password: 'hash' };
  await db.collection('users').insertOne(user);

  const token = createToken(user);

  const res = await request(app)
    .get('/api/auth/profile')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(res.body.username).toBe('u2');
  expect(res.body.email).toBe('u2@test.com');
});

test('UPI QR simulate payment flow completes and status shows paid', async () => {
  const student = { _id: new ObjectId(), username: 'studentUpi', email: 'supi@test.com', role: 'student', password: 'hash' };
  const exam = { _id: new ObjectId(), title: 'UPI Exam', description: 'Desc', duration: 30, total_marks: 10 };
  await db.collection('users').insertOne(student);
  await db.collection('exams').insertOne(exam);

  const token = createToken(student);

  const orderRes = await request(app)
    .post('/api/payments/create-order')
    .set('Authorization', `Bearer ${token}`)
    .send({ examId: exam._id.toString(), userId: student._id.toString() })
    .expect(200);

  const orderId = orderRes.body.orderId;

  await request(app)
    .post('/api/payments/simulate-payment')
    .send({ orderId, examId: exam._id.toString(), userId: student._id.toString() })
    .expect(200);

  const statusRes = await request(app)
    .get(`/api/payments/status/${exam._id.toString()}/${student._id.toString()}`)
    .expect(200);

  expect(statusRes.body.paid).toBe(true);
  expect(statusRes.body.status).toBe('completed');

  const pollRes = await request(app)
    .get(`/api/payments/poll/${orderId}`)
    .expect(200);

  expect(pollRes.body.completed).toBe(true);
});
