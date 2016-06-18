FROM node:6

WORKDIR /usr/src/app

# Copy NodeCG (just the files we need)
RUN mkdir cfg && mkdir bundles && mkdir logs && mkdir db
COPY . /usr/src/app/

# Install dependencies
RUN npm install -g bower
RUN npm install --production
RUN bower install --allow-root

VOLUME /usr/src/app/db/

# The command to run
EXPOSE 9090
CMD ["node", "index.js"]
