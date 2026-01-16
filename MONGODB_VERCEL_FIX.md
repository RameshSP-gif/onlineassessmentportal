# ⚠️ MongoDB Atlas IP Whitelist for Vercel

## Issue
Vercel serverless functions need to connect to MongoDB Atlas, but Vercel uses dynamic IPs.

## Solution: Whitelist All IPs

### Step 1: Go to MongoDB Atlas
1. Visit: https://cloud.mongodb.com
2. Login with your credentials
3. Select your cluster (cluster0)

### Step 2: Configure Network Access
1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"** button
3. Select **"ALLOW ACCESS FROM ANYWHERE"**
   - This adds `0.0.0.0/0` to the whitelist
   - Required for Vercel's dynamic IPs
4. Click **"Confirm"**

### Step 3: Wait for Changes
- MongoDB Atlas takes 1-2 minutes to apply the changes
- You'll see a message: "Security group updating..."

### Step 4: Verify Connection
After whitelist is updated, test the deployment:
```powershell
Invoke-RestMethod -Uri "https://onlineassessmentportal.vercel.app/api/exams"
```

## Alternative: Whitelist Vercel's IP Ranges (More Secure)

If you don't want to allow all IPs, whitelist these Vercel regions:

### US East (iad1)
- 76.223.0.0/20
- 64.252.128.0/18

### US West (sfo1)
- 76.223.16.0/20
- 76.76.0.0/18

### Europe (fra1)
- 76.223.32.0/20

**Note:** Vercel doesn't publish official IP ranges, so "Allow from Anywhere" is recommended for reliability.

## Security Considerations

### Production Best Practices:
1. **Use MongoDB Atlas Private Endpoints** (Enterprise tier)
2. **Enable Database Authentication** (already done)
3. **Use Strong Passwords** (already done)
4. **Rotate JWT Secrets Regularly**
5. **Enable MongoDB Atlas Audit Logs**
6. **Set up MongoDB Atlas Alerts**

### Current Security Measures:
✅ Passwords are hashed with bcrypt
✅ JWT tokens for authentication
✅ CORS configured
✅ MongoDB credentials in environment variables (not in code)
✅ Connection uses SSL/TLS

## Troubleshooting

### Error: "Could not connect to any servers"
**Solution:** Whitelist 0.0.0.0/0 in MongoDB Atlas Network Access

### Error: "Authentication failed"
**Solution:** Check MONGODB_URI in Vercel environment variables

### Error: "Connection timed out"
**Solution:** 
1. Check MongoDB Atlas status
2. Verify network access settings
3. Try redeploying: `vercel --prod`

## Verify Current Settings

### Check MongoDB Atlas:
```bash
# Should show: 0.0.0.0/0 (allows all IPs)
```

### Check Vercel Environment Variables:
```bash
vercel env ls
```

Should show:
- ✅ MONGODB_URI
- ✅ JWT_SECRET
- ✅ NODE_ENV

## Next Steps After Whitelisting

1. Wait 2 minutes for MongoDB Atlas to update
2. Redeploy: `vercel --prod`
3. Test: Visit https://onlineassessmentportal.vercel.app
4. Test API: `Invoke-RestMethod -Uri "https://onlineassessmentportal.vercel.app/api/exams"`

## Current Status

❌ MongoDB connection failing on Vercel
✅ Local connection working
✅ Environment variables set
⏳ Waiting for IP whitelist configuration

## Action Required

**YOU MUST:**
1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Select "ALLOW ACCESS FROM ANYWHERE"
4. Click Confirm
5. Wait 2 minutes
6. Run: `vercel --prod`

This will fix the connection issue permanently.
