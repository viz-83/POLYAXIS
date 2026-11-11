const jwt = require('jsonwebtoken');
const sessionTracker = require('../utils/sessionTracker');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured. Set it in backend/.env (see .env.example).');
}

// AUTH-06 / 8.4: the token lives for 60 minutes of INACTIVITY. Each authenticated request older than
// SESSION_REFRESH_AFTER_SECONDS is answered with a fresh token (X-Session-Token) so an active user is never
// logged out mid-session, while an idle one expires exactly SESSION_TIMEOUT_SECONDS after their last request.
const SESSION_TIMEOUT_SECONDS = Number(process.env.SESSION_TIMEOUT_SECONDS || 3600);
const SESSION_REFRESH_AFTER_SECONDS = Number(process.env.SESSION_REFRESH_AFTER_SECONDS ?? 300);

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: SESSION_TIMEOUT_SECONDS }
  );
}

/** AUTH-07 / 8.4: every route except /api/auth/login requires a valid, unexpired session token. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'Authentication required.' } });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    sessionTracker.touch(req.user.id);

    const ageSeconds = Math.floor(Date.now() / 1000) - payload.iat;
    if (ageSeconds >= SESSION_REFRESH_AFTER_SECONDS) {
      res.setHeader('X-Session-Token', issueToken(req.user));
    }
    return next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'SESSION_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ error: { code, message: 'Session is invalid or has expired. Please log in again.' } });
  }
}

/** ADMIN-01 / 8.4: restrict Administrator-only routes to the Administrator role. */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Administrator') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Administrator access required.' } });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin, issueToken, JWT_SECRET, SESSION_TIMEOUT_SECONDS };
