require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:Rakshita%401234@cluster0.pp8rwbt.mongodb.net/assessmentdb?retryWrites=true&w=majority';

// Test users - 2 for each role
const testUsers = [
  // Admin users
  {
    username: 'admin1',
    email: 'admin1@test.com',
    password: 'admin123',
    fullName: 'Admin User One',
    role: 'admin'
  },
  {
    username: 'admin2',
    email: 'admin2@test.com',
    password: 'admin123',
    fullName: 'Admin User Two',
    role: 'admin'
  },
  // HR users
  {
    username: 'hr1',
    email: 'hr1@test.com',
    password: 'hr123',
    fullName: 'HR Manager One',
    role: 'hr'
  },
  {
    username: 'hr2',
    email: 'hr2@test.com',
    password: 'hr123',
    fullName: 'HR Manager Two',
    role: 'hr'
  },
  // Interviewer users
  {
    username: 'interviewer1',
    email: 'interviewer1@test.com',
    password: 'int123',
    fullName: 'Interviewer One',
    role: 'interviewer'
  },
  {
    username: 'interviewer2',
    email: 'interviewer2@test.com',
    password: 'int123',
    fullName: 'Interviewer Two',
    role: 'interviewer'
  },
  // Student users
  {
    username: 'student1',
    email: 'student1@test.com',
    password: 'student123',
    fullName: 'Student User One',
    role: 'student'
  },
  {
    username: 'student2',
    email: 'student2@test.com',
    password: 'student123',
    fullName: 'Student User Two',
    role: 'student'
  }
];

async function seedUsers() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas!');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('\n🌱 Seeding test users...\n');

    for (const user of testUsers) {
      // Check if user already exists
      const existing = await usersCollection.findOne({ username: user.username });
      
      if (existing) {
        console.log(`⏭️  User "${user.username}" already exists - Skipping`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insert user
      await usersCollection.insertOne({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        fullName: user.fullName,
        role: user.role,
        created_at: new Date()
      });

      console.log(`✅ Created ${user.role.toUpperCase().padEnd(12)} | Username: ${user.username.padEnd(15)} | Password: ${user.password}`);
    }

    console.log('\n✅ Test users seeding completed!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    📋 TEST USER CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n👨‍💼 ADMIN USERS:');
    console.log('   Username: admin1      | Password: admin123');
    console.log('   Username: admin2      | Password: admin123');
    console.log('\n👔 HR USERS:');
    console.log('   Username: hr1         | Password: hr123');
    console.log('   Username: hr2         | Password: hr123');
    console.log('\n🎤 INTERVIEWER USERS:');
    console.log('   Username: interviewer1 | Password: int123');
    console.log('   Username: interviewer2 | Password: int123');
    console.log('\n📚 STUDENT USERS:');
    console.log('   Username: student1    | Password: student123');
    console.log('   Username: student2    | Password: student123');
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
