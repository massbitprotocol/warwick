FROM --platform=linux/amd64 node:16 as builder

WORKDIR /app

# RUN apk update && apk --update-cache add --no-progress --virtual .gyp \
#     g++ \
#     gcc \
#     make \
#     python \
#     git

COPY package.json yarn.lock ./
RUN yarn cache clean && yarn install
# RUN apk del .gyp
# RUN rm -rf /var/cache/apk/*

COPY . ./
RUN yarn run build

#===

FROM --platform=linux/amd64 node:16 as runner
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install 


COPY tsconfig.json tsconfig.build.json start-docker.sh ./
COPY --from=builder /app/node_modules ./
COPY --from=builder /app/dist ./

RUN apt update && apt install vim dnsutils curl -y 

# CMD ["npm", "run" , "dbm:init", "&&","node", "src/main.js"]
CMD ["node", "src/main.js"]
