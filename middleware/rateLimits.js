const { rateLimit } = require('express-rate-limit');

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts. Please try again later.' },
});

const authWriteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many authentication requests. Please try again later.' },
});

module.exports = { authWriteRateLimit, loginRateLimit };
