import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// Rutas que no requieren autenticación (Login, Registro)
const publicRoutes = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/google'
];

export const authenticateGateway = (req: Request, res: Response, next: NextFunction) => {
  // Permitir tráfico a rutas públicas
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Gateway Security: Token no proporcionado o inválido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    // Inyectar el payload decodificado en la petición por si el microservicio destino lo necesita
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Gateway Security: Token expirado o inválido' });
  }
};
