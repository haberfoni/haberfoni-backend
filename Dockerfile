FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
# Run install
RUN npm install

# Copy source code and prisma schema
COPY . .

# Generate prisma client BEFORE building
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

EXPOSE 3000

# Use db push instead of migrate deploy because we don't have migration history yet
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/src/main.js"]
