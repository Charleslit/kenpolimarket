# 📋 KenPoliMarket Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Server Setup
- [ ] Server provisioned (VPS/Cloud instance)
- [ ] Server has minimum requirements:
  - [ ] 2 CPU cores
  - [ ] 4GB RAM
  - [ ] 20GB disk space
- [ ] SSH access configured
- [ ] Firewall configured (ports 22, 80, 443 open)
- [ ] Domain name configured (optional but recommended)
- [ ] DNS records pointing to server IP

### Software Installation
- [ ] Docker installed (`docker --version`)
- [ ] Docker Compose installed (`docker-compose --version`)
- [ ] Git installed (`git --version`)
- [ ] User added to docker group (`sudo usermod -aG docker $USER`)

### Repository Setup
- [ ] Repository cloned to server
- [ ] Latest code pulled (`git pull origin main`)
- [ ] All deployment files present:
  - [ ] `docker-compose.prod.yml`
  - [ ] `deploy.sh`
  - [ ] `nginx/nginx.conf`
  - [ ] `.env.production.example`

## Configuration

### Environment Variables
- [ ] `.env.production` created from template
- [ ] `POSTGRES_PASSWORD` set to strong password
- [ ] `API_SECRET_KEY` generated (32+ characters)
- [ ] `NEXTAUTH_SECRET` generated (32+ characters)
- [ ] `NEXT_PUBLIC_API_URL` set to correct domain/IP
- [ ] All other required variables configured

### Security
- [ ] Strong passwords generated for all services
- [ ] API keys are random and secure
- [ ] `.env.production` file permissions set (`chmod 600 .env.production`)
- [ ] `.env.production` added to `.gitignore`
- [ ] Default passwords changed

## Deployment

### Initial Deployment
- [ ] Run `./deploy.sh` and select option 1 (Fresh deployment)
- [ ] All Docker images built successfully
- [ ] All services started:
  - [ ] PostgreSQL
  - [ ] Redis
  - [ ] Backend
  - [ ] Frontend
  - [ ] Celery Worker
  - [ ] Celery Beat
  - [ ] Nginx
- [ ] Database schema initialized
- [ ] No errors in logs (`docker-compose -f docker-compose.prod.yml logs`)

### Verification
- [ ] Frontend accessible at `http://your-server-ip`
- [ ] API docs accessible at `http://your-server-ip/api/docs`
- [ ] Health check endpoint working (`curl http://localhost/health`)
- [ ] Backend API responding (`curl http://localhost/api/health`)
- [ ] Database connection working
- [ ] Redis connection working

### Testing
- [ ] Can navigate to all pages
- [ ] Forecasts page loads correctly
- [ ] County search functionality works
- [ ] Charts and visualizations render
- [ ] API endpoints respond correctly
- [ ] No console errors in browser
- [ ] Mobile responsive design works

## SSL/HTTPS Setup (Recommended)

### Let's Encrypt SSL
- [ ] Certbot installed
- [ ] SSL certificate obtained for domain
- [ ] Certificates copied to `nginx/ssl/`
- [ ] `nginx.conf` updated with HTTPS configuration
- [ ] Nginx restarted with new config
- [ ] HTTPS accessible at `https://your-domain.com`
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate auto-renewal configured

## Post-Deployment

### Monitoring
- [ ] Log monitoring set up
- [ ] Uptime monitoring configured (e.g., Uptime Robot)
- [ ] Error tracking configured (optional)
- [ ] Resource monitoring enabled (`docker stats`)

### Backups
- [ ] Database backup tested (`./deploy.sh` option 5)
- [ ] Backup restoration tested
- [ ] Automated backup schedule configured
- [ ] Backup storage location secured
- [ ] Off-site backup configured (recommended)

### Performance
- [ ] Application loads in < 3 seconds
- [ ] API responses in < 500ms
- [ ] No memory leaks detected
- [ ] CPU usage normal (< 70% average)
- [ ] Disk usage monitored

