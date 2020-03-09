FROM node:latest

# App Directory
WORKDIR /usr/src/app

# Moves files to App Directory
COPY . /usr/src/app

# Build Server
WORKDIR /usr/src/app/server
RUN npm ci

# Create module_loader_imports file
RUN node module_loader.js

# Link node_modules for modules
WORKDIR /usr/src/app
RUN ln -fs "$(pwd)/server/node_modules" "$(pwd)/modules/" 

# Build Client
WORKDIR /usr/src/app/client
RUN npm ci
RUN npm run build

# Start App
CMD npm start
EXPOSE 5000
