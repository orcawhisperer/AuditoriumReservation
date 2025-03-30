FROM node:20-alpine

WORKDIR /app

# Install PostgreSQL client tools which are needed for database initialization
RUN apk add --no-cache postgresql-client

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

# Expose the application port
EXPOSE 5000

# Set environment variable
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "start"]