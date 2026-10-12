FROM node:24-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* pnpm-workspace.yaml* ./
COPY apps ./apps
COPY packages ./packages
COPY workers ./workers
COPY skills ./skills
COPY docs ./docs
RUN npm install --ignore-scripts || npm install
ENV NODE_ENV=production
ENV Ywoom_CLOUD=1
EXPOSE 3000
CMD ["node", "apps/api/src/server.ts"]
