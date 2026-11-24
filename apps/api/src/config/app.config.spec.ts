import appConfig from './app.config';

describe('app config', () => {
  const originalEnvironment = {
    port: process.env.PORT,
    apiPort: process.env.API_PORT,
    fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY,
  };

  beforeEach(() => {
    process.env.FIELD_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  afterEach(() => {
    if (originalEnvironment.port === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalEnvironment.port;
    }

    if (originalEnvironment.apiPort === undefined) {
      delete process.env.API_PORT;
    } else {
      process.env.API_PORT = originalEnvironment.apiPort;
    }

    if (originalEnvironment.fieldEncryptionKey === undefined) {
      delete process.env.FIELD_ENCRYPTION_KEY;
    } else {
      process.env.FIELD_ENCRYPTION_KEY = originalEnvironment.fieldEncryptionKey;
    }
  });

  it('uses the platform-provided PORT when available', () => {
    process.env.PORT = '10000';
    process.env.API_PORT = '3001';

    expect(appConfig().port).toBe(10000);
  });

  it('falls back to API_PORT for local development', () => {
    delete process.env.PORT;
    process.env.API_PORT = '3101';

    expect(appConfig().port).toBe(3101);
  });

  it('defaults to port 3001', () => {
    delete process.env.PORT;
    delete process.env.API_PORT;

    expect(appConfig().port).toBe(3001);
  });
});
