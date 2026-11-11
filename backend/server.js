require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { requireAuth } = require('./middleware/auth');
const { sanitiseBody } = require('./middleware/validate');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const materialRoutes = require('./routes/materials');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;
// Locally the Vite dev server is a separate origin. On Render the API serves the built frontend itself
// (same origin), and RENDER_EXTERNAL_URL is the service's public URL.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';

app.disable('x-powered-by');
app.set('trust proxy', 1);

// 8.4: security headers on every response.
app.use(helmet());

// 8.4: CORS restricted to the configured frontend origin only.
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    exposedHeaders: ['X-Session-Token'], // sliding-session refresh (AUTH-06)
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(sanitiseBody);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 8.4: global API throttle guarding against abuse; login has its own tighter limiter.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

// AUTH: every route below requires a valid session token.
app.use('/api/projects', requireAuth, projectRoutes);
app.use('/api/materials', requireAuth, materialRoutes);
app.use('/api/admin', requireAuth, adminRoutes);

// Serve the built React frontend as a single deployable unit (9.).
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(
  express.static(frontendDist, {
    index: false, // index.html is served below so it can be sent uncached
    setHeaders(res, filePath) {
      // Vite fingerprints everything under /assets, so those files can be cached for a year.
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);
// Single-page-app fallback: any non-API GET returns the app shell and React Router takes over.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use('/api', notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`PolyAxis backend listening on port ${PORT} (frontend origin: ${FRONTEND_ORIGIN})`);
});

module.exports = app;
