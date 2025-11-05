# Use lightweight Node.js image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy only package files first (for dependency install)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy all source code
COPY . .

# Set environment variable for Cloud Run
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
