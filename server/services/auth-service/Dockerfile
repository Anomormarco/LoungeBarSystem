FROM node:18-alpine

WORKDIR /usr/src/app

COPY prisma ./prisma

COPY services/auth-service/package*.json ./

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma

COPY services/auth-service/src ./src

EXPOSE 3001

CMD ["node", "src/server.js"]
