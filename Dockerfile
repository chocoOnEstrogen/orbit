# Build stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm i --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "require('http').request('http://localhost:3000/health', { timeout: 2000 }, (res) => process.exit(res.statusCode === 200 ? 0 : 1)).end()"

# Start the bot
CMD ["npm", "start"] 