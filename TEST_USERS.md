# Test User Credentials

## Quick Reference for Testing

All test users have been created in the database for easy testing of all functionalities.

### 👨‍💼 Admin Users
- **Username:** `admin1` | **Password:** `admin123`
- **Username:** `admin2` | **Password:** `admin123`

**Features to Test:**
- Access admin dashboard
- Manage roles (CRUD)
- Manage users (CRUD)
- Assign roles to users
- Manage exams
- Verify payments
- View reports

### 👔 HR Users
- **Username:** `hr1` | **Password:** `hr123`
- **Username:** `hr2` | **Password:** `hr123`

**Features to Test:**
- View interview requests
- Approve/reject interview requests
- Assign interviewers
- Schedule interviews
- HR dashboard statistics

### 🎤 Interviewer Users
- **Username:** `interviewer1` | **Password:** `int123`
- **Username:** `interviewer2` | **Password:** `int123`

**Features to Test:**
- View assigned interviews
- Conduct video interviews
- Record interview sessions
- Provide feedback
- Review past interviews

### 📚 Student Users
- **Username:** `student1` | **Password:** `student123`
- **Username:** `student2` | **Password:** `student123`

**Features to Test:**
- Take exams
- Submit answers
- View results
- Request interviews (Human/AI)
- Propose interview dates
- Join scheduled interviews
- View interview history

## Re-seeding Users

If you need to recreate all test users, run:

```bash
npm run seed-users
```

This script will:
- Skip existing users (won't duplicate)
- Create missing test users
- Display all credentials after completion

## Login Process

1. Navigate to appropriate login page:
   - Students/Admin: `/login`
   - Interviewers: `/interviewer/login`
   - HR: `/hr/login` (when implemented)

2. Enter username and password (not email!)

3. System will redirect to appropriate dashboard based on role

## Testing Role Assignment

1. Login as `admin1` or `admin2`
2. Navigate to `/admin/users`
3. Select any user
4. Click "Assign Role"
5. Choose a different role
6. Verify role change in user list

## Testing User Management

1. Login as admin
2. Navigate to `/admin/users`
3. Create new user
4. Edit existing user
5. Delete user
6. Search/filter users

## Testing Role Management

1. Login as admin
2. Navigate to `/admin/roles`
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
