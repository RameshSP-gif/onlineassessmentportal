const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://root:Rakshita%401234@cluster0.pp8rwbt.mongodb.net/assessmentdb?retryWrites=true&w=majority';

async function checkPayments() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('assessmentdb');
    const payments = await db.collection('payments').find({}).toArray();
    
    console.log(`\n📊 Found ${payments.length} payment(s) in database:\n`);
    
    payments.forEach((payment, index) => {
      console.log(`Payment ${index + 1}:`);
      console.log(`  Order ID: ${payment.order_id}`);
      console.log(`  Exam ID: ${payment.exam_id}`);
      console.log(`  User ID: ${payment.user_id}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Amount: ₹${payment.amount}`);
      console.log(`  Created: ${payment.created_at}`);
      console.log(`  Screenshot: ${payment.screenshot ? 'Yes' : 'No'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkPayments();
