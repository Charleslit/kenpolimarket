# 🚀 START HERE - KenPoliMarket Deployment

## 👋 Welcome!

You're about to deploy **KenPoliMarket** - a comprehensive election forecasting platform for Kenya.

This guide will get you from zero to production in **10 minutes**.

---

## ⚡ Super Quick Start (10 Minutes)

### Step 1: Get a Server (2 minutes)

Go to [DigitalOcean](https://www.digitalocean.com) and create a Droplet:
- **Image:** Ubuntu 22.04 LTS
- **Plan:** Basic - $12/month (2GB RAM)
- **Region:** Choose closest to Kenya
- Click "Create Droplet"

**Note your server's IP address** (e.g., 123.45.67.89)

### Step 2: Connect to Server (1 minute)

```bash
ssh root@YOUR_SERVER_IP
```

### Step 3: Install Docker (2 minutes)

```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose
```

### Step 4: Clone Repository (1 minute)

```bash
git clone https://github.com/yourusername/kenpolimarket.git
cd kenpolimarket
```

### Step 5: Configure Environment (2 minutes)

```bash
# Copy environment template
cp .env.production.example .env.production

# Generate secure passwords
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)" >> .env.production
echo "API_SECRET_KEY=$(openssl rand -hex 32)" >> .env.production
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env.production

# Edit to add your server IP
nano .env.production
# Change: NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP/api
# Save: Ctrl+X, then Y, then Enter
```

### Step 6: Deploy! (2 minutes)

```bash
./deploy.sh
# Select option 1 (Fresh deployment)
# Wait for deployment to complete...
```

### Step 7: Access Your Application! ✅

Open your browser and visit:
- **Frontend:** `http://YOUR_SERVER_IP`
- **API Docs:** `http://YOUR_SERVER_IP/api/docs`

**🎉 You're live!**

---

## 📚 What Just Happened?

The deployment script just:
1. ✅ Built 7 Docker containers
2. ✅ Started PostgreSQL database
3. ✅ Started Redis cache
4. ✅ Started FastAPI backend (4 workers)
5. ✅ Started Next.js frontend
6. ✅ Started Celery workers
7. ✅ Started Nginx reverse proxy
8. ✅ Initialized database schema

---

## 🎯 Next Steps

### Immediate (Do Now)
1. **Test the application** - Click around, try the county search
2. **Check logs** - Run `./deploy.sh` and select option 4
3. **Bookmark your site** - Save the URL

### Today
1. **Set up a domain** (optional)
   - Point your domain to your server IP
   - Update `NEXT_PUBLIC_API_URL` in `.env.production`
   - Restart: `./deploy.sh` (option 2)

2. **Enable HTTPS** (recommended)
   - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) section "SSL/HTTPS Setup"
   - Takes 5 minutes with Let's Encrypt (free!)

