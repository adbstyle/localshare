FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start the application with migrations
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
