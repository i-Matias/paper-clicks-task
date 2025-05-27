FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma and PostgreSQL client
RUN apk add --no-cache openssl postgresql-client

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 5001

# Command to run the app
CMD ["npm", "run", "dev"]
