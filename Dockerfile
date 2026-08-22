# ---- Build stage: build the React client ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci
COPY client client
RUN npm run build -w client

# ---- Runtime stage: server + built client ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
RUN npm ci --omit=dev --workspace=server
COPY server server
COPY --from=build /app/client/dist client/dist
RUN mkdir -p /app/data
ENV PORT=3000
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server/src/index.js"]