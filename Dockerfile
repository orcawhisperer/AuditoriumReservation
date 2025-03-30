FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Add DB initialization script
RUN echo '#!/bin/sh\necho "Running database migrations..."\nnpm run db:push || exit 1\necho "Starting application..."\nnpm start' > /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

# Use the entrypoint script to ensure DB is initialized
ENTRYPOINT ["/app/docker-entrypoint.sh"]