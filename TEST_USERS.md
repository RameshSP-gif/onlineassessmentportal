# Test User Credentials

## Quick Reference for Testing

All test users have been created in the database for easy testing. The system now uses only 2 roles: **HR** and **Student**.

### 👔 HR Users
- **Username:** `hr1` | **Password:** `hr123`
- **Username:** `hr2` | **Password:** `hr123`

**Features to Test:**
- Access HR dashboard
- Manage interview payments (approve/reject)
- Manage interview requests (approve/reject scheduling)
- View all system statistics
- Manage students and users

### 📚 Student Users
- **Username:** `student1` | **Password:** `student123`
- **Username:** `student2` | **Password:** `student123`

**Features to Test:**
- Browse available interview courses
- Pay ₹200 for interviews using QR code
- Upload payment proof
- Request interview schedules after payment approval
- Propose interview dates
- Join scheduled interviews
- View interview history and status

## Re-seeding Users

If you need to recreate all test users, run:

```bash
node api/reset-users.js
```

This script will:
- Delete all existing test users
- Create fresh HR and Student users
- Display all credentials after completion

## Login Process

1. Navigate to login page: `/login`
2. Enter username and password
3. System will redirect to appropriate dashboard based on role:
   - HR users → `/hr/dashboard`
   - Student users → `/dashboard`

## Testing Workflows

### Student Interview Flow
1. Login as `student1`
2. Navigate to "Browse Interviews" or click interview card on dashboard
3. Select an interview course
4. Click "Pay & Schedule Interview Now"
5. Upload payment screenshot
6. Wait for HR approval
7. After approval, propose interview date/time
8. Wait for HR to approve schedule

### HR Payment Approval Flow
1. Login as `hr1`
2. Go to HR Dashboard
3. Click "Interview Payments" card or navigate to `/hr/interview-payments`
4. Review pending payments
5. View payment proof screenshots
6. Approve or reject payments

### HR Schedule Approval Flow
1. Login as `hr1`
2. Go to HR Dashboard
3. Click "Interview Requests" card or navigate to `/hr/interview-requests`
4. Review pending schedule requests
5. Approve with confirmation or reject with reason
3. Create custom role (e.g., "moderator", "manager")
4. Add permissions
5. Edit role
6. Delete role
7. Assign custom role to users

## Notes

- All passwords are hashed with bcrypt in database
- Username must be unique across system
- Email can be duplicate
- Login uses username (not email)
- Admin has full access to all features
