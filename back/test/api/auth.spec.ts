import request from 'supertest';
import { createExpressApp } from '../../src/api/ExpressApp';
import { AppDataSource } from '../../src/dbConnection';
import { User } from '../../src/lib/models/User';

describe('Auth API', () => {
  let app: ReturnType<typeof createExpressApp>;
  const testEmail = 'auth-test@example.com';
  const testPassword = 'password123';
  const testName = 'Auth Test User';

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    app = createExpressApp();
  }, 15000);

  afterEach(async () => {
    await AppDataSource.getRepository(User).delete({ email: testEmail });
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('POST /auth/register', () => {
    it('debería registrar un usuario y devolver token y user (201)', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword, name: testName });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toEqual({
        id: expect.any(String),
        email: testEmail,
        name: testName,
      });
    });

    it('debería devolver 409 si el email ya existe', async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword, name: testName });

      const response = await request(app)
        .post('/auth/register')
        .send({ email: testEmail, password: 'otherpass123', name: 'Other' });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('debería devolver 400 si el email no es válido', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'not-an-email', password: testPassword, name: testName });

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('debería devolver 400 si la contraseña tiene menos de 8 caracteres', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: testEmail, password: 'short', name: testName });

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      const userRepo = AppDataSource.getRepository(User);
      const user = userRepo.create({
        email: testEmail,
        password: testPassword,
        name: testName,
      });
      await userRepo.save(user);
    });

    it('debería hacer login y devolver token y user (200)', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toEqual({
        id: expect.any(String),
        email: testEmail,
        name: testName,
      });
    });

    it('debería devolver 401 con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    it('debería devolver 401 si el usuario no existe', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: testPassword });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    it('debería devolver 400 si el email no es válido', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'not-an-email', password: testPassword });

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });
});
