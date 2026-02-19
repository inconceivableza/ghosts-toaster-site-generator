FROM alpine:latest

RUN apk add --no-cache git nodejs npm ca-certificates wget openssh-client
RUN apk add --no-cache bash python3 py3-pip py3-pkgconfig python3-dev gcc musl-dev linux-headers pkgconfig libxml2-dev libxslt-dev
RUN pip install --root-user-action=ignore --break-system-packages --no-binary lxml git+https://github.com/ArchiveTeam/ludios_wpull@5.0.3 
mkdir -p /app/node_modules
# copy code and install node deps
WORKDIR /app
COPY package*.json ./
COPY --chown=node:node . .
RUN npm install

# set workdir to /data
WORKDIR /data

# describe volume
VOLUME "/data"

# set entrypoint to script
ENTRYPOINT [ "node", "/app/src/index.js" ]
