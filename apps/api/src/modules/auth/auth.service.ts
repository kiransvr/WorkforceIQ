export class AuthService {
  login(credentials: { email: string; password: string }) {
    return {
      accessToken: `demo-token-${credentials.email}`,
      user: {
        id: 'demo-user-1',
        name: 'Ava Patel',
        email: credentials.email,
        role: 'HR Admin',
      },
    };
  }

  getProfile() {
    return {
      user: {
        id: 'demo-user-1',
        name: 'Ava Patel',
        email: 'demo@workforceiq.com',
        role: 'HR Admin',
      },
      permissions: ['employee:read', 'payroll:read', 'leave:write'],
    };
  }
}
