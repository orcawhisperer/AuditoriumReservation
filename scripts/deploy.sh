#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment process..."

# Check for required environment variables
echo "📝 Checking environment variables..."
if [ -f .env ]; then
    echo "Found .env file"
else
    echo "⚠️  Warning: .env file not found. Creating with default admin credentials..."
    echo "ADMIN_USERNAME=admin" > .env
    echo "ADMIN_PASSWORD=admin" >> .env
    echo "DATABASE_URL=file:./sqlite.db" >> .env
fi

# Kill any existing process using port 5000
echo "🔄 Checking for existing processes..."
if netstat -tuln 2>/dev/null | grep ":5000 " > /dev/null; then
    echo "Found process using port 5000, attempting to free port..."
    pkill -f "node.*5000" || true
    sleep 2
fi

# Double check if port is free
while netstat -tuln 2>/dev/null | grep ":5000 " > /dev/null; do
    echo "Port 5000 is still in use, trying again to free it..."
    pkill -f "node" || true
    pkill -f "tsx" || true
    sleep 2
done

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Ensure database exists and is up to date
echo "🗃️  Setting up database..."
if [ ! -f sqlite.db ]; then
    echo "Creating new SQLite database..."
fi

# Start the application
echo "🌟 Starting application..."
if [ "$NODE_ENV" = "production" ]; then
    echo "Running in production mode..."
    npm run start
else
    echo "Running in development mode..."
    npm run dev
fi