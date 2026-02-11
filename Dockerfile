# Multi-stage Dockerfile for full-stack Angular + Express app

# Stage 1: Build Angular client
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci

# Copy client source
COPY client/ ./

# Build Angular app for production
RUN npm run build

# Stage 2: Build Express server
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
COPY server/tsconfig.json ./
RUN npm ci

# Copy server source
COPY server/src ./src

# Build TypeScript server
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app

# Install production dependencies for server
COPY server/package*.json ./
RUN npm ci --only=production

# Copy built server from builder
COPY --from=server-builder /app/server/dist ./dist

# Copy rule files (markdown files are not compiled by TypeScript)
COPY --from=server-builder /app/server/src/rules ./dist/rules

# Copy built Angular app from builder
COPY --from=client-builder /app/client/dist/exam-oefenen-client/browser ./public

# Expose port (Render and other services use PORT env variable)
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the Express server
CMD ["node", "dist/index.js"]
