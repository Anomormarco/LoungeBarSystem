FROM node:22-alpine

WORKDIR /usr/src/app

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

COPY services/lounge-service/package*.json ./

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma

COPY services/lounge-service/src ./src

EXPOSE 3002

CMD ["node", "src/server.js"]
