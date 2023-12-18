FROM node:18-slim AS base

LABEL org.opencontainers.image.source=https://github.com/FahriDevZ/simple-node-http-proxy
LABEL org.opencontainers.image.description="Simple node http proxy"
LABEL org.opencontainers.image.licenses=MIT

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

EXPOSE 9875
CMD [ "pnpm", "start" ]
