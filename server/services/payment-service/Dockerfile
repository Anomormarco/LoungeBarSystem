FROM node:18-alpine

WORKDIR /usr/src/app

COPY prisma ./prisma

COPY services/payment-service/package*.json ./

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma

COPY services/payment-service/src ./src

EXPOSE 3004

CMD ["node", "src/server.js"]
