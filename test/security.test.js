const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createPasswordResetToken,
  hashPasswordResetToken,
  resolveTrustedFrontendOrigin,
  signAdminToken,
  validateStrongPassword,
  verifyAdminToken,
  verifyUserToken,
} = require('../utils/security');
const { decryptSensitive, encryptSensitive, isEncrypted } = require('../utils/fieldEncryption');

test.before(() => {
  process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';
  process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
});

test('admin tokens have a strict type, issuer, and audience', () => {
  const token = signAdminToken({ _id: 'admin-id', tokenVersion: 4 });
  const decoded = verifyAdminToken(token);
  assert.equal(decoded.type, 'admin');
  assert.equal(decoded.adminId, 'admin-id');
  assert.equal(decoded.tokenVersion, 4);
  assert.throws(() => verifyUserToken(token));
});

test('strong admin passwords require length and character classes', () => {
  assert.match(validateStrongPassword('short'), /between 12 and 128/);
  assert.match(validateStrongPassword('alllowercase123!'), /uppercase/);
  assert.equal(validateStrongPassword('Correct-Horse-9!'), null);
});

test('password reset tokens are random, sha256-hashed, and strictly validated', () => {
  const { rawToken, tokenHash, expiresAt } = createPasswordResetToken();
  assert.match(rawToken, /^[a-f0-9]{64}$/);
  assert.match(tokenHash, /^[a-f0-9]{64}$/);
  assert.notEqual(rawToken, tokenHash);
  assert.equal(hashPasswordResetToken(rawToken), tokenHash);
  assert.equal(hashPasswordResetToken('invalid-token'), null);
  assert.ok(expiresAt instanceof Date && expiresAt.getTime() > Date.now());
});

test('frontend origin resolver accepts trusted origins and blocks spoofed origins', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  delete process.env.FRONTEND_URL;

  try {
    process.env.NODE_ENV = 'development';
    const localReq = { get: (h) => (h === 'origin' ? 'http://localhost:3000' : undefined) };
    assert.equal(resolveTrustedFrontendOrigin(localReq), 'http://localhost:3000');

    const spoofedReq = { get: (h) => (h === 'origin' ? 'https://evil.example' : undefined) };
    assert.equal(resolveTrustedFrontendOrigin(spoofedReq), 'http://localhost:3000');

    process.env.NODE_ENV = 'production';
    const prodReq = { get: (h) => (h === 'origin' ? 'https://ansaritools.com' : undefined) };
    assert.equal(resolveTrustedFrontendOrigin(prodReq), 'https://ansaritools.com');
    assert.equal(resolveTrustedFrontendOrigin(spoofedReq), 'https://ansaritools.com');
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalFrontendUrl !== undefined) {
      process.env.FRONTEND_URL = originalFrontendUrl;
    } else {
      delete process.env.FRONTEND_URL;
    }
  }
});

test('sensitive database values use authenticated encryption', () => {
  const encrypted = encryptSensitive('top-secret-value');
  assert.equal(isEncrypted(encrypted), true);
  assert.notEqual(encrypted, 'top-secret-value');
  assert.equal(decryptSensitive(encrypted), 'top-secret-value');
  assert.throws(() => decryptSensitive(`${encrypted.slice(0, -2)}aa`));
});
