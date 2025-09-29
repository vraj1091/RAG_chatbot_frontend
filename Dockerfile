# Frontend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Add package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent
RUN npm install react-scripts@5.0.1 -g --silent

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001 \
    && chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]