# 🚀 Quick Deploy - KenPoliMarket

Deploy KenPoliMarket to production in 5 minutes!

## Prerequisites

- A server (VPS) with Docker installed
- Domain name (optional but recommended)
- SSH access to your server

## Step 1: Get a Server

Choose one of these providers:

### DigitalOcean (Recommended)
1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Create a Droplet:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic - $12/month (2GB RAM, 1 CPU)
   - **Region:** Choose closest to your users
   - **Add SSH key** for secure access
3. Note your server's IP address

### AWS EC2
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Launch EC2 instance:
   - **AMI:** Ubuntu 22.04 LTS
   - **Instance Type:** t3.small or t3.medium
   - **Security Group:** Allow ports 22, 80, 443
3. Note your server's IP address

### Google Cloud Platform
1. Go to [GCP Console](https://console.cloud.google.com)
2. Create Compute Engine VM:
   - **Machine type:** e2-medium
   - **Boot disk:** Ubuntu 22.04 LTS
   - **Firewall:** Allow HTTP and HTTPS
3. Note your server's IP address

## Step 2: Connect to Your Server

```bash
ssh root@your-server-ip
```

## Step 3: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

## Step 4: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/yourusername/kenpolimarket.git
cd kenpolimarket

# Create environment file
cp .env.production.example .env.production

# Generate secure secrets
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)" >> .env.production
echo "API_SECRET_KEY=$(openssl rand -hex 32)" >> .env.production
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env.production

# Edit environment file
nano .env.production
```

**Update these values in `.env.production`:**
```env
NEXT_PUBLIC_API_URL=http://your-server-ip/api
# Or if you have a domain:
# NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

## Step 5: Deploy!

```bash
# Run the deployment script
./deploy.sh

# Select option 1 (Fresh deployment)
```

The script will:
- ✅ Build all Docker images
- ✅ Start all services (PostgreSQL, Redis, Backend, Frontend, Nginx)
- ✅ Initialize the database
- ✅ Show service status

## Step 6: Access Your Application

Open your browser and visit:
- **Frontend:** `http://your-server-ip`
- **API Docs:** `http://your-server-ip/api/docs`

If you have a domain:
- **Frontend:** `http://your-domain.com`
- **API Docs:** `http://your-domain.com/api/docs`

---

## 🔒 Enable HTTPS (Recommended)

### If you have a domain:

```bash
# Install Certbot
sudo apt install -y certbot

# Stop nginx temporarily
docker-compose -f docker-compose.prod.yml stop nginx

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Update nginx config
nano nginx/nginx.conf
# Uncomment the HTTPS server block and update server_name

# Restart nginx
docker-compose -f docker-compose.prod.yml up -d nginx
```

Now visit: `https://your-domain.com`

---

## 📊 Common Commands

### View Logs
```bash
./deploy.sh
# Select option 4
```

### Update Application
```bash
./deploy.sh
# Select option 2
```

### Backup Database
```bash
./deploy.sh
# Select option 5
```

### Stop All Services
```bash
./deploy.sh
# Select option 3
```

### Restart a Specific Service
```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
```

### Check Service Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

---

## 🔧 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart all services
docker-compose -f docker-compose.prod.yml restart
```

### Can't access the application
1. Check if services are running:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. Check firewall:
   ```bash
   sudo ufw status
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. Check nginx logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

### Database errors
```bash
# Restart PostgreSQL
docker-compose -f docker-compose.prod.yml restart postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Out of memory
```bash
# Check memory usage
free -h

# Restart services to free memory
docker-compose -f docker-compose.prod.yml restart
```

---

## 🎯 Next Steps

1. **Set up monitoring** - Use tools like Uptime Robot or Pingdom
2. **Configure backups** - Set up automated daily backups
3. **Add custom domain** - Point your domain to the server IP
4. **Enable HTTPS** - Follow the HTTPS setup above
5. **Set up email notifications** - Configure SMTP settings

---

## 💡 Tips

- **Regular Updates:** Run `./deploy.sh` (option 2) weekly to get latest updates
- **Backups:** Run `./deploy.sh` (option 5) daily to backup your database
- **Monitoring:** Check logs regularly with `./deploy.sh` (option 4)
- **Security:** Keep your `.env.production` file secure and never commit it to git

---

## 📚 Full Documentation

For detailed deployment options and advanced configuration, see:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [README.md](./README.md) - Project overview
- [docs/](./docs/) - Technical documentation

---

## 🆘 Need Help?

- Check the logs: `docker-compose -f docker-compose.prod.yml logs`
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Open an issue on GitHub

---

**🎉 Congratulations! Your KenPoliMarket instance is live!**

Share it with your users: `http://your-server-ip` or `https://your-domain.com`

