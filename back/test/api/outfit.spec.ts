import request from 'supertest';
import { createExpressApp } from '../../src/api/ExpressApp';
import { AppDataSource } from '../../src/dbConnection';
import { Clothing } from '../../src/lib/models/Clothing';
import { Outfit } from '../../src/lib/models/Outfit';
import { User } from '../../src/lib/models/User';
import { ClothingFactory } from '../factories/clothing.factory';

describe('Outfit API', () => {
  let app: ReturnType<typeof createExpressApp>;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    app = createExpressApp();

    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOneBy({ email: 'outfit-test@example.com' });
    if (!user) {
      user = userRepo.create({
        email: 'outfit-test@example.com',
        password: 'testpass123',
        name: 'Outfit Test User',
      });
      await userRepo.save(user);
    }
    testUserId = user.id;
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'outfit-test@example.com', password: 'testpass123' });
    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.token;
  }, 15000);

  afterEach(async () => {
    await AppDataSource.query('DELETE FROM outfit_clothing_clothing');
    await AppDataSource.query('DELETE FROM outfit');
    await AppDataSource.query('DELETE FROM clothing');
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  const auth = () => ({
    get: (path: string) =>
      request(app).get(path).set('Authorization', `Bearer ${authToken}`),
    post: (path: string, body?: object) =>
      body
        ? request(app)
            .post(path)
            .set('Authorization', `Bearer ${authToken}`)
            .send(body)
        : request(app).post(path).set('Authorization', `Bearer ${authToken}`),
    put: (path: string, body?: object) =>
      body
        ? request(app)
            .put(path)
            .set('Authorization', `Bearer ${authToken}`)
            .send(body)
        : request(app).put(path).set('Authorization', `Bearer ${authToken}`),
    delete: (path: string) =>
      request(app).delete(path).set('Authorization', `Bearer ${authToken}`),
  });

  async function createClothingItems(count: number): Promise<Clothing[]> {
    const repo = AppDataSource.getRepository(Clothing);
    const items: Clothing[] = [];
    for (let i = 0; i < count; i++) {
      const c = ClothingFactory.build({ userId: testUserId });
      const saved = await repo.save(repo.create(c));
      items.push(saved);
    }
    return items;
  }

  describe('GET /outfit', () => {
    it('debería devolver una lista vacía si no hay outfits', async () => {
      const response = await auth().get('/outfit');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('debería devolver los outfits del usuario', async () => {
      const [c1, c2] = await createClothingItems(2);
      await auth().post('/outfit', {
        name: 'Mi outfit',
        description: 'Desc',
        clothingIds: [c1.id, c2.id],
      });

      const response = await auth().get('/outfit');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Mi outfit');
      expect(response.body[0].clothing).toHaveLength(2);
    });
  });

  describe('GET /outfit/:id', () => {
    it('debería devolver un outfit por su ID', async () => {
      const [c1] = await createClothingItems(1);
      const createRes = await auth().post('/outfit', {
        name: 'Outfit uno',
        description: 'Desc uno',
        clothingIds: [c1.id],
      });
      const id = createRes.body.id;

      const response = await auth().get(`/outfit/${id}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(id);
      expect(response.body.name).toBe('Outfit uno');
      expect(response.body.clothing).toHaveLength(1);
      expect(response.body.clothing[0].id).toBe(c1.id);
    });

    it('debería devolver 401 sin token', async () => {
      const response = await request(app).get(
        '/outfit/00000000-0000-0000-0000-000000000000'
      );
      expect(response.status).toBe(401);
    });

    it('debería devolver 404 si el ID no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await auth().get(`/outfit/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /outfit', () => {
    it('debería crear un outfit con clothingIds válidos (201)', async () => {
      const [c1, c2] = await createClothingItems(2);
      const response = await auth().post('/outfit', {
        name: 'Outfit nuevo',
        description: 'Descripción',
        clothingIds: [c1.id, c2.id],
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Outfit nuevo');
      expect(response.body.description).toBe('Descripción');
      expect(response.body.clothing).toHaveLength(2);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('debería devolver 400 si un clothingId no existe', async () => {
      const [c1] = await createClothingItems(1);
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await auth().post('/outfit', {
        name: 'Outfit',
        description: 'Desc',
        clothingIds: [c1.id, fakeId],
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /outfit/:id', () => {
    it('debería actualizar un outfit existente', async () => {
      const [c1, c2] = await createClothingItems(2);
      const createRes = await auth().post('/outfit', {
        name: 'Original',
        description: 'Original desc',
        clothingIds: [c1.id],
      });
      const id = createRes.body.id;

      const response = await auth().put(`/outfit/${id}`, {
        name: 'Actualizado',
        description: 'Nueva desc',
        clothingIds: [c1.id, c2.id],
      });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Actualizado');
      expect(response.body.description).toBe('Nueva desc');
      expect(response.body.clothing).toHaveLength(2);
    });

    it('debería devolver 404 si el outfit no existe', async () => {
      const [c1] = await createClothingItems(1);
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await auth().put(`/outfit/${fakeId}`, {
        name: 'Outfit',
        description: 'Desc',
        clothingIds: [c1.id],
      });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /outfit/:id', () => {
    it('debería eliminar un outfit existente', async () => {
      const [c1] = await createClothingItems(1);
      const createRes = await auth().post('/outfit', {
        name: 'To delete',
        description: 'Desc',
        clothingIds: [c1.id],
      });
      const id = createRes.body.id;

      const response = await auth().delete(`/outfit/${id}`);
      expect(response.status).toBe(204);

      const repo = AppDataSource.getRepository(Outfit);
      const found = await repo.findOneBy({ id });
      expect(found).toBeNull();
    });

    it('debería devolver 404 si el outfit no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await auth().delete(`/outfit/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });
});
