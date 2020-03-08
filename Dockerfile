FROM node:10

WORKDIR /opt/nodecg

RUN addgroup --system nodecg && adduser --system nodecg --ingroup nodecg && \
    npm install -g nodecg-cli && \
    mkdir cfg && mkdir bundles && mkdir logs && mkdir db && \
    chown -R nodecg:nodecg /opt/nodecg

USER nodecg

# Copy package.json and package-lock.json
COPY --chown=nodecg:nodecg package*.json /opt/nodecg/

# Install dependencies
RUN npm ci --production

# Copy NodeCG (just the files we need)
COPY --chown=nodecg:nodecg . /opt/nodecg/

# Define directories that should be persisted in a volume
VOLUME /opt/nodecg/cfg /opt/nodecg/bundles /opt/nodecg/logs /opt/nodecg/db
# Define ports that should be used to communicate
EXPOSE 9090/tcp

# Define command to run NodeCg
CMD ["nodecg", "start"]
