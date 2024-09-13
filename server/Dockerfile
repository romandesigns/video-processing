# Use the Bun base image
FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and bun.lockb
COPY package*.json bun.lockb* ./

# Update package list and install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Install Bun (assuming bun is already installed or install via script)
RUN curl -fsSL https://bun.sh/install | bash

# Set environment path for Bun
ENV PATH="/root/.bun/bin:${PATH}"

# Install dependencies using Bun
RUN bun install

# Copy the rest of your application code
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the application with Bun
CMD ["bun", "run", "dev"]