3. **Set up monitoring**
   - Sign up for [Uptime Robot](https://uptimerobot.com) (free)
   - Monitor: `http://YOUR_SERVER_IP/health`

### This Week
1. **Configure backups**
   - Run `./deploy.sh` (option 5) daily
   - Store backups off-server

2. **Review security**
   - Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
   - Enable firewall: `ufw enable && ufw allow 22,80,443/tcp`

---

## 🔧 Common Commands

```bash
# View logs
./deploy.sh  # Select option 4

# Update application
git pull origin main
./deploy.sh  # Select option 2

# Backup database
./deploy.sh  # Select option 5

# Stop all services
./deploy.sh  # Select option 3

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Restart a specific service
docker-compose -f docker-compose.prod.yml restart backend
```

---

## 🆘 Troubleshooting

### Can't access the application?

**Check if services are running:**
```bash
docker-compose -f docker-compose.prod.yml ps
```
All services should show "Up"

**Check firewall:**
```bash
ufw status
ufw allow 80
ufw allow 443
```

**Check logs:**
```bash
./deploy.sh  # Select option 4
```

### Services won't start?

**Restart everything:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

**Check disk space:**
```bash
df -h
```

**Check memory:**
```bash
free -h
```

### Database errors?

**Restart PostgreSQL:**
```bash
docker-compose -f docker-compose.prod.yml restart postgres
```

**Check PostgreSQL logs:**
```bash
docker-compose -f docker-compose.prod.yml logs postgres
```

---

## 📖 Documentation

| Document | What It's For |
|----------|---------------|
| **START_HERE_DEPLOYMENT.md** | You are here! Quick start guide |
| **DEPLOYMENT_SUMMARY.md** | Overview of deployment package |
| **QUICK_DEPLOY.md** | Alternative quick deployment guide |
| **DEPLOYMENT_GUIDE.md** | Comprehensive deployment guide (300+ lines) |
| **DEPLOYMENT_CHECKLIST.md** | Pre/post deployment checklist |
| **README.md** | Project overview and features |

---

## 💡 Pro Tips

1. **Use the deployment script** - It handles everything automatically
2. **Check logs regularly** - `./deploy.sh` option 4
3. **Backup daily** - `./deploy.sh` option 5
4. **Update weekly** - `git pull && ./deploy.sh` option 2
5. **Monitor uptime** - Use Uptime Robot (free)
6. **Enable HTTPS** - Let's Encrypt is free and takes 5 minutes

---

## 🎊 Features Included

Your deployed application includes:

- ✅ **County Search** - Search counties by name or code (NEW!)
- ✅ **Interactive Map** - Click counties to view forecasts
- ✅ **Election Forecasts** - With uncertainty quantification
- ✅ **Regional Analysis** - Breakdown by region
- ✅ **Candidate Comparison** - Compare multiple candidates
- ✅ **National Dashboard** - Overview of all forecasts
- ✅ **PDF Export** - Export charts and data
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Real-time Updates** - Live data updates
- ✅ **API Documentation** - Interactive API docs

---

## 🔐 Security

Your deployment includes:

- ✅ Rate limiting (10 req/s API, 30 req/s general)
- ✅ Security headers (X-Frame-Options, etc.)
- ✅ CORS configuration
- ✅ Environment isolation
- ✅ SSL/HTTPS ready
- ✅ Database not exposed to internet
- ✅ Docker network isolation

---

## 📊 What's Running

Your server is now running:

1. **Nginx** - Reverse proxy (ports 80/443)
2. **Frontend** - Next.js app (port 3000)
3. **Backend** - FastAPI (port 8000)
4. **PostgreSQL** - Database (port 5432)
5. **Redis** - Cache (port 6379)
6. **Celery Worker** - Async tasks
7. **Celery Beat** - Scheduled jobs

**Total:** 7 Docker containers

---

## 💰 Costs

### Minimum Setup
- **DigitalOcean Droplet:** $12/month
- **Domain (optional):** $10-15/year
- **SSL Certificate:** FREE (Let's Encrypt)
- **Total:** ~$12/month

### Recommended Setup
- **DigitalOcean Droplet:** $24/month (4GB RAM)
- **Domain:** $10-15/year
- **Monitoring:** FREE (Uptime Robot)
- **Backups:** Included in droplet price
- **Total:** ~$24/month

---

## 🚀 Scaling Up

When you need more power:

1. **Resize Droplet** - DigitalOcean makes this easy
2. **Add More Workers** - `docker-compose up -d --scale celery-worker=3`
3. **Add Load Balancer** - For multiple servers
4. **Use Managed Database** - DigitalOcean Managed PostgreSQL

---

## 📞 Need Help?

1. **Check logs:** `./deploy.sh` (option 4)
2. **Read docs:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. **Review checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
4. **Open issue:** GitHub issues

---

## ✅ Deployment Checklist

Quick checklist to ensure everything is working:

- [ ] All services running (`docker-compose -f docker-compose.prod.yml ps`)
- [ ] Frontend accessible (`http://YOUR_SERVER_IP`)
- [ ] API docs accessible (`http://YOUR_SERVER_IP/api/docs`)
- [ ] Health check working (`curl http://YOUR_SERVER_IP/health`)
- [ ] County search works
- [ ] Charts render correctly
- [ ] No errors in logs
- [ ] Mobile view works

---

## 🎉 You're Done!

Your KenPoliMarket instance is now live and ready for users!

**Share it:**
- Frontend: `http://YOUR_SERVER_IP`
- API: `http://YOUR_SERVER_IP/api/docs`

**Maintain it:**
- Check logs: `./deploy.sh` (option 4)
- Backup: `./deploy.sh` (option 5)
- Update: `./deploy.sh` (option 2)

---

**Questions? Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed information.**

**Happy deploying! 🚀🎊**

