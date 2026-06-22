FROM node:18-alpine

WORKDIR /usr/src/app

COPY prisma ./prisma

COPY services/reservation-service/package*.json ./

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma

COPY services/reservation-service/src ./src

EXPOSE 3003

CMD ["node", "src/server.js"]
