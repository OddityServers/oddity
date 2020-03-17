#!/bin/bash

CYAN='\033[0;36m'
NY='\033[0m'

echo -e "\n\n${CYAN}SERVER: Installing dependencies${NY}" && \
cd server && \
npm ci && \

echo -e "\n\n${CYAN}SERVER: Executing module_loader.js to load transfer DB Files${NY}" && \
node module_loader && \

echo -e "\n\n${CYAN}SERVER: Executing models_sync to create all tables${NY}" && \
node models_sync && \

echo -e "\n\n${CYAN}SERVER: Seeding database${NY}" && \
npx sequelize-cli db:seed:all

echo -e "\n\n${CYAN}MODULES: Linking node_modules from server to modules${NY}" && \
cd .. && \
ln -fs "$(pwd)/server/node_modules" "$(pwd)/modules/" && \
echo OK && \

echo -e "\n\n${CYAN}CLIENT: Installing dependencies${NY}" && \
cd ../client && \
npm ci && \
echo -e "\n\n${CYAN}CLIENT: Building minified static files${NY}" && \
npm run build