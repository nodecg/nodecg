FROM node:18

WORKDIR /opt/nodecg

RUN addgroup --system nodecg && adduser --system nodecg --ingroup nodecg && \
    mkdir cfg && mkdir bundles && mkdir logs && mkdir db && mkdir assets && \
    chown -R nodecg:nodecg /opt/nodecg

USER nodecg

# Copy NodeCG
COPY --chown=nodecg:nodecg . /opt/nodecg/

# Install dependencies
RUN yarn --ignore-engines --frozen-lockfile --network-timeout 1000000

# Build
RUN yarn build

# Define directories that should be persisted in a volume
VOLUME /opt/nodecg/cfg /opt/nodecg/bundles /opt/nodecg/logs /opt/nodecg/db /opt/nodecg/assets
# Define ports that should be used to communicate
EXPOSE 9090/tcp

# Define command to run NodeCG
# Using `node` directly is slightly faster than using `nodecg start`.
CMD ["node", "index.js"]
