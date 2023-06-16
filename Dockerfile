FROM node:lts-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --silent
COPY . .
RUN npm run build
EXPOSE 8080
RUN chown -R node /usr/src/app
USER node
CMD ["node", "dist/main"]
