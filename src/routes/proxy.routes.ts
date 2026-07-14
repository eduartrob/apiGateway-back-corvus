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

router.use('/api/v1/auth', createProxyMiddleware(proxyOptions(
  config.microservices.auth
)));

router.use('/api/v1/final-reviews', createProxyMiddleware(proxyOptions(
  config.microservices.auth + '/final-reviews'
)));

router.use('/api/v1/projects', createProxyMiddleware(proxyOptions(
  config.microservices.auth + '/projects'
)));

router.use('/api/v1/professors', createProxyMiddleware(proxyOptions(
  config.microservices.auth + '/professors'
)));

router.use('/api/v1/notifications', createProxyMiddleware(proxyOptions(
  config.microservices.notifications + '/api/notifications'
)));

router.use('/api/v1/llm', createProxyMiddleware(proxyOptions(
  config.microservices.llm + '/api/v1/llm'
)));

router.use('/api/v1/clustering/integrator', createProxyMiddleware(proxyOptions(
  config.microservices.clusteringIntegrator + '/api/v1'
)));

router.use('/api/v1/clustering/subject', createProxyMiddleware(proxyOptions(
  config.microservices.clusteringSubject + '/api/v1'
)));

router.use('/api/v1/clustering/students', createProxyMiddleware(proxyOptions(
  config.microservices.clusteringStudentsInfo + '/api/v1'
)));

router.use('/api/v1/clustering/groups', createProxyMiddleware(proxyOptions(
  config.microservices.clusteringStudentsGroups,
  { '^/api/v1/clustering/groups': '' }
)));

router.use('/api/v1/teams', createProxyMiddleware(proxyOptions(
  config.microservices.clusteringStudentsGroups + '/teams',
  { '^/api/v1/teams': '' }
)));

export default router;
