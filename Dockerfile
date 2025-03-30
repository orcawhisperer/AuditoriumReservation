FROM node:20-alpine

WORKDIR /app

# Install SQLite and build dependencies needed for better-sqlite3
RUN apk add --no-cache sqlite python3 make g++ build-base

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create scripts directory
RUN mkdir -p /app/scripts

# Make init scripts executable
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh || true
RUN chmod +x /app/scripts/migrations/*.sh || true

# Build the application
RUN npm run build

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose the application port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV SQLITE_FILE=/app/data/shahbaaz.db

# Start the application
CMD ["npm", "run", "start"]