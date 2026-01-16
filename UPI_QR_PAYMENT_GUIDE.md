# UPI & QR Code Payment Guide

## Overview
Students can now pay the ₹200 exam fee using three convenient methods:
1. **All Payment Options** - Cards, UPI, NetBanking, Wallets via Razorpay
2. **Direct UPI Payment** - Pay using any UPI app with UPI ID
3. **QR Code** - Scan and pay using any UPI app

## Payment Methods

### 1. All Payment Options (Razorpay)
- Click "All Payment Options" button
- Supports:
  - 💳 Credit/Debit Cards (Visa, Mastercard, RuPay, Amex)
  - 📱 UPI (Google Pay, PhonePe, Paytm, BHIM, etc.)
  - 🏦 Net Banking (All major banks)
  - 👛 Digital Wallets (Paytm, PhonePe, FreeCharge, MobiKwik)
- Automatic payment verification
- Instant access to exam

### 2. Direct UPI Payment

#### How It Works:
1. Student selects "UPI Payment" option
2. Two UPI IDs displayed:
   - `assessmentportal@paytm`
   - `portal@ybl`
3. Student opens their UPI app (Google Pay, PhonePe, Paytm, etc.)
4. Enters UPI ID and sends ₹200
5. Gets transaction ID from UPI app
6. Enters transaction ID on portal
7. Clicks "Verify Payment"
8. System verifies and grants exam access

#### Supported UPI Apps:
- Google Pay (GPay)
- PhonePe
- Paytm
- BHIM UPI
- Amazon Pay
- WhatsApp Pay
- Freecharge
- MobiKwik
- Bank UPI apps (YONO, iMobile, etc.)

#### Setup Your UPI IDs:
To use real UPI IDs in production:

1. **Get a Business UPI ID** from your bank or payment service
2. **Update Payment.js** with your actual UPI IDs:
   ```javascript
   <div className="upi-id-card">
     <span className="upi-value">yourbusiness@paytm</span>
   </div>
   ```

### 3. QR Code Payment

#### How It Works:
1. Student selects "Scan QR Code" option
2. QR code displayed on screen with ₹200 amount
3. Student opens any UPI app
4. Taps "Scan & Pay" or "QR Code"
5. Scans the QR code on screen
6. Confirms payment of ₹200
7. Gets transaction ID
8. Enters transaction ID on portal
9. System verifies payment

#### Generate Real QR Code:

For production, generate a UPI QR code:

**Method 1: Using UPI Deep Link**
```
upi://pay?pa=yourbusiness@paytm&pn=AssessmentPortal&am=200&cu=INR&tn=ExamFee
```

**Method 2: Using QR Code Libraries**

Install QR code generator:
```bash
npm install qrcode
```

Update Payment.js:
```javascript
import QRCode from 'qrcode';

const generateQRCode = async () => {
  const upiString = 'upi://pay?pa=yourbusiness@paytm&pn=AssessmentPortal&am=200&cu=INR';
  const qrDataUrl = await QRCode.toDataURL(upiString);
  setQrCode(qrDataUrl);
};
```

**Method 3: Use Payment Gateway QR**
- Razorpay QR Code API
- PhonePe Business QR
- Paytm Business QR
- BharatQR

## Manual Payment Verification

### Current Implementation (Demo Mode):
- Student enters any transaction ID (min 5 characters)
- System automatically accepts and grants access
- For testing and demo purposes

### Production Implementation:

#### Option 1: Admin Verification
1. Store payment with "pending" status
2. Admin panel shows pending payments
3. Admin verifies payment from UPI statement
4. Admin approves/rejects payment
5. Student gets exam access after approval

**Update backend for admin verification:**
```javascript
// Add admin endpoint
app.post('/api/payments/admin/verify', async (req, res) => {
  const { paymentId, status, remarks } = req.body;
  
  await db.collection('payments').updateOne(
    { _id: new ObjectId(paymentId) },
    { 
      $set: { 
        status: status, // 'completed' or 'rejected'
        admin_remarks: remarks,
        verified_at: new Date()
      }
    }
  );
  
  res.json({ success: true });
});
```

#### Option 2: UPI Verification API
Integrate with payment verification services:
- **Razorpay Payment Links API**
- **PhonePe Payment Verification API**
- **Paytm Business API**
- **Bank UPI Verification APIs**

Example with Razorpay:
```javascript
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Verify payment
app.post('/api/payments/verify', async (req, res) => {
  const { paymentId } = req.body;
  
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (payment.status === 'captured') {
      // Update database
      await db.collection('payments').updateOne(
        { payment_id: paymentId },
        { $set: { status: 'completed', verified_at: new Date() } }
      );
      
      res.json({ success: true, verified: true });
    } else {
      res.json({ success: false, verified: false });
    }
  } catch (error) {
    res.status(400).json({ error: 'Invalid payment ID' });
  }
});
```

#### Option 3: Screenshot Upload
Add screenshot upload for manual verification:

```javascript
// Frontend - Add file upload
<input 
  type="file" 
  accept="image/*"
  onChange={handleScreenshotUpload}
/>

// Backend - Store screenshot
const multer = require('multer');
const upload = multer({ dest: 'uploads/payment-proofs/' });

app.post('/api/payments/upload-proof', upload.single('screenshot'), async (req, res) => {
  const { orderId } = req.body;
  
  await db.collection('payments').updateOne(
    { order_id: orderId },
    { 
      $set: { 
        screenshot: req.file.path,
        proof_uploaded_at: new Date()
      }
    }
  );
  
  res.json({ success: true });
});
```

## Configuration

### Step 1: Get UPI Business Account

**Option A: Payment Gateway**
- Sign up for Razorpay, PhonePe, or Paytm Business
- Get UPI ID and QR code
- Use their APIs for verification

