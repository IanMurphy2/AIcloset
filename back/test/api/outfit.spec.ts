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

  // A second user, used to verify ownership/isolation rules.
  let otherToken: string;
  let otherUserId: string;

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

    let other = await userRepo.findOneBy({ email: 'outfit-other@example.com' });
    if (!other) {
      other = userRepo.create({
        email: 'outfit-other@example.com',
        password: 'testpass123',
        name: 'Outfit Other User',
      });
      await userRepo.save(other);
    }
    otherUserId = other.id;
    const otherLoginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'outfit-other@example.com', password: 'testpass123' });
    expect(otherLoginRes.status).toBe(200);
    otherToken = otherLoginRes.body.token;
  }, 15000);

  afterEach(async () => {
    await AppDataSource.query('DELETE FROM outfit_item');
    await AppDataSource.query('DELETE FROM outfit');
    await AppDataSource.query('DELETE FROM clothing');
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  const authFor = (token: string) => ({
    get: (path: string) =>
      request(app).get(path).set('Authorization', `Bearer ${token}`),
    post: (path: string, body?: object) =>
      body
        ? request(app)
            .post(path)
            .set('Authorization', `Bearer ${token}`)
            .send(body)
        : request(app).post(path).set('Authorization', `Bearer ${token}`),
    put: (path: string, body?: object) =>
      body
        ? request(app)
            .put(path)
            .set('Authorization', `Bearer ${token}`)
            .send(body)
        : request(app).put(path).set('Authorization', `Bearer ${token}`),
    delete: (path: string) =>
      request(app).delete(path).set('Authorization', `Bearer ${token}`),
  });

  const auth = () => authFor(authToken);
  const other = () => authFor(otherToken);

  // Creates `count` clothing items belonging to the given user (defaults to the
  // main test user) and returns them in creation order.
  async function createClothingItems(
    count: number,
    userId: string = testUserId
  ): Promise<Clothing[]> {
    const repo = AppDataSource.getRepository(Clothing);
    const items: Clothing[] = [];
    for (let i = 0; i < count; i++) {
      const c = ClothingFactory.build({ userId });
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
        items: [
          { clothingId: c1.id, category: 'tops' },
          { clothingId: c2.id, category: 'bottoms' },
        ],
      });

      const response = await auth().get('/outfit');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Mi outfit');
      expect(response.body[0].items).toHaveLength(2);
      expect(response.body[0].isPublic).toBe(false);
    });

    it('no debería devolver outfits de otros usuarios', async () => {
      const [c1] = await createClothingItems(1, otherUserId);
      await other().post('/outfit', {
        name: 'Ajeno',
        description: 'De otro usuario',
        items: [{ clothingId: c1.id, category: 'tops' }],
      });

      const response = await auth().get('/outfit');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /outfit/:id', () => {
    it('debería devolver un outfit por su ID con sus items', async () => {
      const [c1, c2] = await createClothingItems(2);
      const createRes = await auth().post('/outfit', {
        name: 'Outfit uno',
        description: 'Desc uno',
        items: [
          { clothingId: c1.id, category: 'tops' },
          { clothingId: c2.id, category: 'calzado' },
        ],
      });
      const id = createRes.body.id;

      const response = await auth().get(`/outfit/${id}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(id);
      expect(response.body.name).toBe('Outfit uno');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].clothingId).toBe(c1.id);
      expect(response.body.items[0].category).toBe('tops');
      expect(response.body.items[0].imageUrl).toBe(c1.imageUrl);
      expect(response.body.items[1].clothingId).toBe(c2.id);
      expect(response.body.items[1].category).toBe('calzado');
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

    it('debería devolver 404 si el outfit es de otro usuario', async () => {
      const [c1] = await createClothingItems(1, otherUserId);
      const createRes = await other().post('/outfit', {
        name: 'Ajeno',
        description: 'De otro usuario',
        items: [{ clothingId: c1.id, category: 'tops' }],
      });
      const id = createRes.body.id;

      const response = await auth().get(`/outfit/${id}`);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /outfit', () => {
    it('debería crear un outfit con items en slots distintos (201)', async () => {
      const [c1, c2] = await createClothingItems(2);
      const response = await auth().post('/outfit', {
        name: 'Outfit nuevo',
        description: 'Descripción',
        items: [
          { clothingId: c1.id, category: 'tops' },
          { clothingId: c2.id, category: 'bottoms' },
        ],
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Outfit nuevo');
      expect(response.body.description).toBe('Descripción');
      expect(response.body.items).toHaveLength(2);
      // default isPublic cuando se omite
      expect(response.body.isPublic).toBe(false);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('debería devolver los items ordenados por position según el orden enviado', async () => {
      const [c1, c2, c3] = await createClothingItems(3);
      const response = await auth().post('/outfit', {
        name: 'Orden estable',
        description: 'Desc',
        items: [
          { clothingId: c2.id, category: 'bottoms' },
          { clothingId: c1.id, category: 'tops' },
          { clothingId: c3.id, category: 'calzado' },
        ],
      });

      expect(response.status).toBe(201);
      expect(response.body.items).toHaveLength(3);
      expect(response.body.items.map((i: { position: number }) => i.position)).toEqual([
        0, 1, 2,
      ]);
      expect(
        response.body.items.map((i: { clothingId: string }) => i.clothingId)
      ).toEqual([c2.id, c1.id, c3.id]);
      expect(
        response.body.items.map((i: { category: string }) => i.category)
      ).toEqual(['bottoms', 'tops', 'calzado']);
    });

    it('debería persistir isPublic: true cuando se envía', async () => {
      const [c1] = await createClothingItems(1);
      const response = await auth().post('/outfit', {
        name: 'Público',
        description: 'Desc',
        isPublic: true,
        items: [{ clothingId: c1.id, category: 'tops' }],
      });

      expect(response.status).toBe(201);
      expect(response.body.isPublic).toBe(true);

      // y persiste al releer
      const getRes = await auth().get(`/outfit/${response.body.id}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.isPublic).toBe(true);
    });

    it('debería devolver 400 si dos items comparten la misma category (1-por-slot)', async () => {
      const [c1, c2] = await createClothingItems(2);
      const response = await auth().post('/outfit', {
        name: 'Outfit',
        description: 'Desc',
        items: [
          { clothingId: c1.id, category: 'tops' },
          { clothingId: c2.id, category: 'tops' },
        ],
      });

      expect(response.status).toBe(400);
      expect(response.body.message.toLowerCase()).toContain('duplicate');
    });

    it('debería devolver 400 si la category no es un slot válido', async () => {
      const [c1] = await createClothingItems(1);
      const response = await auth().post('/outfit', {
        name: 'Outfit',
        description: 'Desc',
        items: [{ clothingId: c1.id, category: 'sombreros' }],
      });

      expect(response.status).toBe(400);
      expect(response.body.message.toLowerCase()).toContain('invalid');
    });

    it('debería devolver 400 si un clothingId no existe', async () => {
      const [c1] = await createClothingItems(1);
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await auth().post('/outfit', {
        name: 'Outfit',
        description: 'Desc',
        items: [
          { clothingId: c1.id, category: 'tops' },
          { clothingId: fakeId, category: 'bottoms' },
        ],
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not found');
    });

    it('debería devolver 400 si el clothingId pertenece a otro usuario', async () => {
      const [foreign] = await createClothingItems(1, otherUserId);
      const response = await auth().post('/outfit', {
        name: 'Outfit',
        description: 'Desc',
        items: [{ clothingId: foreign.id, category: 'tops' }],
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /outfit/:id', () => {
    it('debería actualizar un outfit reemplazando items y toggleando isPublic', async () => {
      const [c1, c2, c3] = await createClothingItems(3);
      const createRes = await auth().post('/outfit', {
        name: 'Original',
        description: 'Original desc',
        isPublic: false,
        items: [{ clothingId: c1.id, category: 'tops' }],
      });
      const id = createRes.body.id;
      expect(createRes.body.isPublic).toBe(false);

      const response = await auth().put(`/outfit/${id}`, {
        name: 'Actualizado',
        description: 'Nueva desc',
        isPublic: true,
        items: [
          { clothingId: c2.id, category: 'bottoms' },
          { clothingId: c3.id, category: 'calzado' },
        ],
      });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Actualizado');
      expect(response.body.description).toBe('Nueva desc');
      expect(response.body.isPublic).toBe(true);
      // los items fueron reemplazados (ya no aparece c1)
      expect(response.body.items).toHaveLength(2);
      expect(
        response.body.items.map((i: { clothingId: string }) => i.clothingId)
      ).toEqual([c2.id, c3.id]);
      expect(response.body.items.map((i: { position: number }) => i.position)).toEqual([
        0, 1,
      ]);

      // persistido en lectura posterior
      const getRes = await auth().get(`/outfit/${id}`);
      expect(getRes.body.items).toHaveLength(2);
      expect(getRes.body.isPublic).toBe(true);
    });

    it('debería devolver 400 al actualizar con category duplicada', async () => {
      const [c1, c2, c3] = await createClothingItems(3);
      const createRes = await auth().post('/outfit', {
        name: 'Original',
        description: 'Desc',
        items: [{ clothingId: c1.id, category: 'tops' }],
      });
      const id = createRes.body.id;

      const response = await auth().put(`/outfit/${id}`, {
        name: 'Original',
        description: 'Desc',
        items: [
          { clothingId: c2.id, category: 'tops' },
          { clothingId: c3.id, category: 'tops' },
        ],
      });

      expect(response.status).toBe(400);
      expect(response.body.message.toLowerCase()).toContain('duplicate');
    });

    it('debería devolver 404 si el outfit no existe', async () => {
      const [c1] = await createClothingItems(1);
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await auth().put(`/outfit/${fakeId}`, {
        name: 'Outfit',
        description: 'Desc',
        items: [{ clothingId: c1.id, category: 'tops' }],
      });
      expect(response.status).toBe(404);
    });

    it('debería devolver 404 si el outfit es de otro usuario', async () => {
      const [cOther] = await createClothingItems(1, otherUserId);
      const createRes = await other().post('/outfit', {
        name: 'Ajeno',
        description: 'Desc',
        items: [{ clothingId: cOther.id, category: 'tops' }],
      });
      const id = createRes.body.id;

      const [cMine] = await createClothingItems(1);
      const response = await auth().put(`/outfit/${id}`, {
        name: 'Hackeo',
        description: 'Desc',
        items: [{ clothingId: cMine.id, category: 'tops' }],
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
        items: [{ clothingId: c1.id, category: 'tops' }],
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

    it('debería devolver 404 al borrar un outfit de otro usuario', async () => {
      const [cOther] = await createClothingItems(1, otherUserId);
      const createRes = await other().post('/outfit', {
        name: 'Ajeno',
        description: 'Desc',
        items: [{ clothingId: cOther.id, category: 'tops' }],
      });
      const id = createRes.body.id;

      const response = await auth().delete(`/outfit/${id}`);
      expect(response.status).toBe(404);

      // sigue existiendo para su dueño
      const getRes = await other().get(`/outfit/${id}`);
      expect(getRes.status).toBe(200);
    });
  });
});
