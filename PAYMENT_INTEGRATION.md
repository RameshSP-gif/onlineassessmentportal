# Payment Integration Guide - ₹200 Exam Fee

## Overview
This portal now requires students to pay ₹200 before starting any exam. The payment is processed using Razorpay (free tier).

## Features Implemented

### 1. **Payment Flow**
- Student selects an exam from the exam list
- Redirected to payment page showing exam details and ₹200 fee
- After successful payment, redirected to take the exam
- Payment verification before allowing exam access

### 2. **Database Changes**
- New `payments` collection tracks all payment transactions
- Schema:
  - `exam_id`: Reference to the exam
  - `user_id`: Student who made the payment
  - `order_id`: Unique order identifier
  - `amount`: Payment amount (200)
  - `currency`: INR
  - `status`: pending/completed
  - `payment_id`: Razorpay payment ID
  - `signature`: Payment signature for verification
  - `created_at`: Payment creation timestamp
  - `completed_at`: Payment completion timestamp

### 3. **Backend API Endpoints**

#### POST `/api/payments/create-order`
Creates a new payment order
```json
{
  "examId": "exam_id_here",
  "userId": "user_id_here"
}
```
Response:
```json
{
  "orderId": "order_xxx",
  "amount": 200,
  "currency": "INR",
  "paymentId": "payment_doc_id"
}
```

#### POST `/api/payments/verify`
Verifies payment completion
```json
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "signature_xxx",
  "examId": "exam_id",
  "userId": "user_id"
}
```

#### GET `/api/payments/status/:examId/:userId`
Check payment status for an exam
Response:
```json
{
  "paid": true,
  "payment": {
    "id": "payment_id",
    "amount": 200,
    "completedAt": "2026-01-15T..."
  }
}
```

### 4. **Frontend Components**

#### Payment Component (`Payment.js`)
- Shows exam details
- Displays ₹200 fee prominently
- Handles Razorpay integration
- Simulates payment in demo mode (when Razorpay SDK not configured)
- Verifies payment before redirecting to exam

#### Updated Components
- **ExamList.js**: Shows ₹200 badge, redirects to payment page
- **TakeExam.js**: Verifies payment before loading exam
- **App.js**: Added `/payment/:examId` route

## Setup Instructions

### For Demo/Testing (Current Setup)
The system works in demo mode without actual Razorpay integration:
1. Start the backend: `npm run server`
2. Start the frontend: `npm start`
3. Click any exam, pay ₹200 (simulated)
4. Access is granted automatically

### For Production with Real Razorpay

#### 1. Create Razorpay Account
- Go to https://razorpay.com/
- Sign up (free tier available)
- Get your API keys from Dashboard

#### 2. Update Backend
In [api/index.js](api/index.js), add Razorpay configuration:
```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

Update create-order endpoint:
```javascript
const order = await razorpay.orders.create({
  amount: 200 * 100, // Amount in paise
  currency: 'INR',
  receipt: `exam_${examId}_${Date.now()}`
});
```

Update verify endpoint to validate signature:
```javascript
const crypto = require('crypto');
const generated_signature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(orderId + '|' + paymentId)
  .digest('hex');

if (generated_signature === signature) {
  // Payment verified
}
```

#### 3. Update Frontend
In [src/components/Payment.js](src/components/Payment.js), update:
```javascript
const options = {
  key: 'YOUR_RAZORPAY_KEY_ID', // From Razorpay dashboard
  amount: amount * 100,
  currency: currency,
  name: 'Assessment Portal',
  description: exam?.title,
  order_id: orderId,
  handler: async function (response) {
    await verifyPayment(response, orderId, user.userId);
  },
  // ... rest of options
};

const rzp = new window.Razorpay(options);
rzp.open();
```

#### 4. Environment Variables
Create `.env` file:
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

#### 5. Install Razorpay Package
```bash
npm install razorpay
```

## Payment Flow Diagram

```
Student → Exam List → Click "Start Exam" 
    ↓
Payment Page (₹200)
    ↓
Razorpay Checkout (UPI/Card/NetBanking/Wallet)
    ↓
Payment Success → Verify → Store in DB
    ↓
Redirect to Take Exam
    ↓
Verify Payment → Load Exam
```

## Security Features

1. **Payment Verification**: Every exam access checks payment status
2. **Signature Validation**: Razorpay signatures prevent tampering
3. **Database Tracking**: All payments logged with timestamps
4. **Duplicate Prevention**: Can't pay twice for same exam
5. **User Association**: Payments linked to specific user accounts

## Testing

### Demo Mode Testing
1. Navigate to `/exams`
2. Click any exam
3. Payment page shows ₹200 fee
4. Click "Pay ₹200 and Start Exam"
5. Payment simulated (no actual charge)
6. Redirected to exam

### Production Testing (with Razorpay Test Mode)
1. Use Razorpay test keys
2. Test cards available at: https://razorpay.com/docs/payments/payments/test-card-details/
3. Test UPI: success@razorpay

## Customization

### Change Payment Amount
In [api/index.js](api/index.js), line ~770:
```javascript
const amount = 200; // Change to desired amount
```

In [src/components/Payment.js](src/components/Payment.js), line ~130:
```javascript
<div className="amount-value">₹ 200</div> // Update display
```

In [src/components/ExamList.js](src/components/ExamList.js), line ~58:
```javascript
💰 ₹200 // Update badge
```

### Add Discount/Coupon System
Extend the payment system:
1. Add `discount_code` field to payments collection
2. Create coupons collection with discount percentages
3. Validate coupon before creating order
4. Apply discount to amount

### Payment History Page
Create new component showing:
- All payments by user
- Exam names
- Payment dates
- Amount paid
- Transaction IDs

## Supported Payment Methods (with Razorpay)

- 💳 Credit/Debit Cards
- 📱 UPI (Google Pay, PhonePe, Paytm)
- 🏦 Net Banking (All major banks)
- 👛 Wallets (Paytm, PhonePe, FreeCharge)

## Troubleshooting

### "Payment already completed" error
- User already paid for this exam
- Check payments collection for existing record
- Allow exam access if payment found

### Payment fails but shows success
- Check Razorpay dashboard for actual status
- Implement webhook for real-time updates
- Add manual verification option for admin

### Camera access denied after payment
- Payment successful, camera permission issue
- User can retry from dashboard
- Payment won't be charged again

## Next Steps

1. **Production Deployment**: Get Razorpay API keys and test thoroughly
2. **Webhook Integration**: Add Razorpay webhook for real-time payment updates
3. **Receipt Generation**: Send email receipt after payment
4. **Refund System**: Allow admin to issue refunds if needed
5. **Payment Analytics**: Track revenue, successful payments, failures

## Support

For Razorpay integration issues:
- Documentation: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

For portal issues:
- Check browser console for errors
- Verify MongoDB connection
- Check payment collection for records
