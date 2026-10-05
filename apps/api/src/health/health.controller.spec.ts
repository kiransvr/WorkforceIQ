import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns an ok status and a valid timestamp', () => {
    const result = new HealthController().getHealth();

    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
