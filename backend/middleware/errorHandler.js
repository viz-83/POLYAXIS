class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** 8.2: all API errors return structured JSON with a user-friendly message; never leak stack traces. */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'Something went wrong. Please try again.' : err.message;

  if (status === 500) {
    console.error(`[${new Date().toISOString()}] Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(status).json({ error: { code, message, details: err.details } });
}

function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found.` } });
}

module.exports = { ApiError, errorHandler, notFound };
