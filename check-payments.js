#!/usr/bin/env node
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://root:Rakshita%401234@cluster0.pp8rwbt.mongodb.net/assessmentdb?retryWrites=true&w=majority';

async function checkPayments() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('assessmentdb');
    
    console.log('\n📋 All Interview Payments in Database:\n');
    
    const payments = await db.collection('interview_payments').find({}).toArray();
    
    if (payments.length === 0) {
      console.log('  ❌ No payments found\n');
    } else {
      payments.forEach((p, i) => {
        console.log(`  ${i+1}. Order ID: ${p.order_id}`);
        console.log(`     User ID: ${p.user_id}`);
        console.log(`     Course ID: ${p.course_id}`);
        console.log(`     Status: ${p.status}`);
        console.log(`     Created: ${p.created_at}`);
        console.log('');
      });
    }
    
  } finally {
    await client.close();
  }
}

checkPayments();
