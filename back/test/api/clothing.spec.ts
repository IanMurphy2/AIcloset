import request from 'supertest';
import { createExpressApp } from '../../src/api/ExpressApp';
import { AppDataSource } from '../../src/dbConnection';
import { ClothingFactory } from '../factories/clothing.factory';

describe('Clothing API', () => {
  let app: any;

  // Antes de todos los tests, conectamos a la DB de test
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    app = createExpressApp();
  });

  afterEach(async () => {
    await AppDataSource.getRepository('clothing').clear();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('GET /clothing', () => {
    it('debería devolver una lista vacía si no hay ropa', async () => {
      const response = await request(app).get('/clothing');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('debería devolver las prendas cargadas', async () => {
      // Creamos una prenda usando la fábrica y la guardamos en la DB
      const fakeClothing = ClothingFactory.build();
      await AppDataSource.getRepository('clothing').save(fakeClothing);

      const response = await request(app).get('/clothing');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].description).toBe(fakeClothing.description);
    });
  });

  describe('GET /clothing/:id', () => {
    it('debería devolver una prenda por su ID', async () => {
      const fakeClothing = ClothingFactory.build();
      const saved = await AppDataSource.getRepository('clothing').save(fakeClothing);

      const response = await request(app).get(`/clothing/${saved.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(saved.id);
      expect(response.body.description).toBe(saved.description);
    });

    it('debería devolver 500 si el ID no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/clothing/${fakeId}`);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /clothing', () => {
    it('debería crear una nueva prenda exitosamente', async () => {
      const newClothing = {
        imageUrl: "https://mi-foto.com/remera.jpg",
        description: "Remera de Rock",
        category: "remeras"
      };

      const response = await request(app)
        .post('/clothing')
        .send(newClothing);

      expect(response.status).toBe(201);
      expect(response.body.description).toBe(newClothing.description);

      const dbItem = await AppDataSource.getRepository('clothing').findOneBy({ description: "Remera de Rock" });
      expect(dbItem).toBeDefined();
    });
  });

  describe('PUT /clothing/:id', () => {
    it('debería actualizar una prenda existente', async () => {
      const fakeClothing = ClothingFactory.build();
      const saved = await AppDataSource.getRepository('clothing').save(fakeClothing);

      const updates = { description: "Descripción actualizada", color: "rojo" };

      const response = await request(app)
        .put(`/clothing/${saved.id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.color).toBe(updates.color);
      expect(response.body.id).toBe(saved.id);
    });

    it('debería devolver 500 si la prenda no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/clothing/${fakeId}`)
        .send({ description: "No existe" });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /clothing/:id', () => {
    it('debería eliminar una prenda existente', async () => {
      const fakeClothing = ClothingFactory.build();
      const saved = await AppDataSource.getRepository('clothing').save(fakeClothing);

      const response = await request(app).delete(`/clothing/${saved.id}`);

      expect(response.status).toBe(204);

      const dbItem = await AppDataSource.getRepository('clothing').findOneBy({ id: saved.id });
      expect(dbItem).toBeNull();
    });

    it('debería devolver 500 si la prenda no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).delete(`/clothing/${fakeId}`);

      expect(response.status).toBe(500);
    });
  });
});