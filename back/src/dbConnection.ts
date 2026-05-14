// src/dbConnection.ts
import { DataSource } from 'typeorm';
import { Clothing } from './lib/models/Clothing';
import { Outfit } from './lib/models/Outfit';
import config from './Config';
import { User } from './lib/models/User';

// Es fundamental que tenga el "export" adelante
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.get('db.host'),
  port: config.get('db.port'), 
  username: config.get('db.user'),
  password: config.get('db.pass'),
  database: config.get('db.name'),
  synchronize: true,
  logging: true,
  entities: [Clothing, Outfit, User],
});

export const initializeDB = async () => {
  await AppDataSource.initialize();
};