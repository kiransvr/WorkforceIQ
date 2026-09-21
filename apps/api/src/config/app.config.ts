import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3001', 10),
  webUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY,
}));
