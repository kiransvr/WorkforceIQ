import { registerAs } from '@nestjs/config';
import { getFieldEncryptionKey } from '../common/transformers/encrypted-string.transformer';

export default registerAs('app', () => {
  getFieldEncryptionKey();
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.API_PORT ?? '3001', 10),
    webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
    fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY,
  };
});
