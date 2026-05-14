// src/dbConnection.ts
import { DataSource } from 'typeorm';
import { Clothing } from './lib/models/Clothing';
import config from './Config';

// Es fundamental que tenga el "export" adelante
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.get('db.host'),
  port: 5433, 
  username: config.get('db.user'),
  password: config.get('db.pass'),
  database: config.get('db.name'),
  synchronize: true,
  logging: true,
  entities: [Clothing],
});

export const initializeDB = async () => {
  await AppDataSource.initialize();
};