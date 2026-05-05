# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — Prolance Frontend (Angular 14)
# Multi-stage: Build with Node → Serve with Nginx
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (legacy-peer-deps needed for ng-apexcharts conflict)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build for production
RUN npx ng build --configuration production

# ── Stage 2: Serve ──────────────────────────────────────────────
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app from builder stage
# outputPath in angular.json is "dist" (no subfolder), so we copy /app/dist/
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
