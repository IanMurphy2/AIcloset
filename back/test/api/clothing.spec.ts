import request from 'supertest';
import { createExpressApp } from '../../src/api/ExpressApp';
import { AppDataSource } from '../../src/dbConnection';
import { Clothing } from '../../src/lib/models/Clothing';
import { User } from '../../src/lib/models/User';
import { ClothingFactory } from '../factories/clothing.factory';

describe('Clothing API', () => {
  let app: ReturnType<typeof createExpressApp>;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    app = createExpressApp();

    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOneBy({ email: 'clothing-test@example.com' });
    if (!user) {
      user = userRepo.create({
        email: 'clothing-test@example.com',
        password: 'testpass123',
        name: 'Test User',
      });
      await userRepo.save(user);
    }
    testUserId = user.id;
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'clothing-test@example.com', password: 'testpass123' });
    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.token;
  }, 15000);

  afterEach(async () => {
    await AppDataSource.query('DELETE FROM outfit_clothing_clothing');
    await AppDataSource.query('DELETE FROM clothing');
    await AppDataSource.query('DELETE FROM outfit');
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  const auth = () => ({
    get: (path: string) => request(app).get(path).set('Authorization', `Bearer ${authToken}`),
    post: (path: string, body?: object) =>
      body ? request(app).post(path).set('Authorization', `Bearer ${authToken}`).send(body) : request(app).post(path).set('Authorization', `Bearer ${authToken}`),
    put: (path: string, body?: object) =>
      body ? request(app).put(path).set('Authorization', `Bearer ${authToken}`).send(body) : request(app).put(path).set('Authorization', `Bearer ${authToken}`),
    delete: (path: string) => request(app).delete(path).set('Authorization', `Bearer ${authToken}`),
  });

  describe('GET /clothing', () => {
    it('debería devolver una lista vacía si no hay ropa', async () => {
      const response = await auth().get('/clothing');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('debería devolver las prendas cargadas', async () => {
      const repo = AppDataSource.getRepository(Clothing);
      const fakeClothing = ClothingFactory.build({ userId: testUserId });
      await repo.save(repo.create(fakeClothing));

      const response = await auth().get('/clothing');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].description).toBe(fakeClothing.description);
    });
  });

  describe('GET /clothing/:id', () => {
    it('debería devolver una prenda por su ID', async () => {
      const repo = AppDataSource.getRepository(Clothing);
      const fakeClothing = ClothingFactory.build({ userId: testUserId });
      const saved = await repo.save(repo.create(fakeClothing));

      const response = await auth().get(`/clothing/${saved.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(saved.id);
      expect(response.body.description).toBe(saved.description);
    });

    it('debería devolver 401 sin token', async () => {
      const response = await request(app).get('/clothing/00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(401);
    });

    it('debería devolver 404 si el ID no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await auth().get(`/clothing/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /clothing/upload', () => {
    it('debería subir una imagen y luego crear una prenda con la URL devuelta', async () => {
      const minimalPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      );
      const uploadRes = await request(app)
        .post('/clothing/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', minimalPng, 'photo.png');

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.imageUrl).toBeDefined();
      expect(uploadRes.body.imageUrl).toMatch(/^\/uploads\/.+/);

      const createRes = await auth().post('/clothing', {
        imageUrl: uploadRes.body.imageUrl,
        description: 'Prenda desde upload',
        category: 'remeras',
      });
      expect(createRes.status).toBe(201);
      expect(createRes.body.description).toBe('Prenda desde upload');
      expect(createRes.body.imageUrl).toBe(uploadRes.body.imageUrl);

      const repo = AppDataSource.getRepository(Clothing);
      const dbItem = await repo.findOneBy({
        description: 'Prenda desde upload',
        userId: testUserId,
      });
      expect(dbItem).toBeDefined();
    });

    it('debería devolver 401 sin token', async () => {
      const minimalPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      );
      const response = await request(app)
        .post('/clothing/upload')
        .attach('image', minimalPng, 'photo.png');
      expect(response.status).toBe(401);
    });

    it('debería devolver 400 si no se envía imagen', async () => {
      const response = await request(app)
        .post('/clothing/upload')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/image|file/i);
    });
  });

  describe('POST /clothing', () => {
    it('debería crear una nueva prenda exitosamente', async () => {
      const newClothing = {
        imageUrl: "https://mi-foto.com/remera.jpg",
        description: "Remera de Rock",
        category: "remeras"
      };

      const response = await auth().post('/clothing', newClothing);

      expect(response.status).toBe(201);
      expect(response.body.description).toBe(newClothing.description);

      const repo = AppDataSource.getRepository(Clothing);
      const dbItem = await repo.findOneBy({ description: "Remera de Rock", userId: testUserId });
      expect(dbItem).toBeDefined();
    });
  });

  describe('PUT /clothing/:id', () => {
    it('debería actualizar una prenda existente', async () => {
      const repo = AppDataSource.getRepository(Clothing);
      const fakeClothing = ClothingFactory.build({ userId: testUserId });
      const saved = await repo.save(repo.create(fakeClothing));

      const updates = { description: "Descripción actualizada", color: "rojo" };

      const response = await auth().put(`/clothing/${saved.id}`, updates);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.color).toBe(updates.color);
      expect(response.body.id).toBe(saved.id);
    });

    it('debería devolver 404 si la prenda no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await auth().put(`/clothing/${fakeId}`, { description: "No existe" });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /clothing/:id', () => {
    it('debería eliminar una prenda existente', async () => {
      const repo = AppDataSource.getRepository(Clothing);
      const fakeClothing = ClothingFactory.build({ userId: testUserId });
      const saved = await repo.save(repo.create(fakeClothing));

      const response = await auth().delete(`/clothing/${saved.id}`);

      expect(response.status).toBe(204);

      const dbItem = await repo.findOneBy({ id: saved.id });
      expect(dbItem).toBeNull();
    });

    it('debería devolver 404 si la prenda no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await auth().delete(`/clothing/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });
});