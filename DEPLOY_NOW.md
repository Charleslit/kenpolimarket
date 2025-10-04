# 🚀 Deploy KenPoliMarket NOW - Complete Workflow

Follow these steps to deploy your application to Vercel + Render.

---

## 📋 Current Status

✅ **Code committed locally** (108 files, 30,243 lines)  
✅ **Deployment configs ready** (Vercel + Render)  
✅ **County search feature added**  
⏳ **Waiting to push to GitHub**  
⏳ **Waiting to deploy**

---

## 🎯 Complete Deployment Workflow

### Phase 1: Push to GitHub (5 minutes)

#### Step 1.1: Create GitHub Repository

A browser window should be open at https://github.com/new

Configure:
- **Repository name:** `kenpolimarket`
- **Description:** `Kenya Political Forecasting & Analysis Platform`
- **Visibility:** Public (recommended) or Private
- **DO NOT** check any initialization options
- Click **"Create repository"**

#### Step 1.2: Push Your Code

After creating the repository, GitHub will show you commands. Run these:

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/kenpolimarket.git

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your GitHub username!**

If asked for credentials:
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (not your password)
  - Create one at: https://github.com/settings/tokens
  - Select scope: `repo`

---

### Phase 2: Deploy Backend to Render (10 minutes)

#### Step 2.1: Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with GitHub (recommended)
4. Authorize Render to access your repositories

#### Step 2.2: Deploy Using Blueprint (Easiest!)

1. In Render dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository: `kenpolimarket`
3. Render will detect `render.yaml` and show:
   - ✅ PostgreSQL database
   - ✅ Redis instance
   - ✅ Backend web service
   - ✅ Celery workers (optional)
4. Review the services
5. Click **"Apply"**
6. Wait 5-10 minutes for deployment

**OR Manual Setup:**

<details>
<summary>Click to expand manual setup instructions</summary>

#### Create PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `kenpolimarket-db`
   - **Database:** `kenpolimarket`
   - **User:** `kenpolimarket`
   - **Region:** Oregon (or closest to you)
   - **Plan:** Free (or Starter $7/month)
3. Click **"Create Database"**
4. **Copy the Internal Database URL** (starts with `postgresql://`)

#### Create Redis Instance
1. Click **"New +"** → **"Redis"**
2. Configure:
   - **Name:** `kenpolimarket-redis`
   - **Region:** Same as PostgreSQL
   - **Plan:** Free (or Starter $7/month)
3. Click **"Create Redis"**
4. **Copy the Internal Redis URL** (starts with `redis://`)

#### Deploy Backend Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `kenpolimarket-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free (or Starter $7/month)

4. Click **"Advanced"** → Add Environment Variables:
   ```
   DATABASE_URL=<paste-postgres-internal-url>
   REDIS_URL=<paste-redis-internal-url>
   ENVIRONMENT=production
   API_SECRET_KEY=<generate-random-32-chars>
   PYTHON_VERSION=3.11
   ```

   Generate API key:
   ```bash
   openssl rand -hex 32
   ```

5. Click **"Create Web Service"**

</details>

#### Step 2.3: Initialize Database

Once backend is deployed:

1. Go to your backend service in Render
2. Click **"Shell"** tab (top right)
3. Run this command:
   ```bash
   python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```
4. You should see: "Tables created successfully" or similar

#### Step 2.4: Note Your Backend URL

Your backend is now live at:
```
https://kenpolimarket-backend.onrender.com
```

Test it by visiting:
```
https://kenpolimarket-backend.onrender.com/api/docs
```

You should see the API documentation!

---

### Phase 3: Deploy Frontend to Vercel (5 minutes)

#### Step 3.1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your repositories

#### Step 3.2: Deploy Frontend

1. Click **"Add New..."** → **"Project"**
2. Find and import your `kenpolimarket` repository
3. Configure:
   - **Framework Preset:** Next.js (auto-detected ✅)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected ✅)
   - **Output Directory:** `.next` (auto-detected ✅)

4. **Add Environment Variable:**
   - Click **"Environment Variables"**
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://kenpolimarket-backend.onrender.com/api`
   - Click **"Add"**

5. Click **"Deploy"**

6. Wait 2-5 minutes for deployment

#### Step 3.3: Your App is Live! 🎉

