FROM node:20-bookworm-slim AS based
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY ./client /client
WORKDIR /client

#FROM based AS prod-deps
#RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

COPY ./.env /client/

FROM based AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

WORKDIR /

FROM python:3.12.7
RUN apt-get update && apt-get install --no-install-suggests --no-install-recommends --yes pipx

COPY . /app 
#COPY --from=prod-deps /client/node_modules /app/node_modules
COPY --from=build /client/dist /app/static

COPY ./ssl/ /ssl/

WORKDIR /app
RUN pipx install poetry
ENV PATH="/root/.local/bin:${PATH}" \
  USE_SSL=y
RUN chmod +x start.sh
ENTRYPOINT ["./start.sh"]
