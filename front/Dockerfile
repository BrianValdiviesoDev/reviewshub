# Utiliza la imagen de Node.js como base
FROM node:18.17.0

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de configuración y las dependencias del paquete
COPY package*.json ./

# Instala las dependencias del paquete
RUN npm install

# Copia los archivos de la aplicación
COPY . .

# Compila la aplicación para producción
RUN npm run build

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
