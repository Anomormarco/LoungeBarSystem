FROM node:22-alpine

WORKDIR /usr/src/app

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

COPY services/payment-service/package*.json ./

RUN npm config set strict-ssl false

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma

COPY services/payment-service/src ./src

EXPOSE 3004

CMD ["node", "src/server.js"]
