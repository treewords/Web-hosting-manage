# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiem package.json și package-lock.json (dacă există)
COPY package*.json ./

# Instalăm dependențele
RUN npm install

# Copiem restul codului sursă
COPY . .

# Expunem portul pe care va rula serverul
EXPOSE 4000

# Comanda de start
CMD ["node", "server.js"]
