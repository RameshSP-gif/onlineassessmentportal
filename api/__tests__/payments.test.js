const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');

jest.setTimeout(30000);

let mongoServer;
let client;
let db;
let app;

const JWT_SECRET = 'test-secret';

const createToken = (user) => jwt.sign({ userId: user._id.toString(), username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.NODE_ENV = 'test';

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

test('student can create a payment order', async () => {
  const student = { _id: new ObjectId(), username: 'student1', email: 's1@test.com', role: 'student', password: 'hash' };
  const exam = { _id: new ObjectId(), title: 'Test Exam', description: 'Desc', duration: 30, total_marks: 10 };
  await db.collection('users').insertOne(student);
  await db.collection('exams').insertOne(exam);

  const token = createToken(student);

  const res = await request(app)
    .post('/api/payments/create-order')
    .set('Authorization', `Bearer ${token}`)
    .send({ examId: exam._id.toString(), userId: student._id.toString() })
    .expect(200);

  expect(res.body.orderId).toBeDefined();
  const payment = await db.collection('payments').findOne({ order_id: res.body.orderId });
  expect(payment).toBeTruthy();
  expect(payment.status).toBe('pending');
});

test('upload-screenshot creates pending_verification record when order is missing', async () => {
  const student = { _id: new ObjectId(), username: 'student2', email: 's2@test.com', role: 'student', password: 'hash' };
  const exam = { _id: new ObjectId(), title: 'Exam Two', description: 'Desc', duration: 20, total_marks: 5 };
  await db.collection('users').insertOne(student);
  await db.collection('exams').insertOne(exam);

  const buffer = Buffer.from('fake-image');
  const res = await request(app)
    .post('/api/payments/upload-screenshot')
    .field('orderId', 'order_missing_1')
    .field('examId', exam._id.toString())
    .field('userId', student._id.toString())
    .field('transactionId', 'txn123')
    .field('upiId', 'upi@test')
    .attach('screenshot', buffer, 'proof.png')
    .expect(200);

  expect(res.body.success).toBe(true);

  const payment = await db.collection('payments').findOne({ order_id: 'order_missing_1' });
  expect(payment).toBeTruthy();
  expect(payment.status).toBe('pending_verification');
  expect(payment.screenshot).toBeDefined();
});

test('admin pending list includes uploaded payment with exam and user details', async () => {
  const student = { _id: new ObjectId(), username: 'student3', email: 's3@test.com', role: 'student', password: 'hash' };
  const admin = { _id: new ObjectId(), username: 'admin1', email: 'a1@test.com', role: 'admin', password: 'hash' };
  const exam = { _id: new ObjectId(), title: 'Pending Exam', description: 'Desc', duration: 25, total_marks: 8 };
  await db.collection('users').insertMany([student, admin]);
  await db.collection('exams').insertOne(exam);
  await db.collection('payments').insertOne({
    exam_id: exam._id,
    user_id: student._id.toString(),
    order_id: 'order_pending_1',
    amount: 200,
    currency: 'INR',
    status: 'pending_verification',
    screenshot: '/uploads/payment-proofs/proof.png',
    uploaded_at: new Date(),
  });

  const adminToken = createToken(admin);

  const res = await request(app)
    .get('/api/admin/payments/pending')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  expect(res.body.payments.length).toBe(1);
  const payment = res.body.payments[0];
  expect(payment.examDetails.title).toBe('Pending Exam');
  expect(payment.userDetails.username).toBe('student3');
});

test('admin can approve a pending payment', async () => {
  const admin = { _id: new ObjectId(), username: 'admin2', email: 'a2@test.com', role: 'admin', password: 'hash' };
  await db.collection('users').insertOne(admin);

  await db.collection('payments').insertOne({
    exam_id: new ObjectId(),
    user_id: new ObjectId().toString(),
    order_id: 'order_to_approve',
    amount: 200,
    currency: 'INR',
    status: 'pending_verification',
    screenshot: '/uploads/payment-proofs/proof.png',
    uploaded_at: new Date(),
  });

  const adminToken = createToken(admin);

  await request(app)
    .post('/api/admin/payments/approve')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ orderId: 'order_to_approve', adminRemarks: 'Looks good' })
    .expect(200);

  const payment = await db.collection('payments').findOne({ order_id: 'order_to_approve' });
  expect(payment.status).toBe('completed');
  expect(payment.admin_remarks).toBe('Looks good');
});
