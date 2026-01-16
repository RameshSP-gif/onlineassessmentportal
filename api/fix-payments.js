const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://root:Rakshita%401234@cluster0.pp8rwbt.mongodb.net/assessmentdb?retryWrites=true&w=majority';

async function fixPayments() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('assessmentdb');
    
    // Get the user ID (assuming rakshita is the student)
    const user = await db.collection('users').findOne({ email: 'rakshita1@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found. Please check the email.');
      return;
    }
    
    const userId = user._id.toString();
    console.log(`\n👤 Found user: ${user.username} (ID: ${userId})`);
    
    // Update all completed payments to have this user_id
    const result = await db.collection('payments').updateMany(
      { 
        status: 'completed',
        user_id: null
      },
      { 
        $set: { user_id: userId }
      }
    );
    
    console.log(`\n✅ Updated ${result.modifiedCount} completed payment(s) with user ID`);
    
    // Show updated payments
    const updatedPayments = await db.collection('payments').find({ 
      user_id: userId,
      status: 'completed'
    }).toArray();
    
    console.log(`\n📊 Student now has ${updatedPayments.length} approved payment(s):\n`);
    
    updatedPayments.forEach((payment, index) => {
      console.log(`${index + 1}. Order: ${payment.order_id}`);
      console.log(`   Exam ID: ${payment.exam_id}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Amount: ₹${payment.amount}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixPayments();
