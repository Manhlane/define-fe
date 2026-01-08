# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
RUN apk add --no-cache --virtual .build-deps python3 make g++
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
# Build standalone output to drop dev dependencies in the final image
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Only bring what the standalone build needs
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
