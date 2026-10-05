const crypto = require('crypto');

const PREFIX = 'enc:v1:';

function getEncryptionKey() {
  const encodedKey = process.env.DATA_ENCRYPTION_KEY;
  if (!encodedKey) {
    throw new Error('DATA_ENCRYPTION_KEY is required for sensitive data');
  }

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) {
    throw new Error('DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  }
  return key;
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function encryptSensitive(value) {
  if (value === undefined || value === null || value === '') return value;
  if (isEncrypted(value)) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

function decryptSensitive(value) {
  if (!isEncrypted(value)) return value;

  const parts = value.slice(PREFIX.length).split(':');
  if (parts.length !== 3) throw new Error('Encrypted value has an invalid format');

  const [iv, tag, ciphertext] = parts.map((part) => Buffer.from(part, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

module.exports = { decryptSensitive, encryptSensitive, getEncryptionKey, isEncrypted };
