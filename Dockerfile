# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html ./
COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
COPY .storybook ./.storybook
COPY vitest.shims.d.ts ./

ARG VITE_API_URL=http://localhost:5001
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
