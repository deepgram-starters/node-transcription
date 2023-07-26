FROM node:lts-alpine3.14 as build

RUN apk update && \
  apk upgrade && \
  apk add --no-cache bash git openssh

RUN mkdir /app

WORKDIR /app

COPY package.json .

RUN npm install -g --force npm@latest

RUN npm install

COPY . .

RUN npm run build

# ---------------

FROM node:lts-alpine3.14

RUN mkdir -p /app/build

RUN apk update && \
  apk upgrade && \
  apk add git

WORKDIR /app

COPY --from=build /app/package.json .

RUN npm install --production

COPY --from=build /app/build ./build
COPY --from=build /app/src/config.json ./src/config.json
COPY --from=build /app/server.js .
COPY --from=build /app/api-server.js .

EXPOSE 8080
EXPOSE 8080

ENV SERVER_PORT=8080
ENV API_PORT=8080
ENV NODE_ENV production

CMD ["npm", "run", "prod"]
