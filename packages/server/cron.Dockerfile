FROM oven/bun as base

WORKDIR /app
ENV NODE_ENV="production"

###############################

FROM base as build
# install server deps
COPY --link package*.json bun.lockb ./
RUN bun install --ci

# copy app
COPY --link . .

###############################

FROM base
COPY --from=build /app /app

CMD [ "bun", "run", "src/cron-allowance.ts" ]
