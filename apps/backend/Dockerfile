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

# Generate Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build backend
WORKDIR /app/apps/backend
RUN npm run build

# Expose port
EXPOSE 3001

# Start
CMD ["npm", "start"]
