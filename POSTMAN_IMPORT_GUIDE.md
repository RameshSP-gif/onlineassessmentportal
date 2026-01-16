# POSTMAN COLLECTION IMPORT GUIDE

## Files Created:
1. `OnlineAssessmentPortal.postman_collection.json` - Complete API collection
2. `OnlineAssessmentPortal.postman_environment.json` - Environment variables

## How to Import in Postman:

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop `OnlineAssessmentPortal.postman_collection.json` OR click "Choose Files"
4. Click **Import**

### Step 2: Import Environment
1. Click **Environments** in left sidebar (or gear icon ⚙️ top right)
2. Click **Import**
3. Select `OnlineAssessmentPortal.postman_environment.json`
4. Click **Import**

### Step 3: Select Environment
1. Click the environment dropdown (top right)
2. Select **"Online Assessment - Local"**

## Collection Structure:

```
Online Assessment Portal
├── Authentication
│   ├── Register User (saves token & user_id automatically)
│   └── Login (saves token & user_id automatically)
├── Exams
│   ├── Get All Exams (saves exam_id automatically)
│   ├── Get Exam By ID (uses saved exam_id)
│   └── Submit Exam (uses saved exam_id, shows score)
├── Submissions
│   ├── Create Submission (uses saved exam_id & user_id)
│   └── Get User Submissions (uses saved user_id)
└── Interviews
    ├── Create Interview (uses saved user_id)
    └── Get User Interviews (uses saved user_id)
```

## How to Execute:

### Quick Test Flow (Recommended):
1. **Register User** → Saves token and user_id
2. **Get All Exams** → Saves exam_id
3. **Get Exam By ID** → View questions
4. **Submit Exam** → Get score
5. **Get User Submissions** → View history

### Manual Testing:
- Each endpoint can be run individually
- Variables are automatically populated from previous requests
- Check **Tests** tab to see auto-save scripts
- Check **Console** (bottom) to see saved variables

## Environment Variables:

| Variable | Description | Auto-Populated By |
|----------|-------------|-------------------|
| base_url | API base URL | Pre-configured |
| token | JWT auth token | Register/Login |
| user_id | Current user ID | Register/Login |
| username | Current username | Register |
| exam_id | Current exam ID | Get All Exams |
| submission_id | Last submission ID | Create Submission |
| interview_id | Last interview ID | Create Interview |

## Features:

✅ **Auto Variable Population**: Token, user_id, and exam_id are automatically saved
✅ **Console Logging**: See results in Postman console
✅ **Pre-configured Bodies**: Sample data included in all POST requests
✅ **Variable Usage**: All requests use {{variable}} syntax
✅ **Ready to Run**: No manual configuration needed

## Testing Different Users:

To test with a new user:
1. Change username/email in **Register User** body
2. Run **Register User**
3. New token and user_id will be saved automatically

## Production Testing:

To test against production:
1. Go to **Environments**
2. Edit **"Online Assessment - Local"**
3. Change `base_url` to: `https://onlineassessmentportal.vercel.app`
4. Save

## Troubleshooting:

**Connection Error:**
- Make sure backend is running: `node api/index.js`
- Check base_url is correct: `http://localhost:5001`

**Variables Not Saving:**
- Check **Tests** tab in requests
- Open Postman Console (View → Show Postman Console)
- Look for variable save messages

**401/404 Errors:**
- Run **Get All Exams** to refresh exam_id
- Run **Register User** to get new user_id and token

## Default Test Data:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Test Exam:**
- Title: JavaScript Basics
- Questions: 10
- Correct Answer: All 'a' options

## Support:

For issues, check:
1. Backend is running on port 5001
2. MongoDB Atlas is connected
3. Environment is selected in Postman
4. Variables are populated ({{exam_id}}, {{user_id}})
