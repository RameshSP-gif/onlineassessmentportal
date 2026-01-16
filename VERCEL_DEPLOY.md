# 🚀 Vercel Deployment Guide

## Prerequisites
✅ Vercel CLI installed: `npm install -g vercel`
✅ MongoDB Atlas connection string in `.env`
✅ Code pushed to Git (optional but recommended)

## Quick Deploy Steps

### 1. Login to Vercel
```bash
vercel login
```
- Browser will open automatically
- Authorize the device with the code shown
- Click "Confirm" in browser

### 2. Deploy to Vercel
```bash
vercel
```
- First time: Answer setup questions
  - **Set up and deploy**: Yes
  - **Which scope**: Select your account
  - **Link to existing project**: No
  - **Project name**: online-assessment-portal (or your choice)
  - **Directory**: ./ (default)
  - **Override settings**: No

### 3. Set Environment Variables
After deployment, go to Vercel Dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add these variables:

```
MONGODB_URI = mongodb+srv://root:Rakshita%401234@cluster0.pp8rwbt.mongodb.net/assessmentdb?retryWrites=true&w=majority
JWT_SECRET = secret_key_123
NODE_ENV = production
```

### 4. Redeploy (if needed)
```bash
vercel --prod
```

## Alternative: One-Command Deploy

```bash
vercel --prod
```
This will deploy directly to production.

## Verify Deployment

After deployment, Vercel will provide URLs:
- **Preview**: `https://online-assessment-portal-xxxxx.vercel.app`
- **Production**: `https://onlineassessmentportal.vercel.app`

### Test These Endpoints:
1. Frontend: `https://your-app.vercel.app/`
2. Login: `https://your-app.vercel.app/login`
3. Register: `https://your-app.vercel.app/register`
4. Admin: `https://your-app.vercel.app/admin/dashboard`
5. API Health: `https://your-app.vercel.app/api/exams`

## Important Notes

### ✅ What's Already Configured:
- `vercel.json` - Deployment configuration
- `.env.production` - Production API URL set to `/api`
- `package.json` - Build script with `CI=false`
- MongoDB Atlas - Cloud database (no SQLite)

### ⚠️ Common Issues & Solutions:

**Issue 1: API Routes Not Working**
- Solution: Ensure `vercel.json` has correct API routing
- Check: `/api/*` routes go to `/api/index.js`

**Issue 2: Build Fails**
- Solution: Set `CI=false` in build script (already done)
- Check: `"vercel-build": "CI=false npm run build"`

**Issue 3: Environment Variables Not Working**
- Solution: Set them in Vercel Dashboard, not just in `.env`
- Go to: Project Settings → Environment Variables

**Issue 4: MongoDB Connection Fails**
- Solution: Whitelist Vercel IPs in MongoDB Atlas
- Go to: Network Access → Add IP → Allow Access from Anywhere (0.0.0.0/0)

**Issue 5: React Router 404s**
- Solution: Already configured in `vercel.json`
- Routes catch-all: `"src": "/.*", "dest": "/index.html"`

## GitHub Integration (Recommended)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Admin module complete - ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/OnlineAssessmentPortal.git
git push -u origin main
```

### Step 2: Link Vercel to GitHub
1. Go to Vercel Dashboard
2. Click "Import Project"
3. Select GitHub repository
4. Configure settings
5. Deploy

**Benefits:**
- Automatic deployments on push
- Preview deployments for branches
- Easy rollbacks
- CI/CD integration

## Manual Deployment (Current Method)

```bash
# From project root
cd C:\Per\OnlineAssessmentPortal

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test student login
- [ ] Test admin login (admin@test.com / admin123)
- [ ] Test exam taking
- [ ] Test admin dashboard
- [ ] Test student management
- [ ] Test exam creation
- [ ] Test fee management
- [ ] Test notifications
- [ ] Check all 7 exams are visible

## Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection |
| `JWT_SECRET` | `secret_key_123` | JWT signing secret |
| `NODE_ENV` | `production` | Environment flag |

## URLs After Deployment

### Local Development:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

### Vercel Production:
- Frontend: https://onlineassessmentportal.vercel.app
- Backend API: https://onlineassessmentportal.vercel.app/api
- Admin: https://onlineassessmentportal.vercel.app/admin/dashboard

## Monitoring & Logs

### View Deployment Logs:
```bash
vercel logs
```

### View Latest Deployment:
```bash
vercel ls
```

### View Project Info:
```bash
vercel inspect
```

## Rollback (if needed)

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote [deployment-url]
```

## Update Deployment

When you make changes:
```bash
# Deploy to preview first
vercel

# Test preview URL
# If good, deploy to production
vercel --prod
```

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

## Support

If deployment fails:
- Check Vercel logs: `vercel logs`
- Check MongoDB Atlas network access
- Verify environment variables in Vercel Dashboard
- Check build logs in Vercel Dashboard

## Success Indicators

✅ Build succeeds without errors
✅ All routes return 200 status
✅ MongoDB connection established
✅ API endpoints respond correctly
✅ Admin dashboard loads
✅ Student registration works
✅ Exams are visible

---

**Ready to deploy?**
```bash
vercel --prod
```

**Need help?**
- Vercel Docs: https://vercel.com/docs
- Check logs: `vercel logs`
- Status: https://vercel-status.com
