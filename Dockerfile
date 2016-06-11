FROM node:6

# Update packages and clean temp/cache files
RUN apt-get update \
  && apt-get install -yq jq \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /var/tmp/* /tmp/*

WORKDIR /usr/src/app

# Copy NodeCG (just the files we need)
RUN mkdir cfg && mkdir bundles && mkdir logs && mkdir db
COPY . /usr/src/app/

# Install dependencies
RUN npm install -g bower
RUN npm install --production
RUN bower install --allow-root

VOLUME db/

# The command to run
EXPOSE 9090
CMD ["node", "index.js"]
