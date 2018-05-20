FROM nodered/node-red-docker

USER node-red

RUN mkdir -p /data/node_modules/node-red-contrib-node-tradfri/
COPY ./ /data/node_modules/node-red-contrib-node-tradfri/

WORKDIR /data/node_modules/node-red-contrib-node-tradfri/
RUN npm install

WORKDIR /data/
RUN wget https://raw.githubusercontent.com/node-red/node-red/master/settings.js
RUN sed -i -e 's#level: ".*"#level: "trace"#' settings.js

WORKDIR /usr/src/node-red

CMD ["npm", "start", "--", "--userDir", "/data"]
