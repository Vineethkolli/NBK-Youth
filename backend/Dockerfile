# Use official Node.js LTS image
FROM node:20-alpine

# Install necessary system packages (optional for some libraries)
RUN apk add --no-cache python3 make g++ bash

# App directory
WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install deps
RUN npm install --production

# Copy the full backend source
COPY . .

# Run the server
CMD ["npm", "start"]
