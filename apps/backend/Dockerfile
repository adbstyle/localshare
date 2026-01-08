FROM node:20-alpine AS builder

# Install OpenSSL for Prisma and build tools for native modules (bcrypt)
RUN apk add --no-cache openssl python3 make g++

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

# Install OpenSSL for Prisma and build tools for bcrypt
RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start the application with migrations (with retry for private network)
CMD ["sh", "-c", "sleep 5 && npx prisma migrate deploy && node dist/main"]
