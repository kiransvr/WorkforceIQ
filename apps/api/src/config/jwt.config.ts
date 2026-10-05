import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: getAccessSecret(),
  accessExpiresInSeconds: parseExpirationSeconds(process.env.JWT_ACCESS_EXPIRES_IN ?? '15m'),
}));

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32 || secret.toLowerCase().includes('change_me')) {
    throw new Error('JWT_ACCESS_SECRET must be a unique secret of at least 32 characters.');
  }
  return secret;
}

function parseExpirationSeconds(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) {
    throw new Error('JWT_ACCESS_EXPIRES_IN must use a duration such as 900s, 15m, 1h, or 7d.');
  }
  const amount = Number(match[1]);
  const unitInSeconds = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  const seconds = amount * unitInSeconds;
  if (!Number.isSafeInteger(seconds) || seconds < 60) {
    throw new Error('JWT_ACCESS_EXPIRES_IN must be at least 60 seconds and within the safe integer range.');
  }
  return seconds;
}
