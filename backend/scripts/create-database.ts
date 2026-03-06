/**
 * Cria o banco de dados se não existir.
 * Execute: npx ts-node scripts/create-database.ts
 */
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbName = process.env.DB_NAME || 'jaspi_hub';

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Banco "${dbName}" criado com sucesso.`);
    } else {
      console.log(`Banco "${dbName}" já existe.`);
    }
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
