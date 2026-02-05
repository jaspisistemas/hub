import { config } from 'dotenv';
import { createConnection } from 'typeorm';
import { User } from './src/domains/auth/entities/user.entity';
import { Product } from './src/domains/products/entities/product.entity';
import { Store } from './src/domains/stores/entities/store.entity';
import { Order } from './src/domains/orders/entities/order.entity';

// Carrega as variáveis de ambiente
config();

async function migrate() {
  console.log('🔄 Iniciando migração do SQLite para PostgreSQL...\n');

  // Conexão com SQLite (origem)
  const sqliteConnection = await createConnection({
    name: 'sqlite',
    type: 'sqlite',
    database: 'jaspi_hub.db',
    entities: [User, Product, Store, Order],
  });

  // Conexão com PostgreSQL (destino)
  const postgresConnection = await createConnection({
    name: 'postgres',
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'jaspi_hub',
    entities: [User, Product, Store, Order],
    synchronize: false,
  });

  try {
    // Migrar Usuários
    console.log('📦 Migrando usuários...');
    const sqliteUsers = await sqliteConnection.getRepository(User).find();
    if (sqliteUsers.length > 0) {
      await postgresConnection.getRepository(User).save(sqliteUsers);
      console.log(`✅ ${sqliteUsers.length} usuários migrados`);
    } else {
      console.log('ℹ️  Nenhum usuário para migrar');
    }

    // Migrar Lojas
    console.log('\n📦 Migrando lojas...');
    const sqliteStores = await sqliteConnection.getRepository(Store).find();
    if (sqliteStores.length > 0) {
      await postgresConnection.getRepository(Store).save(sqliteStores);
      console.log(`✅ ${sqliteStores.length} lojas migradas`);
    } else {
      console.log('ℹ️  Nenhuma loja para migrar');
    }

    // Migrar Produtos
    console.log('\n📦 Migrando produtos...');
    const sqliteProducts = await sqliteConnection.getRepository(Product).find();
    if (sqliteProducts.length > 0) {
      await postgresConnection.getRepository(Product).save(sqliteProducts);
      console.log(`✅ ${sqliteProducts.length} produtos migrados`);
    } else {
      console.log('ℹ️  Nenhum produto para migrar');
    }

    // Migrar Pedidos
    console.log('\n📦 Migrando pedidos...');
    const sqliteOrders = await sqliteConnection.getRepository(Order).find();
    if (sqliteOrders.length > 0) {
      await postgresConnection.getRepository(Order).save(sqliteOrders);
      console.log(`✅ ${sqliteOrders.length} pedidos migrados`);
    } else {
      console.log('ℹ️  Nenhum pedido para migrar');
    }

    console.log('\n🎉 Migração concluída com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
  } finally {
    await sqliteConnection.close();
    await postgresConnection.close();
  }
}

migrate();
