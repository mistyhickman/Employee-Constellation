FROM node:20-alpine

# Alpine doesn't ship OpenSSL by default in recent versions; without it,
# Prisma can't detect which query-engine binary to use and may fail at
# runtime even though `prisma generate` appears to succeed at build time.
RUN apk add --no-cache openssl

WORKDIR /app

# npm workspaces need the root manifest plus every workspace's package.json
# present before `npm ci` can resolve the lockfile correctly.
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

COPY backend backend
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
