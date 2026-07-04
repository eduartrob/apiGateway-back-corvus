import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import proxyRoutes from './routes/proxy.routes';
import { authenticateGateway } from './middlewares/auth.middleware';

const app = express();

app.use(helmet());
app.use(cors());

// -# 2 limitador de peticiones rate limiting para evitar ataques ddos
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    message: { error: 'Demasiadas peticiones desde esta IP. Por favor, intenta de nuevo más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(morgan('dev'));

app.use(authenticateGateway);

app.use('/', proxyRoutes);

export { app };
