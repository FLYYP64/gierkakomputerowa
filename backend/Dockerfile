FROM node:22-bookworm-slim

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js ./
RUN mkdir -p /app/data

ENV PORT=3000
ENV DB_PATH=/app/data/scores.db
EXPOSE 3000
CMD ["node", "server.js"]
