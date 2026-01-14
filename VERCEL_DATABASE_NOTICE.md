# Important: Database Configuration for Vercel

## Current Status
Your application is deployed at: **https://onlineassessmentportal.vercel.app**

## SQLite Limitation on Vercel
⚠️ **Important**: SQLite databases do NOT persist on Vercel's serverless environment. Each function invocation creates a fresh database instance.

## What This Means
- Database will be empty on each cold start
- User registrations won't persist
- Exams won't be saved
- Submissions will be lost

## Solutions (Choose One)

### Option 1: MongoDB Atlas (Recommended - Free Tier Available)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0)
3. Get connection string
4. Install mongoose: `npm install mongoose`
5. Replace SQLite code with MongoDB/Mongoose
6. Add MONGODB_URI to Vercel environment variables

### Option 2: Vercel Postgres (Recommended)
1. Go to your Vercel project
2. Click "Storage" tab
3. Create a new Postgres database
4. Vercel will auto-inject connection variables
5. Replace sqlite3 with `@vercel/postgres` or `pg`
6. Update queries to use Postgres syntax

### Option 3: PlanetScale (MySQL)
1. Create free account at https://planetscale.com
2. Create a database
3. Get connection string
4. Install mysql2: `npm install mysql2`
5. Replace SQLite with MySQL queries
6. Add DATABASE_URL to Vercel

### Option 4: Supabase (Postgres)
1. Create free account at https://supabase.com
2. Create a project
3. Get connection details
4. Use `pg` or Supabase client
5. Add connection URL to Vercel

## Quick Test Setup (Temporary)
For testing the deployment, I can implement in-memory initialization that seeds data on cold start. This will:
- ✅ Allow immediate testing
- ✅ Work for demo purposes
- ❌ Not persist data between requests
- ❌ Reset on every cold start

## Next Steps
1. Choose a database solution above
2. I can help you migrate the code
3. Update Vercel environment variables
4. Redeploy

**Current Priority**: Choose which database solution you'd like, and I'll help you migrate!
