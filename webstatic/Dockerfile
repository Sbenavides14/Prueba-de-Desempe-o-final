# Sirvo archivos estáticos puros (HTML/CSS/JS), sin ningún paso de compilación.
# Monto el proyecto como volumen desde docker-compose.yml, así que ni siquiera
# necesito reconstruir esta imagen cuando cambio contenido — solo recargar el navegador.
FROM nginx:alpine
COPY . /usr/share/nginx/html
