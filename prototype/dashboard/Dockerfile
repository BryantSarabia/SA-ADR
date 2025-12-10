# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for environment variables
ARG VITE_STATE_MANAGER_API_URL
ARG VITE_STATE_MANAGER_WS_URL
ARG VITE_NOTIFICATION_MANAGER_API_URL

# Set environment variables for Vite build
ENV VITE_STATE_MANAGER_API_URL=${VITE_STATE_MANAGER_API_URL}
ENV VITE_STATE_MANAGER_WS_URL=${VITE_STATE_MANAGER_WS_URL}
ENV VITE_NOTIFICATION_MANAGER_API_URL=${VITE_NOTIFICATION_MANAGER_API_URL}

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
