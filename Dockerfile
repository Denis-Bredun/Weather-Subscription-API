FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/.env ./.env
COPY --from=builder /app/dist/config/ormconfig.js ./dist/config/ormconfig.js
COPY --from=builder /app/dist/migrations ./dist/migrations
COPY --from=builder /app/dist/subscription/entities ./dist/subscription/entities

COPY wait-for-it.sh ./wait-for-it.sh
RUN chmod +x ./wait-for-it.sh

RUN apk add --no-cache bash

EXPOSE 3000

CMD ["sh", "-c", "./wait-for-it.sh postgres:5432 -- node -e 'console.log(\"Running DB migration...\")' && npx typeorm migration:run --dataSource dist/config/ormconfig.js && node dist/main"]

