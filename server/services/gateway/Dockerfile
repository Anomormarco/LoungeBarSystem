FROM node:18-alpine

WORKDIR /usr/src/app

COPY services/gateway/package*.json ./

RUN npm install

COPY services/gateway/src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
