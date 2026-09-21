import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  name: process.env.POSTGRES_DB ?? 'workforceiq',
  user: process.env.POSTGRES_USER ?? 'workforceiq_user',
  password: process.env.POSTGRES_PASSWORD,
}));
