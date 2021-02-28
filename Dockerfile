FROM buildkite/puppeteer:latest

EXPOSE 3000

COPY . .

RUN npm i

CMD npm run go
