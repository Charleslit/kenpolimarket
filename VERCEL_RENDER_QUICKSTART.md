# ⚡ Vercel + Render Quick Start

Deploy KenPoliMarket in **15 minutes** using Vercel (frontend) and Render (backend).

---

## 🎯 Quick Overview

| Component | Platform | Cost | Time |
|-----------|----------|------|------|
| Frontend | Vercel | FREE | 5 min |
| Backend | Render | FREE/$7 | 10 min |
| Database | Render | FREE/$7 | Included |
| Redis | Render | FREE/$7 | Included |

**Total:** FREE to start, $7-21/month for production

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] Render account (sign up at [render.com](https://render.com))
- [ ] Your code pushed to GitHub

---

## Part 1: Deploy Backend to Render (10 minutes)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Verify email

### Step 2: One-Click Deploy with Blueprint

1. In Render dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Select the repository
4. Render will detect `render.yaml` and create:
   - ✅ PostgreSQL database
   - ✅ Redis instance
   - ✅ Backend web service
   - ✅ Celery workers (optional)

5. Click **"Apply"**
6. Wait 5-10 minutes for deployment

**OR Manual Setup:**

#### Create PostgreSQL
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `kenpolimarket-db`
3. Plan: Free or Starter ($7/month)
4. Click **"Create Database"**
5. Copy the **Internal Database URL**

#### Create Redis
1. Click **"New +"** → **"Redis"**
2. Name: `kenpolimarket-redis`
3. Plan: Free or Starter ($7/month)
4. Click **"Create Redis"**
5. Copy the **Internal Redis URL**

#### Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect GitHub repository
3. Configure:
   - **Name:** `kenpolimarket-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free or Starter ($7/month)

4. Add Environment Variables:
   ```
   DATABASE_URL=<paste-postgres-internal-url>
   REDIS_URL=<paste-redis-internal-url>
   ENVIRONMENT=production
   API_SECRET_KEY=<generate-random-32-chars>
   PYTHON_VERSION=3.11
   ```

5. Click **"Create Web Service"**

### Step 3: Initialize Database

Once deployed:
1. Go to your backend service
2. Click **"Shell"** tab
3. Run:
   ```bash
   python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

### Step 4: Note Your Backend URL

Your backend is now live at:
```
https://kenpolimarket-backend.onrender.com
```

Test it:
```
https://kenpolimarket-backend.onrender.com/api/docs
```

---

## Part 2: Deploy Frontend to Vercel (5 minutes)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Verify email

### Step 2: Deploy Frontend

1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure:
   - **Framework:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto)
   - **Output Directory:** `.next` (auto)

4. Add Environment Variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://kenpolimarket-backend.onrender.com/api`

5. Click **"Deploy"**

6. Wait 2-5 minutes

### Step 3: Your App is Live! 🎉

Vercel gives you a URL like:
```
https://kenpolimarket.vercel.app
```

---

## ✅ Verification

Test your deployment:

1. **Frontend:** https://kenpolimarket.vercel.app
2. **Backend API:** https://kenpolimarket-backend.onrender.com/api/docs
3. **Health Check:** https://kenpolimarket-backend.onrender.com/api/health

Check:
- [ ] Frontend loads
- [ ] County search works
- [ ] Charts render
- [ ] No CORS errors in browser console
- [ ] API responds to requests

---

## 🔧 Configuration Files Created

Your repository now has:

1. **`render.yaml`** - Render blueprint for one-click backend deployment
2. **`frontend/vercel.json`** - Vercel configuration
3. **`backend/main.py`** - Updated with Vercel CORS support

---

## 💰 Pricing Breakdown

### Free Tier (Testing)
- **Vercel:** FREE
  - 100GB bandwidth
  - Unlimited deployments
  - Automatic HTTPS
  
- **Render Backend:** FREE
  - 750 hours/month
  - Sleeps after 15 min inactivity
  - 512MB RAM
  
- **Render PostgreSQL:** FREE
  - 90 days free
  - 1GB storage
  
- **Render Redis:** FREE
  - 25MB storage

**Total:** FREE for 90 days

### Production Tier (Recommended)
- **Vercel:** FREE (or Pro $20/month for teams)
- **Render Backend:** $7/month (always on)
- **Render PostgreSQL:** $7/month
- **Render Redis:** $7/month

**Total:** $21/month

---

## 🚀 Automatic Deployments

Both platforms auto-deploy when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel and Render automatically deploy! 🎉
# No manual steps needed!
```

---

## 🔐 Environment Variables

### Render Backend
```env
DATABASE_URL=<from-render-postgres>
REDIS_URL=<from-render-redis>
ENVIRONMENT=production
API_SECRET_KEY=<random-32-chars>
PYTHON_VERSION=3.11
```

Generate API key:
```bash
openssl rand -hex 32
```

### Vercel Frontend
```env
NEXT_PUBLIC_API_URL=https://kenpolimarket-backend.onrender.com/api
```

---

## 🆘 Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check logs in Render dashboard
- Verify environment variables are set
- Check database connection

**Database connection errors**
- Ensure DATABASE_URL is correct
- Check PostgreSQL is running
- Initialize database schema

### Frontend Issues

**"Failed to fetch"**
- Check NEXT_PUBLIC_API_URL is correct
- Verify backend is running
- Check browser console for CORS errors

**Build fails**
- Check build logs in Vercel
- Verify package.json is correct
- Check Node version

### Free Tier Limitations

**Backend sleeps after 15 minutes**
- Upgrade to Starter plan ($7/month)
- Or ping backend every 10 minutes with cron job

**Cold starts (slow first request)**
- Normal on free tier
- Upgrade to paid plan for always-on

---

## 📊 Monitoring

### Render
- **Logs:** Dashboard → Service → Logs
- **Metrics:** Dashboard → Service → Metrics
- **Shell:** Dashboard → Service → Shell

### Vercel
- **Logs:** Dashboard → Project → Deployments → Logs
- **Analytics:** Dashboard → Project → Analytics
- **Real-time:** `vercel logs` (CLI)

---

## 🎯 Next Steps

1. **Custom Domain**
   - Add domain in Vercel settings
   - Add domain in Render settings
   - Update DNS records

2. **Database Backups**
   - Render auto-backups on paid plans
   - Or manual: Dashboard → Database → Backups

3. **Monitoring**
   - Set up Uptime Robot (free)
   - Monitor both frontend and backend

4. **Error Tracking**
   - Add Sentry for error tracking
   - Configure in both platforms

---

## 💡 Pro Tips

1. **Use Render's Internal URLs** for service-to-service communication
2. **Enable auto-deploy** on both platforms (default)
3. **Use preview deployments** on Vercel for testing
4. **Monitor free tier limits** to avoid surprises
5. **Set up health checks** on Render
6. **Use environment variables** for all config

---

## 🔄 Update Workflow

```bash
# 1. Make changes locally
git add .
git commit -m "Add new feature"

# 2. Push to GitHub
git push origin main

# 3. Automatic deployment!
# - Vercel deploys frontend (2-3 min)
# - Render deploys backend (5-7 min)

# 4. Check deployment status
# - Vercel: Dashboard → Deployments
# - Render: Dashboard → Events
```

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Render Community:** https://community.render.com
- **Vercel Discord:** https://vercel.com/discord

---

## ✅ Deployment Checklist

- [ ] Render account created
- [ ] Vercel account created
- [ ] Code pushed to GitHub
- [ ] PostgreSQL created on Render
- [ ] Redis created on Render
- [ ] Backend deployed to Render
- [ ] Database initialized
- [ ] Backend URL noted
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Frontend loads successfully
- [ ] Backend API accessible
- [ ] No CORS errors
- [ ] County search works
- [ ] Charts render correctly

---

**🎉 You're live on Vercel + Render!**

**Frontend:** https://kenpolimarket.vercel.app  
**Backend:** https://kenpolimarket-backend.onrender.com/api/docs

**Total time:** 15 minutes  
**Total cost:** FREE to start

Good luck! 🚀

