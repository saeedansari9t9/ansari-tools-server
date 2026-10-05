const jwt = require('jsonwebtoken');
const { getEncryptionKey } = require('./fieldEncryption');

const TOKEN_ISSUER = 'ansari-tools-api';
const ADMIN_TOKEN_AUDIENCE = 'ansari-tools-website-admin';
const USER_TOKEN_AUDIENCE = 'ansari-tools-dashboard';
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

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
      expiresIn: '8h',
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
      expiresIn: '12h',
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
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }
}

module.exports = {
  adminCookieOptions,
  clearAdminCookieOptions,
  legacyAdminCookieOptions,
  signAdminToken,
  signUserToken,
  validateRuntimeSecrets,
  validateStrongPassword,
  verifyAdminToken,
  verifyUserToken,
};
