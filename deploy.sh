#!/bin/bash

# JSONCard Deployment Script for DigitalOcean Ubuntu Server
# This script handles the deployment process

set -e  # Exit on any error

echo "🚀 Starting JSONCard deployment..."

# Configuration
APP_DIR="/var/www/jsoncard"
REPO_URL="https://github.com/tiko8428/JSONCard.git"
NODE_VERSION="22"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js ${NODE_VERSION} first."
    exit 1
else
    NODE_CURRENT=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_CURRENT | cut -d. -f1)
    print_status "Node.js is installed: v${NODE_CURRENT}"
    
    if [ "$NODE_MAJOR" -lt "18" ]; then
        print_warning "Node.js version is older than recommended (18+). Consider upgrading."
    fi
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 is already installed: $(pm2 --version)"
fi

# Install git if not installed
if ! command -v git &> /dev/null; then
    print_status "Installing Git..."
    sudo apt install -y git
fi

# Create application directory
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory..."
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
fi

# Clone or update repository
cd "$APP_DIR"
if [ ! -d ".git" ]; then
    print_status "Cloning repository..."
    git clone "$REPO_URL" .
else
    print_status "Updating repository..."
    git pull origin main
fi

# Create logs directory
mkdir -p logs

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install --production

# Install and build client dependencies
print_status "Installing and building client..."
cd client
npm install --production
npm run build
cd ..

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup | grep -E '^sudo' | sh || true

# Start or restart application with PM2
print_status "Starting application with PM2..."
pm2 stop app 2>/dev/null || true
pm2 delete app 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup nginx if requested
read -p "Do you want to setup Nginx reverse proxy? (y/N): " setup_nginx
if [[ $setup_nginx =~ ^[Yy]$ ]]; then
    print_status "Setting up Nginx..."
    sudo apt install -y nginx
    
    # Create nginx configuration
    sudo tee /etc/nginx/sites-available/jsoncard > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/jsoncard /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    sudo systemctl enable nginx
fi

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

print_status "✅ Deployment completed successfully!"
print_status "Your application is running on: http://$(curl -s ifconfig.me):3000"
if [[ $setup_nginx =~ ^[Yy]$ ]]; then
    print_status "Nginx is configured. Update the server_name in /etc/nginx/sites-available/jsoncard with your domain."
fi

print_status "Useful PM2 commands:"
print_status "  pm2 status          - Check application status"
print_status "  pm2 logs app        - View application logs"
print_status "  pm2 restart app     - Restart application"
print_status "  pm2 monit           - Monitor application"