# Multi-stage Dockerfile for Doodle Arena Full-Stack / Backend Deployment
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/data ./data
COPY --from=builder /app/drawable_word_bank_v2.json ./

EXPOSE 3001

CMD ["node", "dist-server/server/index.js"]
