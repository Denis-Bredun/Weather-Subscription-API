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
COPY --from=builder /app/public ./public

COPY wait-for-it.sh ./wait-for-it.sh
RUN apk add --no-cache bash dos2unix \
    && dos2unix ./wait-for-it.sh \
    && chmod +x ./wait-for-it.sh

EXPOSE 3000

CMD ["sh", "-c", "./wait-for-it.sh $DB_HOST:$DB_PORT -- node -e 'console.log(\"Running DB migration...\")' && npx typeorm migration:run --dataSource dist/config/ormconfig.js && node dist/main"]
