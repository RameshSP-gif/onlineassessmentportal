# VIDEO INTERVIEW SYSTEM - COMPLETE DOCUMENTATION

## BACKEND APIs

### 1. AUTHENTICATION ENDPOINTS

#### Login
**POST** `/api/auth/login`
```json
Request:
{
  "username": "student1",
  "password": "student123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "6973c5746e610917eb995b94",
    "username": "student1",
    "email": "student1@example.com",
    "role": "student"
  },
  "message": "Login successful"
}

Error (401):
{
  "error": "Invalid username or password"
}
```

---

### 2. INTERVIEW COURSE ENDPOINTS

#### Get All Interview Courses
**GET** `/api/interview-courses`
```json
Response (200):
[
  {
    "id": "6969b0042fdaf1a1cd3af99b",
    "title": "Java Full Stack Developer Interview",
    "description": "Comprehensive interview covering Java and web development",
    "duration": 30,
    "questions": 5,
    "fee": 200,
    "created_at": "2025-12-20T10:30:00Z"
  },
  ...more courses
]
```

#### Get Interview Course by ID
**GET** `/api/interview-courses/:id`
```json
Response (200):
{
  "id": "6969b0042fdaf1a1cd3af99b",
  "title": "Java Full Stack Developer Interview",
  "description": "...",
  "duration": 30,
  "questions": [...],
  "fee": 200
}

Error (404):
{
  "error": "Interview course not found"
}
```

---

### 3. PAYMENT ENDPOINTS

#### Check Interview Payment Status
**GET** `/api/interview-payments/status/:courseId/:userId`
```json
Response (200):
{
  "paid": false,
  "status": "not_paid",
  "orderId": null
}

Status Values:
- "not_paid": Student hasn't initiated payment
- "pending_verification": Payment proof uploaded, awaiting admin approval
- "approved": Payment approved, ready to schedule interview
```

#### Create Payment Order
**POST** `/api/interview-payments/create-order`
```json
Request:
{
  "courseId": "6969b0042fdaf1a1cd3af99b",
  "userId": "6973c5746e610917eb995b94"
}

Response (200):
{
  "orderId": "interview_1769195566313hid2r32m5",
  "amount": 200,
  "message": "Order created successfully"
}
```

#### Upload Payment Screenshot
**POST** `/api/interview-payments/upload-screenshot`
```
Headers:
- Authorization: Bearer {token}
- Content-Type: multipart/form-data

Body:
- screenshot: (file) - JPEG/PNG/PDF, max 5MB
- orderId: "interview_1769195566313hid2r32m5"
- courseId: "6969b0042fdaf1a1cd3af99b"

Response (200):
{
  "message": "Payment proof submitted successfully",
  "status": "pending_verification",
  "orderId": "interview_1769195566313hid2r32m5"
}

Error (400):
{
  "error": "Only images and PDF files are allowed"
}
```

---

### 4. INTERVIEW REQUEST ENDPOINTS

#### Create Interview Request
**POST** `/api/interview-requests`
```json
Headers:
- Authorization: Bearer {token}

Request:
{
  "courseId": "6969b0042fdaf1a1cd3af99b",
  "proposedDate": "2026-02-15",
  "proposedTime": "14:30",
  "notes": "I prefer afternoon slots"
}

Response (201):
{
  "id": "6973cb56835f72c4dc248f90",
  "courseId": "6969b0042fdaf1a1cd3af99b",
  "userId": "6973c5746e610917eb995b94",
  "studentEmail": "student1@example.com",
  "courseName": "Java Full Stack Developer Interview",
  "proposedDate": "2026-02-15T00:00:00.000Z",
  "proposedTime": "14:30",
  "notes": "I prefer afternoon slots",
  "status": "pending",
  "message": "Interview request submitted successfully"
}

Error (401):
{
  "error": "Unauthorized"
}
```

#### Get Interview Requests (Admin)
**GET** `/api/interview-requests?status={status}`
```json
Query Parameters:
- status: "pending" | "approved" | "rejected" (optional)

Headers:
- Authorization: Bearer {adminToken}

Response (200):
[
  {
    "_id": "6973cb56835f72c4dc248f90",
    "courseId": "6969b0042fdaf1a1cd3af99b",
    "userId": "6973c5746e610917eb995b94",
    "studentEmail": "student1@example.com",
    "courseName": "Java Full Stack Developer Interview",
    "proposedDate": "2026-02-15T00:00:00.000Z",
    "proposedTime": "14:30",
    "notes": "I prefer afternoon slots",
    "status": "pending",
    "created_at": "2026-01-24T10:30:00Z"
  }
]

Error (403):
{
  "error": "Access denied"
}
```

#### Approve Interview Request (Admin)
**PATCH** `/api/interview-requests/:id/approve`
```json
Headers:
- Authorization: Bearer {adminToken}

Request:
{
  "status": "approved",
  "scheduledDate": "2026-02-15",
  "scheduledTime": "14:30"
}

Response (200):
{
  "id": "6973cb56835f72c4dc248f90",
  "status": "approved",
  "scheduledDate": "2026-02-15T00:00:00.000Z",
  "scheduledTime": "14:30",
  "approvedAt": "2026-01-24T11:00:00Z",
  "message": "Interview request approved"
}

Error (404):
{
  "error": "Interview request not found"
}

Error (403):
{
  "error": "Access denied - Admin only"
}
```