### Security Hardening
- [ ] Firewall configured (UFW or cloud security groups)
- [ ] SSH key-based authentication only
- [ ] Root login disabled
- [ ] Fail2ban installed (optional)
- [ ] Regular security updates scheduled
- [ ] Rate limiting enabled (via nginx)
- [ ] CORS configured correctly
- [ ] Security headers enabled

## Maintenance

### Regular Tasks
- [ ] Weekly updates scheduled (`./deploy.sh` option 2)
- [ ] Daily database backups scheduled
- [ ] Weekly log review scheduled
- [ ] Monthly security audit scheduled
- [ ] Disk space monitoring configured

### Documentation
- [ ] Deployment documented
- [ ] Access credentials stored securely
- [ ] Runbook created for common issues
- [ ] Team members trained on deployment process
- [ ] Emergency contacts documented

## Rollback Plan

### Preparation
- [ ] Previous version tagged in git
- [ ] Database backup before deployment
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging environment

### Rollback Steps (if needed)
```bash
# 1. Stop current services
docker-compose -f docker-compose.prod.yml down

# 2. Checkout previous version
git checkout <previous-tag>

# 3. Restore database backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U kenpolimarket kenpolimarket < backup.sql

# 4. Rebuild and restart
./deploy.sh  # Select option 1
```

## Troubleshooting Checklist

### If services won't start:
- [ ] Check logs: `docker-compose -f docker-compose.prod.yml logs`
- [ ] Check disk space: `df -h`
- [ ] Check memory: `free -h`
- [ ] Check ports: `sudo netstat -tulpn | grep -E ':(80|443|3000|8000|5432|6379)'`
- [ ] Restart services: `docker-compose -f docker-compose.prod.yml restart`

### If frontend can't connect to backend:
- [ ] Check `NEXT_PUBLIC_API_URL` in `.env.production`
- [ ] Check nginx configuration
- [ ] Check backend logs
- [ ] Test API directly: `curl http://localhost:8000/api/health`

### If database errors occur:
- [ ] Check PostgreSQL logs
- [ ] Verify database credentials
- [ ] Check database connection string
- [ ] Restart PostgreSQL: `docker-compose -f docker-compose.prod.yml restart postgres`

## Performance Optimization

### After Initial Deployment
- [ ] Enable Redis caching
- [ ] Configure CDN for static assets (optional)
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Enable gzip compression in nginx
- [ ] Configure browser caching
- [ ] Optimize images and assets

### Scaling (if needed)
- [ ] Scale Celery workers: `docker-compose -f docker-compose.prod.yml up -d --scale celery-worker=3`
- [ ] Configure load balancer (for multiple servers)
- [ ] Set up database replication (for high availability)
- [ ] Configure Redis cluster (for high availability)

## Final Verification

### Production Readiness
- [ ] All checklist items completed
- [ ] Application accessible to users
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Backups working
- [ ] Monitoring active
- [ ] Team notified of deployment

### Sign-off
- [ ] Deployment tested by QA
- [ ] Deployment approved by stakeholders
- [ ] Users notified of new deployment
- [ ] Documentation updated
- [ ] Deployment notes recorded

---

## Quick Reference Commands

```bash
# View all services status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart a service
docker-compose -f docker-compose.prod.yml restart <service-name>

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Backup database
./deploy.sh  # Select option 5

# Update deployment
./deploy.sh  # Select option 2

# Check resource usage
docker stats

# Clean up Docker
docker system prune -a
```

---

## Emergency Contacts

- **System Administrator:** _________________
- **Database Administrator:** _________________
- **DevOps Lead:** _________________
- **On-call Support:** _________________

---

**Date Deployed:** _________________  
**Deployed By:** _________________  
**Version/Tag:** _________________  
**Notes:** _________________

---

✅ **Deployment Complete!** Keep this checklist for future deployments and updates.

