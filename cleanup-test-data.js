#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:Rakshita%401234@cluster0.pp8rwbt.mongodb.net/assessmentdb?retryWrites=true&w=majority';

async function cleanupTestData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('assessmentdb');

    console.log('\n🧹 CLEANING UP TEST DATA...\n');

    // Clear interview payments
    const paymentResult = await db.collection('interview_payments').deleteMany({});
    console.log(`✅ Deleted ${paymentResult.deletedCount} interview payment records`);

    // Clear interview requests
    const requestResult = await db.collection('interview_requests').deleteMany({});
    console.log(`✅ Deleted ${requestResult.deletedCount} interview request records`);

    // Clear exam payments
    const examPaymentResult = await db.collection('payments').deleteMany({});
    console.log(`✅ Deleted ${examPaymentResult.deletedCount} exam payment records`);

    console.log('\n✅ Test data cleanup complete!\n');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanupTestData();
