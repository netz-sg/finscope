# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build Proxy
FROM node:22-alpine AS proxy-build
WORKDIR /app/proxy
COPY proxy/package.json proxy/package-lock.json* ./
RUN npm ci
COPY proxy/ .
RUN npx tsc

# Stage 3: Production
FROM node:22-alpine AS production
RUN apk add --no-cache nginx supervisor

# Copy frontend build
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy proxy
WORKDIR /app/proxy
COPY --from=proxy-build /app/proxy/dist ./dist
COPY --from=proxy-build /app/proxy/node_modules ./node_modules
COPY proxy/package.json .

# Nginx config
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Supervisor config
RUN mkdir -p /etc/supervisor.d
COPY docker/supervisord.ini /etc/supervisor.d/finscope.ini

EXPOSE 80 3001

CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]
