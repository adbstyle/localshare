FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json ./
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

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and prisma schema (needed for postinstall)
COPY package.json ./
COPY prisma ./prisma/

# Install production dependencies (triggers prisma generate via postinstall)
RUN npm install --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start the application with migrations (with retry for private network)
CMD ["sh", "-c", "sleep 5 && npx prisma migrate deploy && node dist/main"]
