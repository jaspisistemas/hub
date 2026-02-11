/**
 * Script para limpar tabela orders e permitir recreação com schema correto
 */

const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'jaspi_hub',
});

async function fixCustomerStateColumn() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco');

    // Alterar coluna customerState de VARCHAR(2) para VARCHAR(10)
    await AppDataSource.query(`
      ALTER TABLE orders 
      ALTER COLUMN "customerState" TYPE VARCHAR(10)
    `);

    console.log('✅ Coluna customerState alterada para VARCHAR(10)');
    console.log('\n✨ Agora sincronize os pedidos novamente no frontend!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fixCustomerStateColumn();
