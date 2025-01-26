FROM node:22-slim AS base


FROM base AS build

WORKDIR /nodecg

RUN apt-get update && apt-get install -y python3 build-essential
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json package-lock.json ./
COPY scripts scripts
COPY workspaces workspaces

RUN npm ci

COPY tsconfig.json ./
COPY schemas schemas
COPY src src

RUN npm run build


FROM base AS npm

WORKDIR /nodecg

RUN apt-get update && apt-get install -y python3 build-essential

COPY package.json package-lock.json ./
COPY scripts scripts
COPY --from=build /nodecg/workspaces workspaces

RUN npm ci --omit=dev


FROM base AS runtime

RUN apt-get update \
	&& apt-get install -y git \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /opt/nodecg

RUN mkdir cfg bundles logs db assets

COPY package.json index.js cli.mjs ./
COPY --from=npm /nodecg/node_modules node_modules
COPY --from=npm /nodecg/workspaces/ workspaces
COPY --from=build /nodecg/dist dist
COPY --from=build /nodecg/out out
COPY --from=build /nodecg/scripts scripts
COPY --from=build /nodecg/schemas schemas

# Define directories that should be persisted in a volume
VOLUME /opt/nodecg/logs /opt/nodecg/db /opt/nodecg/assets
# Define ports that should be used to communicate
EXPOSE 9090/tcp

# Define command to run NodeCG
# Using `node` directly is slightly faster than using `nodecg start`.
CMD ["node", "/opt/nodecg/index.js"]
