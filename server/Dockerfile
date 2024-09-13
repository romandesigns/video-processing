# Use the Bun base image if available or a Node image
FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and bun.lockb
COPY package*.json bun.lockb* ./

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Install Bun (if not available in base image)
RUN curl -fsSL https://bun.sh/install | bash

# Set environment path for Bun
ENV PATH="/root/.bun/bin:${PATH}"

# Install dependencies using Bun
RUN bun install

# Copy the rest of your application code
COPY . .

# Expose the port the server is running on
EXPOSE 5000

# Start the server using Bun
CMD ["bun", "run", "dev"]
