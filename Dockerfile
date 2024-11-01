FROM node:22.11.0-alpine3.19

# Create application directory
RUN mkdir -p /usr/src/videotubeapi && chown -R node:node /usr/src/videotubeapi

# Set working directory
WORKDIR /usr/src/videotubeapi

# Copy package.json and yarn.lock (or package-lock.json) first
COPY --chown=node:node package*.json ./


# Switch to non-root user
USER node

# Install dependencies as the non-root user
RUN npm install 

# Copy the rest of the application files
COPY --chown=node:node . .

# Expose the application port
EXPOSE 8080

# Define the command to run your app
CMD ["npm","run","dev"]
