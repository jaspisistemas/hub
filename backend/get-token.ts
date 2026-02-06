import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'jaspi_hub',
});

async function getToken() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado ao PostgreSQL');

    const result = await AppDataSource.query(
      'SELECT id, name, "mlAccessToken" FROM stores WHERE "mlAccessToken" IS NOT NULL LIMIT 1'
    );

    if (result.length > 0) {
      console.log('\n🔑 Token encontrado:');
      console.log('Store ID:', result[0].id);
      console.log('Store Name:', result[0].name);
      console.log('\n📋 ACCESS TOKEN:');
      console.log(result[0].mlAccessToken);
      console.log('\n✅ Use este token no Postman como: Bearer ' + result[0].mlAccessToken);
    } else {
      console.log('❌ Nenhuma loja com token encontrada');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

getToken();
