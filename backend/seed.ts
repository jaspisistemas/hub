// Script para popular o banco com dados de teste
// Execute com: npx ts-node seed.ts

import { DataSource } from 'typeorm';
import { User } from './src/domains/auth/entities/user.entity';
import { Product } from './src/domains/products/entities/product.entity';
import { Store } from './src/domains/stores/entities/store.entity';
import { Order } from './src/domains/orders/entities/order.entity';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'jaspi_hub.db',
  entities: [User, Product, Store, Order],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const productRepository = AppDataSource.getRepository(Product);
  const storeRepository = AppDataSource.getRepository(Store);
  const orderRepository = AppDataSource.getRepository(Order);

  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário
  const hashedPassword = await bcrypt.hash('senha123', 10);
  const user = userRepository.create({
    email: 'admin@jaspi.com',
    password: hashedPassword,
    name: 'Administrador JASPI',
  });
  await userRepository.save(user);
  console.log('✅ Usuário criado');

  // Criar produtos
  const products = [
    { sku: 'SKU001', name: 'Smartphone Pro Max', price: 1299.99, quantity: 45, category: 'Eletrônicos' },
    { sku: 'SKU002', name: 'Fone Bluetooth', price: 299.99, quantity: 120, category: 'Acessórios' },
    { sku: 'SKU003', name: 'Carregador Rápido', price: 89.99, quantity: 85, category: 'Acessórios' },
    { sku: 'SKU004', name: 'Cabo USB-C', price: 29.99, quantity: 200, category: 'Acessórios' },
    { sku: 'SKU005', name: 'Tablet 10"', price: 899.99, quantity: 30, category: 'Eletrônicos' },
  ];

  for (const productData of products) {
    const product = productRepository.create(productData);
    await productRepository.save(product);
  }
  console.log('✅ 5 Produtos criados');

  // Criar lojas
  const stores = [
    { name: 'Loja MercadoLivre', marketplace: 'MercadoLivre', status: 'active', productsCount: 250, ordersCount: 1245, revenue: 15780.50 },
    { name: 'Loja Shopee', marketplace: 'Shopee', status: 'active', productsCount: 180, ordersCount: 892, revenue: 11245.75 },
  ];

  for (const storeData of stores) {
    const store = storeRepository.create(storeData);
    await storeRepository.save(store);
  }
  console.log('✅ 2 Lojas criadas');

  // Criar pedidos com dados de cliente embutidos
  const orders = [
    { 
      externalId: 'ML001', 
      marketplace: 'MercadoLivre', 
      status: 'delivered', 
      total: 1299.99,
      orderCreatedAt: new Date('2026-02-10T14:30:00'),
      customerName: 'João Silva',
      customerEmail: 'joao@example.com',
      customerPhone: '(11) 98765-4321',
      customerCity: 'São Paulo',
      customerState: 'SP',
      rawData: '{}' 
    },
    { 
      externalId: 'ML002', 
      marketplace: 'MercadoLivre', 
      status: 'shipped', 
      total: 2450.00,
      orderCreatedAt: new Date('2026-02-11T09:15:00'),
      customerName: 'Maria Santos',
      customerEmail: 'maria@example.com',
      customerPhone: '(21) 99876-5432',
      customerCity: 'Rio de Janeiro',
      customerState: 'RJ',
      rawData: '{}' 
    },
    { 
      externalId: 'SP001', 
      marketplace: 'Shopee', 
      status: 'processing', 
      total: 599.99,
      orderCreatedAt: new Date('2026-02-11T16:45:00'),
      customerName: 'Carlos Mendes',
      customerEmail: 'carlos@example.com',
      customerPhone: '(31) 98765-1234',
      customerCity: 'Belo Horizonte',
      customerState: 'MG',
      rawData: '{}' 
    },
    { 
      externalId: 'SP002', 
      marketplace: 'Shopee', 
      status: 'pending', 
      total: 889.99,
      orderCreatedAt: new Date('2026-02-12T08:20:00'),
      customerName: 'Ana Costa',
      customerEmail: 'ana@example.com',
      customerPhone: '(85) 98765-5678',
      customerCity: 'Fortaleza',
      customerState: 'CE',
      rawData: '{}' 
    },
  ];

  for (const orderData of orders) {
    const order = orderRepository.create(orderData);
    await orderRepository.save(order);
  }
  console.log('✅ 4 Pedidos criados');

  console.log('\n✨ Seed completado com sucesso!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erro ao fazer seed:', err);
  process.exit(1);
});
