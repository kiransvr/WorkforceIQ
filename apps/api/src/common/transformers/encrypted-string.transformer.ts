import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import { ValueTransformer } from 'typeorm';

const ENCRYPTED_VALUE_PREFIX = 'enc:v1:';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

export function getFieldEncryptionKey(): Buffer {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key || !/^[\da-f]{64}$/i.test(key)) {
    throw new Error(
      'FIELD_ENCRYPTION_KEY must be a 32-byte key encoded as 64 hexadecimal characters.',
    );
  }
  return Buffer.from(key, 'hex');
}

export function isEncryptedString(value: string): boolean {
  return value.startsWith(ENCRYPTED_VALUE_PREFIX);
}

export function encryptSensitiveString(value: string): string {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv('aes-256-gcm', getFieldEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_VALUE_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptSensitiveString(value: string): string {
  if (!isEncryptedString(value)) {
    throw new Error(
      'Plaintext sensitive data found. Run pending database migrations before starting the updated API.',
    );
  }

  const [version, format, ivHex, authTagHex, ciphertextHex, ...extra] =
    value.split(':');
  if (
    version !== 'enc' ||
    format !== 'v1' ||
    !ivHex ||
    !authTagHex ||
    ciphertextHex === undefined ||
    extra.length > 0 ||
    !/^[\da-f]+$/i.test(ivHex) ||
    ivHex.length !== IV_LENGTH_BYTES * 2 ||
    !/^[\da-f]+$/i.test(authTagHex) ||
    authTagHex.length !== AUTH_TAG_LENGTH_BYTES * 2 ||
    (ciphertextHex.length > 0 && !/^[\da-f]+$/i.test(ciphertextHex))
  ) {
    throw new Error('Stored sensitive data has an invalid encrypted format.');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getFieldEncryptionKey(),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

export const encryptedStringTransformer: ValueTransformer = {
  to: (value: string | null | undefined): string | null | undefined =>
    value == null ? value : encryptSensitiveString(value),
  from: (value: string | null | undefined): string | null | undefined =>
    value == null ? value : decryptSensitiveString(value),
};
