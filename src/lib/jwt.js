import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(user) {
  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof payload !== 'object' || typeof payload.sub !== 'string' || !payload.sub ||
      typeof payload.email !== 'string' || typeof payload.exp !== 'number') {
    throw new Error('Token sin los datos requeridos');
  }
  return payload;
}
