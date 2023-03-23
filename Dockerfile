FROM node:18

WORKDIR /opt/nodecg

# Sets up the runtime user, makes nodecg-cli available to images which extend this image, and creates the directory structure with the appropriate permissions.
RUN addgroup --system nodecg && adduser --system nodecg --ingroup nodecg && \
    npm i -g nodecg-cli && \
    mkdir cfg && mkdir bundles && mkdir logs && mkdir db && mkdir assets && \
    chown -R nodecg:nodecg /opt/nodecg

# Switch to the nodecg user
USER nodecg

# Copy NodeCG
COPY --chown=nodecg:nodecg \
	package.json \
	package-lock.json \
	index.js \
	tsconfig_base.json \
	./
COPY --chown=nodecg:nodecg build-tools ./build-tools
COPY --chown=nodecg:nodecg schemas ./schemas
COPY --chown=nodecg:nodecg src ./src
COPY --chown=nodecg:nodecg scripts ./scripts

# Install dependencies
RUN npm ci

# Build
RUN npm run build

# Define directories that should be persisted in a volume
VOLUME /opt/nodecg/cfg /opt/nodecg/bundles /opt/nodecg/logs /opt/nodecg/db /opt/nodecg/assets
# Define ports that should be used to communicate
EXPOSE 9090/tcp

# Define command to run NodeCG
# Using `node` directly is slightly faster than using `nodecg start`.
CMD ["node", "index.js"]
