FROM node:24-alpine

RUN apk add --no-cache python3 make g++ bash

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

CMD ["npm", "start"]
