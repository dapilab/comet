# Build the frontend
FROM node:12.13.1-alpine as builder

WORKDIR /src

RUN apk add --no-cache --virtual native-deps \
    g++ gcc libgcc libstdc++ linux-headers make python
COPY package.json yarn.lock /src/

RUN yarn install --production --silent && \
    apk del native-deps

COPY ./ /src/

ENV NODE_ENV production
RUN npm run build

# Only preserve dist files
FROM nginx:1.15

WORKDIR /app

EXPOSE 8888

COPY --from=builder /src/dist/ /app/
COPY --from=builder /src/docker/nginx.conf /etc/nginx/conf.d/default.conf
