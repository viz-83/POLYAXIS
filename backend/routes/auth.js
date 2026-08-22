const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthService = require('../services/AuthService');
const { validateBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/** 8.4: throttle brute-force login attempts independently of the global API limiter. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please wait a few minutes and try again.' } },
});

router.post(
  '/login',
  loginLimiter,
  validateBody({
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),
  (req, res) => {
    const { email, password } = req.body;
    const result = AuthService.login(email, password);
    res.json(result);
  }
);

router.post('/logout', requireAuth, (req, res) => {
  // JWT sessions are stateless in Phase 1; logout is enforced client-side by discarding the token.
  res.json({ success: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
