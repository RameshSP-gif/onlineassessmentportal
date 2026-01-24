require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:Rakshita%401234@cluster0.pp8rwbt.mongodb.net/assessmentdb?retryWrites=true&w=majority';

// Test users - 2 for each role (student and hr only)
const testUsers = [
  { username: 'hr1', email: 'hr1@test.com', password: 'hr123', fullName: 'HR Manager One', role: 'hr' },
  { username: 'hr2', email: 'hr2@test.com', password: 'hr123', fullName: 'HR Manager Two', role: 'hr' },
  { username: 'student1', email: 'student1@test.com', password: 'student123', fullName: 'Student User One', role: 'student' },
  { username: 'student2', email: 'student2@test.com', password: 'student123', fullName: 'Student User Two', role: 'student' }
];

async function resetUsers() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas!\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Delete all test users
    console.log('🗑️  Deleting existing test users...');
    const usernames = testUsers.map(u => u.username);
    const deleteResult = await usersCollection.deleteMany({ username: { $in: usernames } });
    console.log(`   Deleted ${deleteResult.deletedCount} users\n`);

    // Create fresh users with hashed passwords
    console.log('🌱 Creating fresh test users...\n');
    
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await usersCollection.insertOne({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        fullName: user.fullName,
        role: user.role,
        createdAt: new Date()
      });
      console.log(`✅ Created ${user.role.toUpperCase().padEnd(12)} | Username: ${user.username.padEnd(18)} | Password: ${user.password}`);
    }

    console.log('\n✅ All test users reset successfully!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    📋 TEST USER CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('👨‍💼 ADMIN USERS:');
    console.log('   Username: admin1      | Password: admin123');
    console.log('   Username: admin2      | Password: admin123\n');
    console.log('👔 HR USERS:');
    console.log('   Username: hr1         | Password: hr123');
    console.log('   Username: hr2         | Password: hr123\n');
    console.log('🎤 INTERVIEWER USERS:');
    console.log('   Username: interviewer1 | Password: int123');
    console.log('   Username: interviewer2 | Password: int123\n');
    console.log('📚 STUDENT USERS:');
    console.log('   Username: student1    | Password: student123');
    console.log('   Username: student2    | Password: student123\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔌 Database connection closed');
    await mongoose.connection.close();
    process.exit(0);
  }
}

resetUsers();
