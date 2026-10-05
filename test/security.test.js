const test = require('node:test');
const assert = require('node:assert/strict');
const {
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

test('sensitive database values use authenticated encryption', () => {
  const encrypted = encryptSensitive('top-secret-value');
  assert.equal(isEncrypted(encrypted), true);
  assert.notEqual(encrypted, 'top-secret-value');
  assert.equal(decryptSensitive(encrypted), 'top-secret-value');
  assert.throws(() => decryptSensitive(`${encrypted.slice(0, -2)}aa`));
});
