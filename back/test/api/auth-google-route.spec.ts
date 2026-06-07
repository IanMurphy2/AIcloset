import request from 'supertest';

/**
 * The Google strategy is registered at module load time, gated on the presence
 * of GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in config. We set fake credentials
 * BEFORE importing the app (via jest.isolateModules) so the strategy registers,
 * then assert that GET /auth/google issues a 302 redirect to Google.
 *
 * No real Google E2E happens here: we only check the redirect kickoff.
 */
describe('GET /auth/google (route, with mock credentials)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
      FRONTEND_URL: 'http://localhost:5173',
    };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('redirects (302) to Google when credentials are configured', async () => {
    await jest.isolateModulesAsync(async () => {
      const { createExpressApp } = await import('../../src/api/ExpressApp');
      const app = createExpressApp();

      const res = await request(app).get('/auth/google');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('accounts.google.com');
    });
  });

  it('does NOT register the strategy (app still boots) without credentials', async () => {
    process.env = { ...OLD_ENV, GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '' };
    await jest.isolateModulesAsync(async () => {
      const { createExpressApp } = await import('../../src/api/ExpressApp');
      // Creating the app must not throw even though no Google strategy exists.
      expect(() => createExpressApp()).not.toThrow();
    });
  });
});
