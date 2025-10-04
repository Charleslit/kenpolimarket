# 🚀 KenPoliMarket Deployment Guide

This guide covers deploying KenPoliMarket to production using Docker.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deployment (Docker)](#quick-deployment-docker)
3. [Cloud Deployment Options](#cloud-deployment-options)
4. [Environment Configuration](#environment-configuration)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Git**
- A server with at least:
  - 2 CPU cores
  - 4GB RAM
  - 20GB disk space
  - Ubuntu 20.04+ or similar Linux distribution

### Domain & DNS (Optional but Recommended)
- A domain name pointing to your server's IP address
- SSL certificate (can use Let's Encrypt for free)

---

## Quick Deployment (Docker)

### Step 1: Clone the Repository

```bash
# SSH into your server
ssh user@your-server-ip

# Clone the repository
git clone https://github.com/yourusername/kenpolimarket.git
cd kenpolimarket
```

### Step 2: Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production.example .env.production

# Edit the environment file
nano .env.production
```

**Important:** Change these values:
- `POSTGRES_PASSWORD` - Use a strong password
- `API_SECRET_KEY` - Generate with: `openssl rand -hex 32`
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -hex 32`
- `NEXT_PUBLIC_API_URL` - Your domain or server IP

Example `.env.production`:
```env
POSTGRES_PASSWORD=MySecurePassword123!
API_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
NEXTAUTH_SECRET=p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
NEXT_PUBLIC_API_URL=http://your-domain.com/api
```

### Step 3: Build and Start Services

```bash
# Build all Docker images
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check if all services are running
docker-compose -f docker-compose.prod.yml ps
```

You should see all services running:
- `kenpolimarket-postgres-prod`
- `kenpolimarket-redis-prod`
- `kenpolimarket-backend-prod`
- `kenpolimarket-frontend-prod`
- `kenpolimarket-celery-prod`
- `kenpolimarket-celery-beat-prod`
- `kenpolimarket-nginx`

### Step 4: Initialize Database

```bash
# Wait for PostgreSQL to be ready (about 10 seconds)
sleep 10

# Initialize the database schema
docker-compose -f docker-compose.prod.yml exec postgres psql -U kenpolimarket -d kenpolimarket -f /docker-entrypoint-initdb.d/schema.sql
```

### Step 5: Verify Deployment

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test the application
curl http://localhost/health
curl http://localhost/api/health
```

Visit your server:
- **Frontend:** http://your-server-ip or http://your-domain.com
- **API Docs:** http://your-server-ip/api/docs

---

## Cloud Deployment Options

### Option 1: AWS EC2

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.medium or larger
   - Security Group: Allow ports 80, 443, 22

2. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

3. **Follow Quick Deployment steps above**

4. **Configure Elastic IP** (optional but recommended)

### Option 2: DigitalOcean Droplet

1. **Create Droplet**
   - Image: Ubuntu 22.04
   - Plan: Basic ($12/month or higher)
   - Add SSH key

2. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Follow Quick Deployment steps above**

### Option 3: Google Cloud Platform (GCP)

1. **Create Compute Engine VM**
   - Machine type: e2-medium or larger
   - Boot disk: Ubuntu 22.04 LTS
   - Firewall: Allow HTTP and HTTPS traffic

2. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

3. **Follow Quick Deployment steps above**

### Option 4: Vercel (Frontend Only) + Backend on Cloud

**Frontend on Vercel:**
```bash
cd frontend
vercel --prod
```

**Backend on Railway/Render:**
- Connect your GitHub repository
- Set environment variables
- Deploy automatically

---

## Environment Configuration

### Production Environment Variables

Create `.env.production` with these variables:

```env
# Database
POSTGRES_DB=kenpolimarket
POSTGRES_USER=kenpolimarket
POSTGRES_PASSWORD=<strong-password>
DATABASE_URL=postgresql://kenpolimarket:<password>@postgres:5432/kenpolimarket

# Redis
REDIS_URL=redis://redis:6379/0

# Backend
ENVIRONMENT=production
API_SECRET_KEY=<random-32-char-string>

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXTAUTH_SECRET=<random-32-char-string>
```

### Generate Secure Secrets

```bash
# Generate API secret key
openssl rand -hex 32

# Generate NextAuth secret
openssl rand -hex 32

# Generate strong password
openssl rand -base64 24
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

1. **Install Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Stop Nginx temporarily**
   ```bash
   docker-compose -f docker-compose.prod.yml stop nginx
   ```

3. **Obtain SSL Certificate**
   ```bash
   sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
   ```

4. **Copy certificates to nginx directory**
   ```bash
   sudo mkdir -p nginx/ssl
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

5. **Update nginx.conf**
   - Uncomment the HTTPS server block in `nginx/nginx.conf`
   - Update `server_name` to your domain

6. **Restart Nginx**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d nginx
   ```

7. **Auto-renewal**
   ```bash
   # Test renewal
   sudo certbot renew --dry-run
   
   # Add cron job for auto-renewal
   echo "0 0 * * * certbot renew --quiet && docker-compose -f /path/to/kenpolimarket/docker-compose.prod.yml restart nginx" | sudo crontab -
   ```

---

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Backup Database

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U kenpolimarket kenpolimarket > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U kenpolimarket kenpolimarket < backup_20240101.sql
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Remove old images
docker image prune -f
```

### Monitor Resources

```bash
# Check container stats
docker stats

# Check disk usage
docker system df
```

---

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(80|443|3000|8000|5432|6379)'

# Restart all services
docker-compose -f docker-compose.prod.yml restart
```

### Database connection errors

```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U kenpolimarket -d kenpolimarket -c "SELECT 1;"
```

### Frontend can't connect to backend

1. Check `NEXT_PUBLIC_API_URL` in `.env.production`
2. Ensure nginx is routing correctly
3. Check backend logs: `docker-compose -f docker-compose.prod.yml logs backend`

### Out of disk space

```bash
# Clean up Docker
docker system prune -a --volumes

# Remove old logs
docker-compose -f docker-compose.prod.yml logs --tail=0 -f > /dev/null
```

---

## Performance Optimization

### Enable Caching

The application uses Redis for caching. Ensure Redis is running:
```bash
docker-compose -f docker-compose.prod.yml ps redis
```

### Scale Workers

Increase Celery workers for better performance:
```bash
docker-compose -f docker-compose.prod.yml up -d --scale celery-worker=3
```

### Database Optimization

```sql
-- Create indexes (run in PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_election_results_county ON election_results_county(county_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_county ON forecasts(county_code);
```

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated secure API keys
- [ ] Enabled HTTPS/SSL
- [ ] Configured firewall (UFW or cloud security groups)
- [ ] Regular backups scheduled
- [ ] Monitoring and alerts set up
- [ ] Rate limiting enabled (via nginx)
- [ ] Database not exposed to public internet
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`

---

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Review documentation in `/docs`
- Open an issue on GitHub

---

**🎉 Congratulations! Your KenPoliMarket instance is now deployed!**

