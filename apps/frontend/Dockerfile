FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace definitions
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/execution-service/package.json ./apps/execution-service/
COPY apps/event-service/package.json ./apps/event-service/
COPY packages/database/package.json ./packages/database/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/apps/frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
