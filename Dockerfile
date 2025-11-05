FROM node:22-slim AS base
RUN corepack enable pnpm


FROM base AS build

WORKDIR /nodecg

RUN apt-get update && apt-get install -y python3 build-essential
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY workspaces workspaces

RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY schemas schemas
COPY src src
COPY scripts scripts

RUN pnpm run build


FROM base AS pnpm-prod

WORKDIR /nodecg

RUN apt-get update && apt-get install -y python3 build-essential

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=build /nodecg/workspaces workspaces

RUN pnpm install --frozen-lockfile --prod


FROM base AS runtime

RUN apt-get update \
	&& apt-get install -y git \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /opt/nodecg

RUN mkdir cfg bundles logs db assets

COPY package.json index.js cli.mjs ./
COPY --from=pnpm-prod /nodecg/node_modules node_modules
COPY --from=pnpm-prod /nodecg/workspaces workspaces
COPY --from=build /nodecg/dist dist
COPY --from=build /nodecg/out out
COPY --from=build /nodecg/schemas schemas

# Define directories that should be persisted in a volume
VOLUME /opt/nodecg/logs /opt/nodecg/db /opt/nodecg/assets
# Define ports that should be used to communicate
EXPOSE 9090/tcp

# Define command to run NodeCG
# Using `node` directly is slightly faster than using `nodecg start`.
CMD ["node", "/opt/nodecg/index.js"]
