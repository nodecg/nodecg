FROM node:18-slim AS build

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /nodecg

COPY package.json package-lock.json ./
COPY scripts ./scripts

RUN npm ci

COPY tsconfig.json ./
COPY schemas ./schemas
COPY src ./src

RUN npm run build


FROM node:18-slim AS npm

WORKDIR /nodecg

COPY package.json package-lock.json ./
COPY scripts ./scripts

RUN npm ci --omit=dev


FROM node:18-slim AS runtime

RUN apt-get update \
	&& apt-get install -y git \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /opt/nodecg

# Sets up the runtime user, makes nodecg-cli available to images which extend this image, and creates the directory structure with the appropriate permissions.
RUN addgroup --system nodecg \
	&& adduser --system nodecg --ingroup nodecg \
	&& npm i -g nodecg-cli \
	&& mkdir cfg bundles logs db assets \
	&& chown -R nodecg:nodecg /opt/nodecg

# Switch to the nodecg user
USER nodecg

COPY --chown=nodecg:nodecg package.json index.js ./
COPY --chown=nodecg:nodecg --from=npm /nodecg/node_modules ./node_modules
COPY --chown=nodecg:nodecg --from=build /nodecg/dist ./dist
COPY --chown=nodecg:nodecg --from=build /nodecg/out ./out
COPY --chown=nodecg:nodecg --from=build /nodecg/scripts ./scripts
COPY --chown=nodecg:nodecg --from=build /nodecg/schemas ./schemas

# Define directories that should be persisted in a volume
VOLUME /opt/nodecg/cfg /opt/nodecg/bundles /opt/nodecg/logs /opt/nodecg/db /opt/nodecg/assets
# Define ports that should be used to communicate
EXPOSE 9090/tcp

# Define command to run NodeCG
# Using `node` directly is slightly faster than using `nodecg start`.
CMD ["node", "/opt/nodecg/index.js"]
