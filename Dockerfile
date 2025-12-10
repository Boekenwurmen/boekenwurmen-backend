FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install dependencies (this will also run prisma generate via postinstall)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3012

# Start the application
CMD ["npm", "start"]