#### Reject Interview Request (Admin)
**PATCH** `/api/interview-requests/:id/reject`
```json
Headers:
- Authorization: Bearer {adminToken}

Request:
{
  "rejectionReason": "Time slot not available"
}

Response (200):
{
  "id": "6973cb56835f72c4dc248f90",
  "status": "rejected",
  "rejectionReason": "Time slot not available",
  "rejectedAt": "2026-01-24T11:00:00Z",
  "message": "Interview request rejected"
}
```

---

## FRONTEND COMPONENTS

### 1. **Dashboard.js**
**Location:** `/src/components/Dashboard.js`
**Purpose:** Student landing page after login
**Key Features:**
- Display exam and interview statistics
- Prominent button: "🎤💰 Pay and Schedule Interview Now"
- Quick action buttons for exams, interviews, results
- Admin panel link for admin users

**Button Styling:**
```javascript
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
fontSize: '16px',
fontWeight: '700',
padding: '12px 24px',
boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
```

---

### 2. **InterviewList.js**
**Location:** `/src/components/InterviewList.js`
**Purpose:** Show available interview courses with payment status
**Key Features:**
- Categorized view: Available to Pay / Pending Approval / Approved & Ready
- Filter tabs to switch between categories
- Card display with course details, duration, questions
- Status badges with color coding
- Action buttons: "Pay & Schedule" or "Request Interview"

**Status Colors:**
- 💰 Available to Pay: Yellow (#fbbf24)
- ⏳ Pending Approval: Orange (#f59e0b)
- ✅ Approved: Green (#38a169)

---

### 3. **InterviewPayment.js**
**Location:** `/src/components/InterviewPayment.js`
**Purpose:** Payment page with QR code for ₹200 fee
**Key Features:**
- Displays PhonePe QR code at `/phonepe-qr.jpg`
- Screenshot upload for payment proof
- File validation (images, PDF only, max 5MB)
- Order ID tracking
- Payment status polling
- Success message after submission

**QR Code Display:**
```javascript
<img src="/phonepe-qr.jpg" alt="PhonePe QR Code" />
```

---

### 4. **ScheduleInterviewRequest.js**
**Location:** `/src/components/ScheduleInterviewRequest.js`
**Purpose:** Request interview with proposed date/time
**Key Features:**
- Date picker (from today onwards)
- Time picker (9 AM - 6 PM)
- Optional notes field
- Admin approval notification
- Back button to interview list

---

### 5. **AdminInterviewRequests.js**
**Location:** `/src/components/AdminInterviewRequests.js`
**Purpose:** Admin panel to manage interview requests
**Key Features:**
- View pending, approved, rejected requests
- Filter by status (tabs)
- Expand request to see details
- Approve with scheduled date/time
- Reject with reason
- Student email and notes visible

---

### 6. **TakeInterview.js**
**Location:** `/src/components/TakeInterview.js`
**Purpose:** Video interview recording and submission
**Key Features:**
- Video recording interface
- Webcam access and controls
- Start/stop recording buttons
- Preview recorded video
- Submit and mark as completed
- Show submission status

---

## TESTING CHECKLIST

### ✅ Backend API Tests (Functional)
- [x] Student login with valid credentials
- [x] Student login with invalid credentials (401)
- [x] Admin login
- [x] Get all interview courses
- [x] Get specific course by ID
- [x] Invalid course returns 404
- [x] Check payment status
- [x] Create payment order
- [x] Upload payment screenshot
- [x] Create interview request (authenticated)
- [x] Create interview request without auth (401)
- [x] Admin view pending requests
- [x] Admin approve request
- [x] Admin reject request
- [x] Student cannot approve requests (403)
- [x] Student cannot reject requests (403)

### ✅ Responsiveness Tests
- [ ] Dashboard button visible and functional on mobile
- [ ] InterviewList cards responsive on small screens
- [ ] QR code readable on mobile devices
- [ ] Date/time pickers work on mobile
- [ ] Forms properly formatted on tablets
- [ ] Touch interactions work on all devices

### ✅ Non-Functional Tests
- [ ] API response time < 1 second
- [ ] Payment screenshot upload < 2 seconds
- [ ] Database queries optimized
- [ ] No console errors
- [ ] Proper error messages to users
- [ ] Loading states display correctly

### ✅ Edge Cases
- [ ] Multiple interviews can be requested
- [ ] Empty notes field accepted
- [ ] Concurrent requests handled
- [ ] Session timeout handled
- [ ] Network error recovery
- [ ] Large file upload handling

---

## DEPLOYMENT CHECKLIST

**Backend (Node.js/Express):**
- Port: 5005
- Database: MongoDB Atlas
- Environment: Node.js v22
- Dependencies: express, axios, bcrypt, jwt, multer, mongoose

**Frontend (React):**
- Port: 3003
- Build: `npm run build`
- Dependencies: react, react-router-dom, axios
- Static files: `/public`

**API Configuration:**
```javascript
Backend: http://localhost:5005/api
Frontend API URL: http://localhost:5005/api
```

---

## KNOWN ISSUES & FIXES

### Issue: "Cannot read property 'id' of undefined"
**Solution:** Ensure user object exists in localStorage before accessing

### Issue: QR code not displaying
**Solution:** QR code should be at `/public/phonepe-qr.jpg` (absolute path)

### Issue: Payment proof not uploading
**Solution:** Check file size (< 5MB) and format (JPEG, PNG, PDF only)

---

## HOW TO RUN TESTS

```bash
# Start Backend
$env:PORT = '5005'
node api/index.js

# In another terminal, run tests
node test-video-interview-final.js

# Start Frontend (in another terminal)
npm start

# Frontend will be on: http://localhost:3003
```

---

**Last Updated:** January 24, 2026
**Version:** 1.0.0 (Production Ready)
