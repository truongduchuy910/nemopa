# Base image
FROM node:20-alpine AS base
WORKDIR /app

COPY src src
COPY package.json package.json 
COPY package-lock.json package-lock.json
COPY release.config.mjs release.config.mjs
COPY tsconfig.json tsconfig.json
COPY tsconfig.build.json tsconfig.build.json
COPY tsup.config.mjs tsup.config.mjs

RUN npm install
RUN npm run build
