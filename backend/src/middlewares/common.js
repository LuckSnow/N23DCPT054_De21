export function studentHeader(req, res, next) { res.setHeader('X-Student-Id', 'N23DCPT054'); next(); }
export function requestLog(req, res, next) {
  const started = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`));
  next();
}
export class HttpError extends Error {
  constructor(status, message, details = []) { super(message); this.status = status; this.details = details; }
}
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code?.startsWith('SQLITE_CONSTRAINT')) {
    return res.status(409).json({ error: 'Dữ liệu vi phạm ràng buộc.', details: [] });
  }
  if (!error.status) console.error(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : 'Lỗi máy chủ.', details: error.details || [] });
}
