FROM node:10

EXPOSE 3000

COPY . .

RUN npm i

CMD npm run go
