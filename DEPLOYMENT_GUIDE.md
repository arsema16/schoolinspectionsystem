# Deployment Guide

This guide will help you deploy the School Longitudinal Inspection System to various platforms.

## Prerequisites

- Git installed
- GitHub account
- MongoDB Atlas account (free tier available)
- Node.js 14+ installed locally for testing

## Step 1: Push to GitHub

1. Create a new repository on GitHub (don't initialize with README)

2. Add the remote and push:
```bash
git remote add origin https://github.com/yourusername/school-inspection-system.git
git branch -M main
git push -u origin main
```

## Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with password
4. Whitelist all IP addresses (0.0.0.0/0) for deployment
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## Step 3: Deploy to Render (Recommended - Free Tier Available)

### Why Render?
- Free tier available
- Easy deployment from GitHub
- Automatic HTTPS
- Good for Node.js apps

### Steps:

1. Go to [Render](https://render.com) and sign up

2. Click "New +" → "Web Service"

3. Connect your GitHub repository

4. Configure the service:
   - **Name**: school-inspection-system
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A random secure string (e.g., `your_super_secret_key_12345`)
   - `NODE_ENV`: `production`

6. Click "Create Web Service"

7. Wait for deployment (5-10 minutes)

8. Once deployed, run these commands in the Render Shell:
```bash
node seedAdmin.js
node importStudents.js 2015.xlsx
node importStudents.js 2016.xlsx
node importStudents.js 2017.xlsx
```

9. Your app will be live at: `https://school-inspection-system.onrender.com`

## Step 4: Deploy to Heroku (Alternative)

### Prerequisites:
- Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

### Steps:

1. Login to Heroku:
```bash
heroku login
```

2. Create a new app:
```bash
heroku create school-inspection-system
```

3. Set environment variables:
```bash
heroku config:set MONGODB_URI="your_mongodb_connection_string"
heroku config:set JWT_SECRET="your_super_secret_key"
heroku config:set NODE_ENV="production"
```

4. Deploy:
```bash
git push heroku main
```

5. Seed the database:
```bash
heroku run node seedAdmin.js
heroku run node importStudents.js 2015.xlsx
heroku run node importStudents.js 2016.xlsx
heroku run node importStudents.js 2017.xlsx
```

6. Open your app:
```bash
heroku open
```

## Step 5: Deploy to Railway (Alternative)

1. Go to [Railway](https://railway.app) and sign up

2. Click "New Project" → "Deploy from GitHub repo"

3. Select your repository

4. Add environment variables in the Variables tab:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`

5. Railway will automatically deploy

6. Get your deployment URL from the Settings tab

## Step 6: Deploy to Vercel (Alternative - Requires Serverless Setup)

Note: Vercel is optimized for serverless functions. You'll need to modify the app structure.

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts and add environment variables

## Post-Deployment Checklist

After deploying to any platform:

1. ✅ Test login with admin credentials:
   - Username: `admin`
   - Password: `admin123`

2. ✅ Verify data import:
   - Check dashboard shows 1,137 students
   - Verify all 3 years (2015-2017) are available

3. ✅ Test key features:
   - Apply filters (year, grade, subject)
   - View red flags
   - Check predictions
   - Generate PDF report

4. ✅ Create a new Inspector user for testing

5. ✅ Change admin password immediately!

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
- Check your MongoDB Atlas connection string
- Ensure IP whitelist includes 0.0.0.0/0
- Verify database user credentials

### Issue: "Application Error" or crashes
- Check logs: `heroku logs --tail` (Heroku) or view logs in Render dashboard
- Verify all environment variables are set
- Ensure Node.js version compatibility

### Issue: "Data not showing"
- Run seed and import scripts again
- Check MongoDB Atlas to verify data exists
- Clear browser cache

### Issue: "PDF generation fails"
- Ensure write permissions for reports folder
- Check server logs for specific errors

## Security Recommendations

1. **Change Default Admin Password**: Immediately after deployment
2. **Use Strong JWT Secret**: Generate a random 32+ character string
3. **Enable MongoDB Authentication**: Use strong passwords
4. **Regular Backups**: Set up MongoDB Atlas automated backups
5. **Monitor Logs**: Check for suspicious activity
6. **Update Dependencies**: Run `npm audit fix` regularly

## Updating Your Deployment

When you make changes:

1. Commit changes:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

2. Most platforms auto-deploy on push to main branch

3. For manual deployment:
   - Render: Automatic on git push
   - Heroku: `git push heroku main`
   - Railway: Automatic on git push

## Custom Domain Setup

### Render:
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed

### Heroku:
```bash
heroku domains:add www.yourdomain.com
```
Then update your DNS settings

## Monitoring and Maintenance

- **Render**: View logs in dashboard
- **Heroku**: `heroku logs --tail`
- **Railway**: View logs in deployment tab

Set up monitoring alerts for:
- Server downtime
- High error rates
- Database connection issues

## Cost Estimates

### Free Tier Options:
- **Render**: Free (sleeps after 15 min inactivity)
- **Railway**: $5 credit/month (usually enough for small apps)
- **Heroku**: Free tier discontinued, starts at $7/month
- **MongoDB Atlas**: Free tier (512MB storage)

### Recommended for Production:
- **Render**: $7/month (always on)
- **MongoDB Atlas**: Free tier sufficient for 1,000-5,000 students

## Support

If you encounter issues:
1. Check the logs first
2. Review this guide
3. Check MongoDB Atlas connection
4. Verify environment variables
5. Test locally with same environment variables

## Next Steps

After successful deployment:
1. Share the URL with stakeholders
2. Train users on the system
3. Set up regular data imports
4. Monitor system performance
5. Collect user feedback for improvements