**Option B: Bank Business Account**
- Contact your bank for business UPI
- Get dedicated UPI ID (yourcompany@bankname)
- Request QR code for ₹200 fixed amount

### Step 2: Update Frontend

**Update UPI IDs** in [src/components/Payment.js](src/components/Payment.js):
```javascript
<div className="upi-id-card">
  <span className="upi-value">yourbusiness@paytm</span>
</div>
```

**Add Real QR Code:**
```javascript
npm install qrcode

import QRCode from 'qrcode';

const [qrCodeUrl, setQrCodeUrl] = useState('');

useEffect(() => {
  const generateQR = async () => {
    const upiLink = 'upi://pay?pa=yourbusiness@paytm&pn=Portal&am=200&cu=INR';
    const url = await QRCode.toDataURL(upiLink);
    setQrCodeUrl(url);
  };
  generateQR();
}, []);

// In JSX
<img src={qrCodeUrl} alt="Payment QR Code" />
```

### Step 3: Update Backend Verification

Choose one of the verification methods:
1. **Admin Manual Verification** (Simple, no API needed)
2. **Payment Gateway API** (Automated, requires API integration)
3. **Screenshot Upload + Admin** (Hybrid approach)

## Testing

### Demo Mode (Current):
1. Start servers: `npm run server` and `npm start`
2. Navigate to exam list
3. Click any exam → Payment page
4. Try all three payment methods:
   - **All Options**: Auto-simulates payment
   - **UPI**: Enter any transaction ID (min 5 chars)
   - **QR**: Enter any transaction ID (min 5 chars)
5. System grants immediate access

### Production Testing:

**Test UPI Payment:**
1. Use test UPI apps in sandbox
2. Make real small payments (₹1-10) to your test UPI ID
3. Verify transaction IDs work
4. Test verification flow

**Test QR Code:**
1. Generate test QR code
2. Scan with real UPI apps
3. Complete test payments
4. Verify transaction IDs recorded

## Security & Best Practices

### 1. Transaction ID Validation
```javascript
// Add regex validation
const validateTransactionId = (txnId) => {
  // UPI transaction IDs are typically 12 digits
  const upiPattern = /^[0-9]{12}$/;
  
  // Razorpay format: pay_xxxxx
  const razorpayPattern = /^pay_[A-Za-z0-9]{14}$/;
  
  return upiPattern.test(txnId) || razorpayPattern.test(txnId);
};
```

### 2. Duplicate Prevention
```javascript
// Check if transaction ID already used
const existingPayment = await db.collection('payments').findOne({
  payment_id: transactionId
});

if (existingPayment) {
  return res.status(400).json({ 
    error: 'Transaction ID already used' 
  });
}
```

### 3. Payment Timeout
```javascript
// Mark pending payments as expired after 1 hour
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

await db.collection('payments').updateMany(
  { 
    status: 'pending',
    created_at: { $lt: oneHourAgo }
  },
  { 
    $set: { status: 'expired' }
  }
);
```

### 4. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many payment attempts, please try again later'
});

app.post('/api/payments/verify', paymentLimiter, async (req, res) => {
  // ... verification logic
});
```

## Admin Panel Features

### Pending Payments Dashboard
Create admin page to view pending verifications:
```javascript
// Backend endpoint
app.get('/api/admin/payments/pending', async (req, res) => {
  const pending = await db.collection('payments')
    .find({ status: 'pending' })
    .sort({ created_at: -1 })
    .toArray();
  
  res.json(pending);
});
```

### Payment History
Track all transactions:
- User info
- Exam name
- Amount
- Transaction ID
- Payment method
- Status
- Timestamp

## Troubleshooting

### "Invalid Transaction ID"
- Minimum 5 characters required
- Check format (numbers, alphanumeric)
- Ensure no spaces

### "Payment already exists"
- User already paid for this exam
- Check payments collection
- Allow exam access if payment found

### QR Code not scanning
- Ensure proper UPI link format
- Check amount parameter (in rupees, not paise)
- Test with different UPI apps

### Payment successful but not verified
- Check transaction ID entered correctly
- Verify backend receiving request
- Check MongoDB payments collection
- Implement webhook for real-time updates

## Future Enhancements

1. **Automatic Reconciliation**: Match bank statements with portal transactions
2. **Refund System**: Allow admin to process refunds
3. **Payment History**: Show all payments on student dashboard
4. **Multiple Exam Packages**: Bulk payment for multiple exams
5. **Discount Coupons**: Promotional codes for reduced fees
6. **Email Receipts**: Send payment confirmation emails
7. **SMS Notifications**: Transaction alerts via SMS
8. **Payment Analytics**: Track revenue, success rates, popular methods

## Support & Resources

### UPI Resources:
- NPCI UPI Documentation: https://www.npci.org.in/what-we-do/upi
- UPI Deep Linking Guide: https://developer.android.com/training/app-links/deep-linking
- QR Code Standards: https://www.npci.org.in/PDF/npci/upi/QR-code-spec.pdf

### Payment Gateways:
- Razorpay: https://razorpay.com/docs/
- PhonePe: https://developer.phonepe.com/
- Paytm: https://business.paytm.com/docs

### Testing:
- UPI Sandbox: Contact your payment gateway
- Test UPI IDs: Available from gateway providers
- QR Testing: Use sandbox environment

## Contact

For payment integration issues:
- Check [PAYMENT_INTEGRATION.md](PAYMENT_INTEGRATION.md) for general setup
- Review MongoDB payments collection for records
- Test with Postman using [OnlineAssessmentPortal.postman_collection.json](OnlineAssessmentPortal.postman_collection.json)
- Check browser console for errors
