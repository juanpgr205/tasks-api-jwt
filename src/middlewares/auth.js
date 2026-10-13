import { verifyToken } from '../lib/jwt.js';
import { HttpError } from '../utils/http-error.js';

export function requireAuth(req, _res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') ?? '');
  if (!match) throw HttpError.unauthorized('Falta el header Authorization: Bearer <token>');
  try {
    const payload = verifyToken(match[1]);
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    throw HttpError.unauthorized('Token inválido o expirado');
  }
  next();
}
