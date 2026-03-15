FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY index.js ./
COPY src/ ./src/

ENV MINIO_ENDPOINT=""
ENV MINIO_ACCESS_KEY=""
ENV MINIO_SECRET_KEY=""
ENV MINIO_REGION="us-east-1"
ENV MINIO_WORKSPACE_ROOT=""

CMD ["node", "index.js"]
