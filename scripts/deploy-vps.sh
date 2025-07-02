#!/bin/bash

# VPS Deployment Script for BaazCine
# This script automates the production deployment process on a VPS

# Set script to exit on error
set -e

echo "===== Starting BaazCine Deployment ====="

# Make sure we're in the project root
if [ ! -f "./package.json" ]; then
    echo "Error: This script must be run from the project root directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f "./.env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "Please update the .env file with your production settings."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "./node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Back up the database before deployment
echo "Creating database backup before deployment..."
./manage.sh backup

# Build the production version
echo "Building production application..."
npm run build

# Initialize or migrate the database
if [ ! -f "./sqlite.db" ]; then
    echo "Initializing database..."
    ./manage.sh init-db
else
    echo "Running database migrations..."
    ./manage.sh migrate
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing globally..."
    npm install -g pm2
fi

# Start or restart the application with PM2
if pm2 list | grep -q "baazcine"; then
    echo "Restarting application with PM2..."
    pm2 restart baazcine
else
    echo "Starting application with PM2..."
    pm2 start npm --name "baazcine" -- start
    
    # Save PM2 process list
    pm2 save
    
    # Generate PM2 startup script (uncomment to use)
    # pm2 startup
fi

echo "===== Deployment Complete ====="
echo "Your application is now running at http://localhost:5000"
echo "To check application status, run: pm2 status"
echo "To view logs, run: pm2 logs baazcine"
echo ""
echo "Important next steps:"
echo "1. Configure Nginx as a reverse proxy if not already set up"
echo "2. Set up SSL with Let's Encrypt for production use"
echo "3. Ensure database backups are scheduled regularly"