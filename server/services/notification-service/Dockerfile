FROM node:18-alpine

WORKDIR /usr/src/app

COPY services/notification-service/package*.json ./

RUN npm install

COPY services/notification-service/src ./src

EXPOSE 3005

CMD ["node", "src/server.js"]
