# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and Prisma schema before install so `postinstall`
# (`prisma generate`) uses this repository's schema, not a stale client.
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install dependencies (including dev for prisma)
RUN npm ci

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Final stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy node_modules from builder (includes generated prisma client)
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY . .

# Regenerate after the full tree is present so the running image matches schema.prisma
RUN npx prisma generate

# Expose port
EXPOSE 8010

# Health check (also verifies DB connectivity, not just that the process is alive)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8010/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start application
CMD ["node", "src/server.js"]
