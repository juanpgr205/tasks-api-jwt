import { HttpError } from '../utils/http-error.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw HttpError.badRequest('Datos inválidos', details);
  }
  req[source] = result.data;
  next();
};
