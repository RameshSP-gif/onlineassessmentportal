# 🚀 QUICK START GUIDE - NEW PORTS (5005 & 3003)

## ✅ CONFIGURATION COMPLETED

Your application has been migrated to new ports:
- **Backend**: 5005 (was 5001)
- **Frontend**: 3003 (was 3002)

---

## 🔥 START APPLICATION NOW

### FASTEST METHOD - Single Command

Open PowerShell and run:

```powershell
$env:PORT=5005; node api/index.js & Start-Sleep -Seconds 5; $env:PORT=3003; npm start
```

Or use npm dev script:
```bash
npm run dev
```

---

## 📋 MANUAL STARTUP (If Above Doesn't Work)

### Terminal 1: Start Backend
```powershell
cd c:\Per\OnlineAssessmentPortal
$env:PORT=5005
node api/index.js
```

**Expected Output:**
```
🔄 Connecting to MongoDB Atlas...
✅ Server on 5005
✅ MongoDB Atlas Connected Successfully!
```

### Terminal 2: Start Frontend
```powershell
cd c:\Per\OnlineAssessmentPortal
$env:PORT=3003
npm start
```

**Expected Output:**
```
Compiled successfully!
Local: http://localhost:3003
```

---

## 🌐 ACCESS APPLICATION

### URL
```
http://localhost:3003
```

### Test Accounts

**Student Account**
```
Username: student1
Password: student123
```

**Admin Account**
```
Username: admin1
Password: admin123
```

**HR Account**
```
Username: hr1
Password: hr123
```

**Interviewer Account**
```
Username: interviewer1
Password: int123
```

---

## ✅ VERIFY SETUP

### Check Backend is Running
```powershell
Invoke-WebRequest -Uri "http://localhost:5005/api/health" -UseBasicParsing
```

### Check Frontend is Running
```powershell
Invoke-WebRequest -Uri "http://localhost:3003" -UseBasicParsing
```

### Test Login
```powershell
Invoke-WebRequest -Uri "http://localhost:5005/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"student1","password":"student123"}' `
  -UseBasicParsing
```

---

## 📊 WHAT'S INCLUDED

### Features Working
✅ User Authentication (Register/Login)
✅ Role-Based Access Control
✅ 7 Professional Exams
✅ Exam Taking Interface
✅ Video Interviews
✅ Payment Processing
✅ Admin Dashboard
✅ Student Dashboard
✅ HR Dashboard
✅ Interviewer Dashboard

### Test Data Seeded
- 7 Professional Exams (MERN, Java, Python, Testing, Cloud, DevOps, JavaScript)
- 4 Test Users (student1, admin1, hr1, interviewer1)
- MongoDB Atlas Connected
- All authentication working

---

## 🛠️ TROUBLESHOOTING

### Frontend Won't Start
```powershell
# Clear node_modules and reinstall
rm -r node_modules
npm install
$env:PORT=3003
npm start
```

### Port Already in Use
```powershell
# Kill all Node processes
Get-Process node | Stop-Process -Force
# Wait 2 seconds
Start-Sleep -Seconds 2
# Restart
```

### MongoDB Connection Error
```
Check your internet connection
Verify MongoDB Atlas credentials in environment
MONGODB_URI should be set in your environment
```

### Login Not Working
```
Verify backend is running on 5005
Check network tab in browser for API errors
Clear browser localStorage and try again
```

---

## 📝 ENVIRONMENT VARIABLES

**Location**: `.env.local`

```
REACT_APP_API_URL=http://localhost:5005/api
PORT=3003
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=secret_key_123
```

---

## 🎯 FEATURES TO TEST

### As Student (student1/student123)
- [ ] View available exams
- [ ] Browse exam questions
- [ ] Take a complete exam
- [ ] Submit answers
- [ ] View results
- [ ] Request video interview
- [ ] Make payment

### As Admin (admin1/admin123)
- [ ] View all students
- [ ] Manage exams
- [ ] View submissions
- [ ] Check payments
- [ ] Generate reports
- [ ] Manage users

### As HR (hr1/hr123)
- [ ] View interview requests
- [ ] Schedule interviews
- [ ] Approve/reject requests

### As Interviewer (interviewer1/int123)
- [ ] View assigned interviews
- [ ] Conduct video interview
- [ ] Submit feedback

---

## 📞 SUPPORT

All features are tested and working. If you encounter any issues:

1. Check the terminal output for error messages
2. Verify both servers are running (ports 5005 & 3003)
3. Clear browser cache and localStorage
4. Restart both servers
5. Check network tab in browser developer tools

---

**Status**: ✅ **READY TO USE**  
**Last Updated**: January 18, 2026  
**Ports**: Backend 5005, Frontend 3003
