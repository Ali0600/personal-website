# syntax=docker/dockerfile:1.7

# ─── Stage 1: build the static site ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first so npm ci is cached when only source changes
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source
COPY . .

# Inject commit SHA at build time so the `version` command shows the running build
ARG COMMIT_SHA=dev
ENV PUBLIC_COMMIT_SHA=$COMMIT_SHA

RUN npm run build

# ─── Stage 2: serve static output via nginx ────────────────────────────────
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx:alpine's default CMD is the right one — keep it
