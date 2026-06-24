import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';



import proxyRoutes from './routes/proxy.routes';
import { authenticateGateway } from './middlewares/auth.middleware';

const app = express();

// 1. Seguridad Básica HTTP
app.use(helmet());
app.use(cors());

// 2. Limitador de peticiones (Rate Limiting) para evitar ataques DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 peticiones por IP cada 15 minutos
    message: { error: 'Demasiadas peticiones desde esta IP. Por favor, intenta de nuevo más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// 3. Log de peticiones en consola
app.use(morgan('dev'));



// 5. Validación de seguridad Zero-Trust (JWT en el Gateway)
// Validará el token antes de dejar pasar el tráfico a las rutas proxy
app.use(authenticateGateway);

// 6. Rutas Proxy (Redirección a microservicios)
// IMPORTANTE: Express no parsea JSON aquí porque http-proxy-middleware 
// requiere el body original sin modificar para reenviarlo correctamente.
app.use('/', proxyRoutes);

export { app };
