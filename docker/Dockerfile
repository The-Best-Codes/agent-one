FROM node:20-bookworm

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci

# Install Playwright browsers and their system dependencies
RUN npx -y playwright@1.54.2 install --with-deps

# Copy app
COPY . .
