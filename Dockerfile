FROM node:11-slim

COPY . /home/node/app/
WORKDIR /home/node/app

RUN npm install

CMD ["npm", "start"]