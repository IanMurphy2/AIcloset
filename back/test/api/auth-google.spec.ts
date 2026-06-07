import jwt from 'jsonwebtoken';
import type { Profile } from 'passport-google-oauth20';
import { AppDataSource } from '../../src/dbConnection';
import { User } from '../../src/lib/models/User';
import { findOrCreateGoogleUser } from '../../src/lib/auth/googleUser';
import { signToken } from '../../src/lib/auth/signToken';
import config from '../../src/Config';

function mockProfile(email: string, displayName?: string): Profile {
  return {
    id: 'google-id-123',
    displayName: displayName as string,
    emails: [{ value: email, verified: 'true' }],
    provider: 'google',
  } as unknown as Profile;
}

describe('Google OAuth backend slice', () => {
  const newEmail = 'google-new@example.com';
  const existingEmail = 'google-existing@example.com';

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  }, 15000);

  afterEach(async () => {
    const repo = AppDataSource.getRepository(User);
    await repo.delete({ email: newEmail });
    await repo.delete({ email: existingEmail });
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('findOrCreateGoogleUser', () => {
    it('creates the user when the email does not exist', async () => {
      const profile = mockProfile(newEmail, 'Google New User');
      const user = await findOrCreateGoogleUser(profile);

      expect(user.id).toEqual(expect.any(String));
      expect(user.email).toBe(newEmail);
      expect(user.name).toBe('Google New User');

      // Persisted to the DB.
      const fromDb = await AppDataSource.getRepository(User).findOneBy({ email: newEmail });
      expect(fromDb).not.toBeNull();

      // The random password must not match an arbitrary plaintext: local
      // login is effectively disabled for Google accounts.
      const matches = await fromDb!.comparePassword('anything');
      expect(matches).toBe(false);
    });

    it('falls back to email as name when displayName is missing', async () => {
      const profile = mockProfile(newEmail);
      const user = await findOrCreateGoogleUser(profile);
      expect(user.name).toBe(newEmail);
    });

    it('reuses the existing user (no duplicate) when the email already exists', async () => {
      const repo = AppDataSource.getRepository(User);
      const seeded = repo.create({
        email: existingEmail,
        password: 'localpassword123',
        name: 'Already Here',
      });
      await repo.save(seeded);

      const user = await findOrCreateGoogleUser(mockProfile(existingEmail, 'Different Name'));

      expect(user.id).toBe(seeded.id);
      // Name is not overwritten by the Google profile.
      expect(user.name).toBe('Already Here');

      const count = await repo.count({ where: { email: existingEmail } });
      expect(count).toBe(1);
    });

    it('throws when the profile has no email', async () => {
      const profile = { id: 'x', displayName: 'No Email', provider: 'google' } as unknown as Profile;
      await expect(findOrCreateGoogleUser(profile)).rejects.toThrow(/email/i);
    });
  });

  describe('signToken', () => {
    it('produces a JWT verifiable with the configured secret and { id, email } payload', () => {
      const token = signToken({ id: 'user-uuid-1', email: 'token-test@example.com' });
      const decoded = jwt.verify(token, config.get('jwt.secret') as string) as jwt.JwtPayload;

      expect(decoded.id).toBe('user-uuid-1');
      expect(decoded.email).toBe('token-test@example.com');
    });
  });
});
