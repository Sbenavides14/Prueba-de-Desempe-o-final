FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

# Horneo aquí la URL de mi api, porque Vite incrusta esta variable en el build
# y ya no se puede cambiar después, en tiempo de ejecución del contenedor.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
