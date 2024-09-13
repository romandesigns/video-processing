# Use the Bun base image
FROM oven/bun:edge

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and bun.lockb
COPY package*.json bun.lockb* ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of your application code
COPY . .

# Update package list and install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Expose port 5000
EXPOSE 5000

# Start the application with Bun
CMD ["bun", "run", "dev"]
