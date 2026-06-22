# API Gateway - Corvus Platform

Este microservicio actúa como la única puerta de entrada pública (Reverse Proxy) para toda la plataforma Corvus. Todas las peticiones de los clientes (App Móvil, Web) pasan por aquí antes de ser enviadas a los microservicios internos.

## Características
* **Enrutamiento (Proxying):** Utiliza `http-proxy-middleware` para redirigir el tráfico a los servicios correspondientes (`/api/v1/auth`, `/api/v1/clustering`, etc.).
* **Seguridad Zero-Trust:** Middleware global que valida los tokens JWT de Google antes de permitir el acceso a los microservicios internos.
* **Rate Limiting:** Previene ataques DDoS limitando a 100 peticiones cada 15 minutos por IP.
* **Sanitización:** Limpieza automática de inyecciones XSS y NoSQL.

## Tecnologías
* Node.js, Express.js
* TypeScript
* JWT (JSON Web Tokens)
* Express-Rate-Limit, Helmet, Cors

## Ejecución Local
1. `npm install`
2. Configurar el archivo `.env` basado en `.env.example`
3. `npm run dev` (Correrá en el puerto 3000 por defecto)
