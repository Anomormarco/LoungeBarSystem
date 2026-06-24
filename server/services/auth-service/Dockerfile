FROM node:22-alpine

WORKDIR /usr/src/app

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

COPY services/auth-service/package*.json ./

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma

COPY services/auth-service/src ./src

EXPOSE 3001

CMD ["node", "src/server.js"]
