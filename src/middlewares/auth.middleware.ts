import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// -# rutas que no requieren autenticacion login registro
const publicRoutes = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/google',
  '/api/v1/auth/recover-password'
];

export const authenticateGateway = (req: Request, res: Response, next: NextFunction) => {
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ error: 'Gateway Security: Token no proporcionado o inválido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Gateway Security: Token expirado o inválido' });
  }
};
