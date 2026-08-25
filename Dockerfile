# Build both subject clients.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY clients/maths/package.json clients/maths/package.json
COPY clients/english/package.json clients/english/package.json
RUN npm ci
COPY clients clients
RUN npm run build

# Run one server for the selector, both clients and both APIs.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY clients/maths/package.json clients/maths/package.json
COPY clients/english/package.json clients/english/package.json
RUN npm ci --omit=dev --workspace=server
COPY server server
COPY selector selector
COPY --from=build /app/clients/maths/dist clients/maths/dist
COPY --from=build /app/clients/english/dist clients/english/dist
RUN mkdir -p /app/data/maths /app/data/english
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV STORAGE_DRIVER=json
ENV APP_URL=http://localhost:3000
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server/src/index.js"]
