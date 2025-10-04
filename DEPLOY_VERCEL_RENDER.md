# 🚀 Deploy to Vercel (Frontend) + Render (Backend)

This guide shows you how to deploy KenPoliMarket using:
- **Vercel** for the Next.js frontend (FREE tier available)
- **Render** for the FastAPI backend + PostgreSQL + Redis (FREE tier available)

**Total Cost:** FREE to start, ~$7-25/month for production

---

## 📋 Overview

### Architecture
```
Users → Vercel (Frontend) → Render (Backend) → Render PostgreSQL + Redis
```

### Advantages
- ✅ **Free tier available** for both platforms
- ✅ **Automatic deployments** from GitHub
- ✅ **Built-in SSL/HTTPS** on both platforms
- ✅ **Global CDN** (Vercel)
- ✅ **Easy scaling** as you grow
- ✅ **No server management** required

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend for Render

First, let's create a Render-specific configuration file:

```bash
cd backend
```

Create `render.yaml` in the backend directory (I'll create this for you below).

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 3: Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `kenpolimarket-db`
   - **Database:** `kenpolimarket`
   - **User:** `kenpolimarket`
   - **Region:** Choose closest to your users
   - **Plan:** Free (or Starter $7/month for production)
3. Click **"Create Database"**
4. **Save the Internal Database URL** (you'll need this)

### Step 4: Create Redis Instance

1. Click **"New +"** → **"Redis"**
2. Configure:
   - **Name:** `kenpolimarket-redis`
   - **Region:** Same as PostgreSQL
   - **Plan:** Free (or Starter $7/month)
3. Click **"Create Redis"**
4. **Save the Internal Redis URL**

### Step 5: Deploy Backend Web Service

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

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable"
   
   ```
   DATABASE_URL=<your-postgres-internal-url>
   REDIS_URL=<your-redis-internal-url>
   ENVIRONMENT=production
   API_SECRET_KEY=<generate-with-openssl-rand-hex-32>
   PYTHON_VERSION=3.11
   ```

5. Click **"Create Web Service"**

6. Wait for deployment (5-10 minutes)

7. **Note your backend URL:** `https://kenpolimarket-backend.onrender.com`

### Step 6: Initialize Database

Once deployed, go to your backend service:
1. Click **"Shell"** tab
2. Run:
   ```bash
   python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend for Vercel

Vercel automatically detects Next.js projects, but let's ensure configuration is correct.

Your `frontend/next.config.ts` is already configured with `output: 'standalone'` ✅

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 3: Deploy Frontend

#### Option A: Via Vercel Dashboard (Easiest)

1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)

4. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://kenpolimarket-backend.onrender.com/api
   ```

5. Click **"Deploy"**

6. Wait for deployment (2-5 minutes)

7. **Your app is live!** Vercel will give you a URL like:
   `https://kenpolimarket.vercel.app`

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod

# When prompted:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? kenpolimarket
# - Directory? ./
# - Override settings? No

# Add environment variable
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://kenpolimarket-backend.onrender.com/api
# Select: Production
```

### Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your domain
4. Follow DNS configuration instructions

---

## Part 3: Deploy Celery Workers (Optional)

For background tasks, deploy Celery workers on Render:

### Celery Worker

1. Click **"New +"** → **"Background Worker"**
2. Configure:
   - **Name:** `kenpolimarket-celery-worker`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `celery -A tasks.celery_app worker --loglevel=info`
   - **Environment Variables:** Same as backend

### Celery Beat (Scheduler)

1. Click **"New +"** → **"Background Worker"**
2. Configure:
   - **Name:** `kenpolimarket-celery-beat`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `celery -A tasks.celery_app beat --loglevel=info`
   - **Environment Variables:** Same as backend

---

## 🔧 Configuration Summary

### Render Backend Environment Variables
```env
DATABASE_URL=<from-render-postgres>
REDIS_URL=<from-render-redis>
ENVIRONMENT=production
API_SECRET_KEY=<generate-random-32-chars>
PYTHON_VERSION=3.11
```

### Vercel Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=https://kenpolimarket-backend.onrender.com/api
```

---

## 💰 Pricing

### Free Tier (Good for Testing)
- **Vercel:** FREE (100GB bandwidth, unlimited deployments)
- **Render Backend:** FREE (750 hours/month, sleeps after 15 min inactivity)
- **Render PostgreSQL:** FREE (90 days, then $7/month)
- **Render Redis:** FREE (25MB)
- **Total:** FREE for 90 days, then $7/month

### Production Tier (Recommended)
- **Vercel:** FREE (or Pro $20/month for team features)
- **Render Backend:** $7/month (always on, 512MB RAM)
- **Render PostgreSQL:** $7/month (1GB storage)
- **Render Redis:** $7/month (25MB)
- **Celery Workers:** $7/month each (optional)
- **Total:** $21-35/month

---

## 🚀 Deployment Workflow

### Initial Deployment
1. ✅ Create Render PostgreSQL
2. ✅ Create Render Redis
3. ✅ Deploy Backend to Render
4. ✅ Initialize database
5. ✅ Deploy Frontend to Vercel
6. ✅ Test application

### Updates (Automatic!)
```bash
# Just push to GitHub
git add .
git commit -m "Update feature"
git push origin main

# Vercel and Render auto-deploy! 🎉
```

---

## ✅ Verification Checklist

After deployment:

- [ ] Backend accessible: `https://kenpolimarket-backend.onrender.com/api/docs`
- [ ] Frontend accessible: `https://kenpolimarket.vercel.app`
- [ ] Health check works: `https://kenpolimarket-backend.onrender.com/api/health`
- [ ] Frontend can fetch data from backend
- [ ] County search works
- [ ] Charts render correctly
- [ ] No CORS errors in browser console
- [ ] Mobile responsive

---

## 🔐 Security Notes

### CORS Configuration

Your backend needs to allow requests from Vercel. Update `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kenpolimarket.vercel.app",
        "https://*.vercel.app",  # For preview deployments
        "http://localhost:3000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🆘 Troubleshooting

### Backend Issues

**Service won't start:**
- Check logs in Render dashboard
- Verify all environment variables are set
- Check `requirements.txt` is complete

**Database connection errors:**
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure database is initialized

### Frontend Issues

**Can't connect to backend:**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify CORS is configured
- Check backend is running

**Build fails:**
- Check build logs in Vercel
- Verify all dependencies in `package.json`
- Check Node version compatibility

### Free Tier Limitations

**Backend sleeps after 15 minutes:**
- Upgrade to Starter plan ($7/month)
- Or use a cron job to ping every 10 minutes

**Database expires after 90 days:**
- Upgrade to paid plan ($7/month)
- Or export/import data to new free instance

---

## 📊 Monitoring

### Render
- View logs: Dashboard → Service → Logs
- Metrics: Dashboard → Service → Metrics
- Shell access: Dashboard → Service → Shell

### Vercel
- View logs: Dashboard → Project → Deployments → Logs
- Analytics: Dashboard → Project → Analytics
- Real-time logs: `vercel logs`

---

## 🎯 Next Steps

1. **Set up custom domain** on both platforms
2. **Configure monitoring** (Render has built-in metrics)
3. **Set up database backups** (Render auto-backups on paid plans)
4. **Enable preview deployments** (automatic on Vercel)
5. **Add error tracking** (Sentry, LogRocket, etc.)

---

## 💡 Pro Tips

1. **Use Render's Internal URLs** for service-to-service communication
2. **Enable auto-deploy** on both platforms (push to deploy)
3. **Use environment variables** for all configuration
4. **Monitor free tier limits** to avoid surprises
5. **Set up health checks** on Render
6. **Use Vercel preview deployments** for testing

---

## 🔄 CI/CD Pipeline

Both platforms support automatic deployments:

```
Developer pushes to GitHub
         ↓
GitHub triggers webhook
         ↓
    ┌────┴────┐
    ↓         ↓
Vercel    Render
deploys   deploys
frontend  backend
    ↓         ↓
    └────┬────┘
         ↓
   Live in 2-5 minutes!
```

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Render Community:** https://community.render.com
- **Vercel Discord:** https://vercel.com/discord

---

**🎉 You're ready to deploy to Vercel + Render!**

**Start with:** Part 1 (Backend to Render) → Part 2 (Frontend to Vercel)

**Total time:** 20-30 minutes

Good luck! 🚀

