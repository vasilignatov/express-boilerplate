# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript (if applicable)
RUN npm run build || echo "No build script found, skipping..."

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --frozen-lockfile --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist || echo "No dist directory found"
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Copy other necessary files
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Start application
CMD ["npm", "start"] 