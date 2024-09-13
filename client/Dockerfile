# Use a Node.js image to build the React app
FROM node:16 as build

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the React app
RUN npm run build

# Use an Nginx image to serve the built React app
FROM nginx:alpine

# Copy the built React app from the previous stage to the Nginx HTML directory
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
