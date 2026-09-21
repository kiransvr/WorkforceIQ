import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  it('returns a demo login payload with an access token', () => {
    const result = service.login({ email: 'demo@workforceiq.com', password: 'demo123' });

    expect(result.accessToken).toContain('demo-token');
    expect(result.user.email).toBe('demo@workforceiq.com');
  });

  it('returns the current demo profile', () => {
    const profile = service.getProfile();

    expect(profile.user.name).toBe('Ava Patel');
    expect(profile.user.role).toBe('HR Admin');
  });
});
