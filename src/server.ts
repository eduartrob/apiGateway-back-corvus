import { app } from './app';
import { config } from './config/env';

const startServer = () => {
  app.listen(config.port, () => {
    console.log(`🚀 API Gateway (Corvus) corriendo en http://localhost:${config.port}`);
    console.log(`🛡️  Seguridad Zero-Trust activada`);
    console.log(`🛣️  Rutas listas para redirigir a los microservicios`);
  });
};

startServer();
