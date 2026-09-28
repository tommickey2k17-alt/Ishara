# Multi-stage Docker build for Swasthya Log
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source files
COPY . .

# Build frontend and generate PWA assets
RUN node scripts/generate-icons.js && npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built frontend assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000

# Run with tsx (included in dependencies)
CMD ["npx", "tsx", "server.ts"]
