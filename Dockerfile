FROM node:18-bullseye

WORKDIR /src

COPY package*.json ./

RUN npm install

COPY . .

# Compilando o TypeScript para JavaScript
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
