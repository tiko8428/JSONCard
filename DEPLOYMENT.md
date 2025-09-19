# 🚀 JSONCard Deployment Guide

This guide explains how to set up automatic deployment to your DigitalOcean Ubuntu server using GitHub Actions.

## Prerequisites

- DigitalOcean Ubuntu server (20.04+ recommended)
- SSH access to your server
- GitHub repository with admin access
- Domain name (optional, for Nginx setup)

## 🔧 Server Setup

### 1. Initial Server Setup

Connect to your DigitalOcean server and run the deployment script:

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/tiko8428/JSONCard/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Install Node.js 18
- Install PM2 process manager
- Clone your repository
- Set up the application
- Configure Nginx (optional)
- Configure firewall

### 2. Manual Server Setup (Alternative)

If you prefer manual setup:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/jsoncard
sudo chown -R $USER:$USER /var/www/jsoncard

# Clone repository
cd /var/www/jsoncard
git clone https://github.com/tiko8428/JSONCard.git .

# Install dependencies
npm install --production
cd client && npm install --production && npm run build && cd ..

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔑 GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add these repository secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_HOST` | Your server IP address | `123.456.789.012` |
| `SSH_USER` | Username for SSH access | `root` or `ubuntu` |
| `SSH_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_PORT` | SSH port (optional, default: 22) | `22` |

### Generating SSH Key

On your local machine or server:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions@yourapp.com"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server-ip

# Copy private key content for GitHub secret
cat ~/.ssh/id_ed25519
```

## 📁 Project Structure

After deployment, your server will have:

```
/var/www/jsoncard/
├── .git/                    # Git repository
├── .github/workflows/       # GitHub Actions
├── client/                  # React frontend
│   ├── build/              # Built frontend files
│   └── package.json
├── json_db/                # JSON database files
├── mongoDB/                # MongoDB schemas
├── router/                 # API routes
├── static/                 # Static files
├── logs/                   # Application logs
├── ecosystem.config.js     # PM2 configuration
├── deploy.sh              # Deployment script
├── .env.production        # Environment variables
└── index.js               # Main server file
```

## 🔄 Automatic Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:

1. **Trigger**: On push to `main` branch
2. **Build & Test**: Install dependencies and build the client
3. **Deploy**: SSH to your server and:
   - Pull latest code
   - Install production dependencies
   - Build client application
   - Restart PM2 application

## 🌐 Nginx Configuration (Optional)

If you want to serve your app on port 80/443 with a domain:

```bash
# Install Nginx
sudo apt install -y nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/jsoncard
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/jsoncard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already set up by certbot)
sudo systemctl status certbot.timer
```

## 📊 Monitoring & Management

### PM2 Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs jsoncard-app

# Restart application
pm2 restart jsoncard-app

# Monitor performance
pm2 monit

# Stop application
pm2 stop jsoncard-app

# View detailed info
pm2 show jsoncard-app
```

### Server Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
htop

# Check network connections
netstat -tulpn | grep :3000

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Environment Variables

Copy `.env.production` to `.env` on your server and update values:

```bash
cd /var/www/jsoncard
cp .env.production .env
nano .env
```

Update the following variables:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Generate a secure random string
- `CORS_ORIGINS`: Add your domain
- `SESSION_SECRET`: Generate a secure random string

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000 not accessible**:
   ```bash
   sudo ufw allow 3000
   sudo ufw status
   ```

2. **Application not starting**:
   ```bash
   pm2 logs jsoncard-app
   cd /var/www/jsoncard && npm install
   ```

3. **GitHub Actions failing**:
   - Check SSH connection: `ssh user@server-ip`
   - Verify GitHub secrets are set correctly
   - Check server disk space: `df -h`

4. **Build failures**:
   ```bash
   cd /var/www/jsoncard/client
   npm install
   npm run build
   ```

### Log Locations

- PM2 logs: `/home/user/.pm2/logs/`
- Application logs: `/var/www/jsoncard/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -f`

## 🔄 Manual Deployment

If you need to deploy manually:

```bash
cd /var/www/jsoncard
git pull origin main
npm install --production
cd client && npm install --production && npm run build && cd ..
pm2 restart jsoncard-app
```

## 📝 Testing the Pipeline

1. Make a small change to your code
2. Commit and push to the main branch:
   ```bash
   git add .
   git commit -m "Test deployment pipeline"
   git push origin main
   ```
3. Check GitHub Actions tab for deployment status
4. Verify your changes are live on the server

## 🎉 Success!

Your JSONCard application should now be:
- ✅ Automatically deployed on every push to main
- ✅ Running with PM2 process management
- ✅ Accessible on your server IP:3000
- ✅ Optionally served via Nginx with SSL

For support, check the GitHub Actions logs and server logs mentioned in the troubleshooting section.