export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message = 'Solicitud inválida', details) {
    return new HttpError(400, message, details);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new HttpError(404, message);
  }

  static unauthorized(message = 'No autenticado') {
    return new HttpError(401, message);
  }

  static conflict(message = 'El recurso ya existe') {
    return new HttpError(409, message);
  }
}