Vercel will give you a URL like:
```
https://kenpolimarket.vercel.app
```

Or with your username:
```
https://kenpolimarket-YOUR_USERNAME.vercel.app
```

---

## ✅ Verification Checklist

After deployment, verify everything works:

### Backend Checks
- [ ] Visit: `https://kenpolimarket-backend.onrender.com/api/docs`
- [ ] API documentation loads
- [ ] Health check works: `https://kenpolimarket-backend.onrender.com/api/health`
- [ ] No errors in Render logs

### Frontend Checks
- [ ] Visit: `https://kenpolimarket.vercel.app`
- [ ] Homepage loads
- [ ] Navigate to Forecasts page
- [ ] County search works
- [ ] Interactive map displays
- [ ] Charts render correctly
- [ ] No CORS errors in browser console (F12)

### Integration Checks
- [ ] Frontend can fetch data from backend
- [ ] County data loads
- [ ] Election forecasts display
- [ ] Regional breakdown works
- [ ] Candidate comparison works

---

## 🎯 Post-Deployment Tasks

### Immediate (Do Now)

1. **Test all features:**
   - County search
   - Interactive map
   - Forecasts
   - Charts
   - PDF export

2. **Check logs:**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Project → Deployments → Logs

3. **Bookmark your URLs:**
   - Frontend: `https://kenpolimarket.vercel.app`
   - Backend: `https://kenpolimarket-backend.onrender.com/api/docs`

### Today

1. **Set up custom domain** (optional):
   - Vercel: Settings → Domains
   - Render: Settings → Custom Domain

2. **Configure monitoring:**
   - Sign up for [Uptime Robot](https://uptimerobot.com) (free)
   - Monitor both frontend and backend

3. **Share with users:**
   - Send them the Vercel URL
   - Collect feedback

### This Week

1. **Set up backups:**
   - Render auto-backups on paid plans
   - Or manual backups via Render dashboard

2. **Review analytics:**
   - Vercel Analytics (free)
   - Check usage patterns

3. **Optimize performance:**
   - Review Vercel insights
   - Check Render metrics

---

## 💰 Cost Summary

### Free Tier (What You're Using Now)
- **Vercel:** FREE
  - 100GB bandwidth
  - Unlimited deployments
  - Automatic HTTPS
  
- **Render Backend:** FREE
  - 750 hours/month
  - Sleeps after 15 min inactivity
  - 512MB RAM
  
- **Render PostgreSQL:** FREE
  - 90 days free trial
  - 1GB storage
  
- **Render Redis:** FREE
  - 25MB storage

**Total: FREE for 90 days**

### When to Upgrade

Upgrade to paid plans when:
- ❌ Backend cold starts are annoying users
- ❌ Database free trial expires (90 days)
- ❌ You need more storage/bandwidth
- ❌ You want guaranteed uptime

**Paid tier: $21/month** (Render: $7 backend + $7 DB + $7 Redis)

---

## 🔄 Automatic Deployments

Both platforms auto-deploy when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Vercel and Render automatically deploy! 🎉
# No manual steps needed!
```

---

## 🆘 Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check Render logs: Dashboard → Service → Logs
- Verify environment variables are set
- Check database connection

**Database connection errors**
- Ensure DATABASE_URL is correct
- Check PostgreSQL is running
- Initialize database schema (Step 2.3)

### Frontend Issues

**"Failed to fetch" or CORS errors**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check browser console (F12) for errors

**Build fails**
- Check Vercel build logs
- Verify `package.json` is correct
- Check Node version compatibility

### Free Tier Limitations

**Backend sleeps after 15 minutes**
- First request after sleep takes 5-10 seconds
- Upgrade to Starter plan ($7/month) for always-on
- Or ping backend every 10 minutes with cron job

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Render Community:** https://community.render.com
- **Vercel Discord:** https://vercel.com/discord

---

## 🎊 You're Done!

Once all three phases are complete, your application is live!

**Share these URLs:**
- **Frontend:** https://kenpolimarket.vercel.app
- **API Docs:** https://kenpolimarket-backend.onrender.com/api/docs

**Next steps:**
- Test thoroughly
- Share with users
- Collect feedback
- Iterate and improve

---

**Good luck with your deployment! 🚀**

