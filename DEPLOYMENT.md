# Vercel Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`

### Important: Database Note
⚠️ **SQLite doesn't persist on Vercel's serverless environment.** Each function call creates a new database instance.

For production, use one of these options:
1. **Vercel Postgres** (recommended)
2. **MongoDB Atlas** (free tier available)
3. **PlanetScale** (MySQL, free tier)
4. **Supabase** (PostgreSQL, free tier)

## Option 1: Deploy with Vercel CLI (Fastest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel

# Follow the prompts:
# Set up and deploy? Yes
# Which scope? Select your account
# Link to existing project? No
# Project name? onlineassessmentportal
# Directory? ./
# Override settings? No

# Deploy to production
vercel --prod
```

## Option 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository: `RameshSP-gif/onlineassessmentportal`
3. Configure project:
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`
4. Add environment variables (optional):
   - `JWT_SECRET`: your_secure_jwt_secret
5. Click **Deploy**

## Option 3: Quick Deploy Button

Add this to your GitHub README for one-click deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RameshSP-gif/onlineassessmentportal)

## Upgrading to Persistent Database

### Using Vercel Postgres

1. In Vercel Dashboard → Storage → Create Database → Postgres
2. Copy connection string
3. Update `api/index.js` to use Postgres instead of SQLite
4. Install: `npm install pg`
5. Replace SQLite code with Postgres client

Example:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});
```

### Using MongoDB Atlas (Easiest)

1. Create free cluster at https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Add to Vercel environment variables: `MONGODB_URI`
4. Install: `npm install mongodb mongoose`
5. Update database code to use MongoDB

## After Deployment

1. **Seed Database:** You'll need to run seed script or manually create data
2. **Environment Variables:** Set `JWT_SECRET` in Vercel dashboard
3. **Custom Domain:** Add your domain in Vercel project settings
4. **Test:** Visit your deployed URL and test all features

## Current Deployment Setup

✅ Frontend: Static build deployed to Vercel CDN  
✅ Backend: Serverless function at `/api/*`  
⚠️ Database: SQLite (temporary, resets on deploy)  
✅ Routes: SPA routing configured  

## Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Can register/login users
- [ ] Exams are visible (if using persistent DB)
- [ ] Can take exams and submit
- [ ] Camera permissions work for interviews
- [ ] Admin panel accessible

## Troubleshooting

**Build fails:**
- Check `npm run build` works locally
- Verify all dependencies in package.json

**API not working:**
- Check `/api/health` endpoint
- Verify environment variables are set
- Check function logs in Vercel dashboard

**Database empty:**
- Run seed script after connecting persistent DB
- Or manually create admin user and exams

## Cost Estimate

- **Hobby Plan (Free):** Perfect for this project
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Serverless functions included
  - No credit card required

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
