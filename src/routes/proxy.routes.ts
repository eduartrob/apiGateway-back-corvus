import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { config } from '../config/env';

const router = Router();

const proxyOptions = (target: string, pathRewrite?: { [key: string]: string }): Options => {
  const options: Options = {
    target,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log(`[Gateway Proxy] 🔄 Redirigiendo ${req.method} ${(req as any).originalUrl || req.url} a ${target}${proxyReq.path}`);
        // Si el middleware de auth inyectó datos del usuario, pasarlos al microservicio como header seguro
        if ((req as any).user) {
           proxyReq.setHeader('x-user-data', JSON.stringify((req as any).user));
        }
      },
      error: (err, req, res) => {
        console.error(`[Gateway Proxy] ❌ Error conectando a ${target}: ${err.message}`);
        if ((res as any).status) {
            (res as any).status(502).json({ error: 'Bad Gateway: Microservicio no disponible' });
        } else {
            (res as any).writeHead(502, { 'Content-Type': 'application/json' });
            (res as any).end(JSON.stringify({ error: 'Bad Gateway: Microservicio no disponible' }));
        }
      }
    }
  };
  
  if (pathRewrite) {
    options.pathRewrite = pathRewrite;
  }
  
  return options;
};

// =========================================================
// MAPEO DE RUTAS (TÚNELES) HACIA LOS MICROSERVICIOS
// =========================================================

// 1. Servicio de Autenticación (/api/v1/auth -> /)
router.use('/api/v1/auth', createProxyMiddleware(proxyOptions(
  config.microservices.auth
)));

// 2. Servicio de Notificaciones (/api/v1/notifications -> /api/notifications)
router.use('/api/v1/notifications', createProxyMiddleware(proxyOptions(
  config.microservices.notifications + '/api/notifications'
)));

// 3. Servicio de LLM (Inteligencia Artificial)
router.use('/api/v1/llm', createProxyMiddleware(proxyOptions(
  config.microservices.llm + '/api/v1/llm'
)));

// 4. Servicio de Clustering (Proyecto Integrador) (/api/v1/clustering/integrator -> /api/v1)
router.use('/api/v1/clustering/integrator', createProxyMiddleware(proxyOptions(
  config.microservices.clusteringIntegrator + '/api/v1'
)));

// 5. Servicio de Clustering (Materia)
router.use('/api/v1/clustering/subject', createProxyMiddleware(proxyOptions(
  config.microservices.clusteringSubject + '/api/v1'
)));

// 6. Servicio de Clustering (Información de Alumnos)
router.use('/api/v1/clustering/students', createProxyMiddleware(proxyOptions(
  config.microservices.clusteringStudentsInfo + '/api/v1'
)));

// 7. Servicio de Clustering (Grupos de Alumnos)
router.use('/api/v1/clustering/groups', createProxyMiddleware(proxyOptions(
  config.microservices.clusteringStudentsGroups + '/api/v1'
)));

export default router;
