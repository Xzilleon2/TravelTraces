FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV VITE_API_BASE_URL=""
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

USER root

COPY --from=build /app/dist /usr/share/nginx/html
COPY backend/nginx/nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R 101:0 /usr/share/nginx/html /etc/nginx/conf.d /var/cache/nginx /var/run

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
