const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getEncryptionKey } = require('./fieldEncryption');

const TOKEN_ISSUER = 'ansari-tools-api';
const ADMIN_TOKEN_AUDIENCE = 'ansari-tools-website-admin';
const USER_TOKEN_AUDIENCE = 'ansari-tools-dashboard';
const ADMIN_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters');
  }
  return secret;
}

function signAdminToken(admin) {
  return jwt.sign(
    {
      type: 'admin',
      adminId: admin._id,
      tokenVersion: admin.tokenVersion || 0,
    },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      audience: ADMIN_TOKEN_AUDIENCE,
      issuer: TOKEN_ISSUER,
      expiresIn: '30d',
    }
  );
}

function verifyAdminToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    audience: ADMIN_TOKEN_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });
}

function signUserToken(user, extraClaims = {}) {
  return jwt.sign(
    {
      type: 'user',
      userId: user._id,
      username: user.username,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
      ...extraClaims,
    },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      audience: USER_TOKEN_AUDIENCE,
      issuer: TOKEN_ISSUER,
      expiresIn: '30d',
    }
  );
}

function verifyUserToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    audience: USER_TOKEN_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });
}

function adminCookieOptions() {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_MS,
  };

  if (process.env.ADMIN_COOKIE_DOMAIN) {
    options.domain = process.env.ADMIN_COOKIE_DOMAIN;
  }

  return options;
}

function clearAdminCookieOptions() {
  const { maxAge, ...options } = adminCookieOptions();
  return options;
}

function legacyAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    domain: process.env.LEGACY_ADMIN_COOKIE_DOMAIN || '.ansaritools.com',
    path: '/',
  };
}

function hashPasswordResetToken(rawToken) {
  if (typeof rawToken !== 'string') return null;
  const trimmed = rawToken.trim();
  if (!/^[a-f0-9]{64}$/i.test(trimmed)) return null;
  return crypto.createHash('sha256').update(trimmed).digest('hex');
}

function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  return { rawToken, tokenHash, expiresAt };
}

function getAllowedOrigins() {
  const allowedOrigins = new Set([
    'https://ansaritools.com',
    'https://www.ansaritools.com',
    'https://dash.ansaritools.com',
    ...(process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  ]);

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:3000');
    allowedOrigins.add('http://localhost:5173');
    allowedOrigins.add('http://localhost:5174');
    allowedOrigins.add('http://127.0.0.1:3000');
    allowedOrigins.add('http://127.0.0.1:5173');
    allowedOrigins.add('http://127.0.0.1:5174');
  }

  return allowedOrigins;
}

function resolveTrustedFrontendOrigin(req) {
  const configured = (process.env.FRONTEND_URL || process.env.ADMIN_APP_URL || '').trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // ignore invalid configured URL and fall back to trusted origins
    }
  }

  const allowedOrigins = getAllowedOrigins();
  const candidates = [req?.get?.('origin'), req?.get?.('referer')].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const origin = new URL(candidate).origin;
      if (allowedOrigins.has(origin)) {
        return origin;
      }
    } catch {
      // ignore malformed headers
    }
  }

  return process.env.NODE_ENV === 'production'
    ? 'https://ansaritools.com'
    : 'http://localhost:3000';
}

function validateStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return 'Password must be between 12 and 128 characters';
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include uppercase, lowercase, number, and special character';
  }
  return null;
}

function validateRuntimeSecrets() {
  getJwtSecret();
  getEncryptionKey();
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    throw new Error('MONGODB_URI or MONGO_URI is required');
  }
}

module.exports = {
  adminCookieOptions,
  clearAdminCookieOptions,
  createPasswordResetToken,
  getAllowedOrigins,
  hashPasswordResetToken,
  legacyAdminCookieOptions,
  resolveTrustedFrontendOrigin,
  signAdminToken,
  signUserToken,
  validateRuntimeSecrets,
  validateStrongPassword,
  verifyAdminToken,
  verifyUserToken,
};
