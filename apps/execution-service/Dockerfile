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

# Build service
WORKDIR /app/apps/execution-service
RUN npm run build

# Start
CMD ["npm", "start"]
