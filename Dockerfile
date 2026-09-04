# Aaru AI — multi-stage build: sources are assembled in a build stage,
# the final image contains only the minified, comment-free runtime files
# (+ the optional PostgreSQL client).
FROM node:20-alpine AS build
WORKDIR /build
COPY src ./src
COPY public ./public
COPY package.json ./
RUN npm init -y >/dev/null 2>&1 \
 && npm i pg firebase-admin terser --no-audit --no-fund >/dev/null 2>&1 \
 && npx terser src/server.js -c -m --comments false -o server.min.js \
 && npx terser src/app.js -c -m --comments false -o public/app.min.js

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
COPY --from=build /build/server.min.js ./
COPY --from=build /build/public ./public
COPY --from=build /build/node_modules ./node_modules
COPY package.json ./
RUN mkdir -p /app/data/generated && chown -R node:node /app
VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
USER node
CMD ["node", "server.min.js"]
