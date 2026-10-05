import {
  decryptSensitiveString,
  encryptSensitiveString,
} from './encrypted-string.transformer';

describe('encryptedStringTransformer helpers', () => {
  const originalKey = process.env.FIELD_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.FIELD_ENCRYPTION_KEY = 'ab'.repeat(32);
  });

  afterAll(() => {
    if (originalKey === undefined) {
      delete process.env.FIELD_ENCRYPTION_KEY;
    } else {
      process.env.FIELD_ENCRYPTION_KEY = originalKey;
    }
  });

  it('encrypts sensitive text with unique authenticated ciphertext and round-trips it', () => {
    const plaintext = '1234567890123456';
    const first = encryptSensitiveString(plaintext);
    const second = encryptSensitiveString(plaintext);

    expect(first).toMatch(/^enc:v1:/);
    expect(first).not.toContain(plaintext);
    expect(first).not.toBe(second);
    expect(decryptSensitiveString(first)).toBe(plaintext);
  });

  it('rejects tampered ciphertext', () => {
    const encrypted = encryptSensitiveString('account-number');
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith('0') ? '1' : '0'}`;

    expect(() => decryptSensitiveString(tampered)).toThrow();
  });

  it('rejects plaintext values that have not been migrated', () => {
    expect(() => decryptSensitiveString('legacy-plaintext')).toThrow(
      'Run pending database migrations',
    );
  });

  it('fails closed when the encryption key is missing or malformed', () => {
    process.env.FIELD_ENCRYPTION_KEY = 'invalid';

    expect(() => encryptSensitiveString('account-number')).toThrow(
      'FIELD_ENCRYPTION_KEY must be a 32-byte key',
    );
  });
});
