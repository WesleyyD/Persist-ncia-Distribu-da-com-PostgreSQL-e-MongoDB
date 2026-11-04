import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export const postgresPool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
});

export const mongoClient = new MongoClient(process.env.MONGO_URI!);

export async function connectDatabases() {
  await postgresPool.query('SELECT 1');

  await mongoClient.connect();

  const mongoDatabase = mongoClient.db(process.env.MONGO_DATABASE);

  await mongoDatabase.command({ ping: 1 });

  console.log('PostgreSQL conectado!');
  console.log('MongoDB conectado!');

  return mongoDatabase;
}

export async function createPostgresStructure() {
  await postgresPool.query(`
        CREATE TABLE IF NOT EXISTS dados (
            id UUID PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            valor NUMERIC(10, 2) NOT NULL
        );
    `);

  console.log('Estrutura do PostgreSQL criada!');
}
