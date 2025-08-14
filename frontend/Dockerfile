# ---- Stage 1: Build ----
FROM node:18-alpine AS build
WORKDIR /app

# Copiem fișierele de pachete și instalăm dependențele
COPY package*.json ./
RUN npm install

# Copiem restul codului sursă
COPY . ./

# Construim aplicația pentru producție
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Ștergem conținutul implicit Nginx
RUN rm -rf ./*

# Copiem build-ul din stagiul anterior
COPY --from=build /app/build .

# Copiem fișierul de configurare Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expunem portul 80
EXPOSE 80

# Pornim Nginx
CMD ["nginx", "-g", "daemon off;"]
