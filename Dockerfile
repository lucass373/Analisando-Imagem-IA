FROM node:18-bullseye

WORKDIR /src

COPY package*.json ./

RUN npm install

COPY . .

# Compilando o TypeScript para JavaScript
RUN npm run build

# Comando para inicializar o banco de dados ao iniciar o container
RUN npm run init-db

EXPOSE 3000
CMD ["npm", "start"]
