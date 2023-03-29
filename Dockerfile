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
COPY scripts /massbit/massbitroute/app/src/sites/services/api/scripts
COPY cmd_server ./
RUN yarn install 


COPY tsconfig.json tsconfig.build.json start-docker.sh ./
COPY --from=builder /app/dist ./

RUN chmod +x start-docker.sh
RUN chmod +x /massbit/massbitroute/app/src/sites/services/api/scripts/run
RUN apt update && apt install nginx -y 
RUN mkdir -p /massbit/massbitroute/app/src/sites/services/gateway

RUN apt update && apt install nginx  rsync -y

# CMD ["npm", "run" , "dbm:init", "&&","node", "src/main.js"]
CMD ["node", "src/main.js"]

#===

# FROM --platform=linux/amd64 node:16 as development

# WORKDIR /app

# # Bundle app source
# COPY package*.json ./

# RUN npm install glob rimraf

# RUN npm install --only=development

# COPY . .

# RUN npm run build
