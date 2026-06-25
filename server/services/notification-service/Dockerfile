FROM node:18-alpine

WORKDIR /usr/src/app

COPY services/notification-service/package*.json ./

RUN npm config set strict-ssl false

RUN npm install

COPY services/notification-service/src ./src

EXPOSE 3005

CMD ["node", "src/server.js"]
