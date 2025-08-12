#!/bin/bash

# Quick permission fix script for EC2 deployment issues
echo "🔧 Fixing EC2 permissions and rebuilding..."

# Stop any running processes
pm2 stop consultant-tracker 2>/dev/null || true
pm2 delete consultant-tracker 2>/dev/null || true

# Fix ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/AugConsultant

# Clean build directory completely
cd /home/ubuntu/AugConsultant
rm -rf dist
rm -rf node_modules
rm -f package-lock.json

# Reinstall and rebuild
npm install
npm run build

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.json
pm2 save

echo "✅ Fixed and deployed successfully!"
echo "🌐 Application available at: http://$(curl -s ifconfig.me)"

# Show status
pm2 status
pm2 logs consultant-tracker --lines 5