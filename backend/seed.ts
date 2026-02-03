// Script para popular o banco com dados de teste
// Execute com: npx ts-node seed.ts

import { DataSource } from 'typeorm';
import { User } from './src/domains/auth/entities/user.entity';
import { Product } from './src/domains/products/entities/product.entity';
import { Customer } from './src/domains/customers/entities/customer.entity';
import { Store } from './src/domains/stores/entities/store.entity';
import { Order } from './src/domains/orders/entities/order.entity';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'jaspi_hub.db',
  entities: [User, Product, Customer, Store, Order],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const productRepository = AppDataSource.getRepository(Product);
  const customerRepository = AppDataSource.getRepository(Customer);
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

  // Criar clientes
  const customers = [
    { name: 'João Silva', email: 'joao@example.com', phone: '(11) 98765-4321', city: 'São Paulo', state: 'SP' },
    { name: 'Maria Santos', email: 'maria@example.com', phone: '(21) 99876-5432', city: 'Rio de Janeiro', state: 'RJ' },
    { name: 'Carlos Mendes', email: 'carlos@example.com', phone: '(31) 98765-1234', city: 'Belo Horizonte', state: 'MG' },
    { name: 'Ana Costa', email: 'ana@example.com', phone: '(85) 98765-5678', city: 'Fortaleza', state: 'CE' },
  ];

  for (const customerData of customers) {
    const customer = customerRepository.create(customerData);
    await customerRepository.save(customer);
  }
  console.log('✅ 4 Clientes criados');

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

  // Criar pedidos
  const orders = [
    { externalId: 'ML001', marketplace: 'MercadoLivre', status: 'delivered', total: 1299.99, rawData: '{}' },
    { externalId: 'ML002', marketplace: 'MercadoLivre', status: 'shipped', total: 2450.00, rawData: '{}' },
    { externalId: 'SP001', marketplace: 'Shopee', status: 'processing', total: 599.99, rawData: '{}' },
    { externalId: 'SP002', marketplace: 'Shopee', status: 'pending', total: 889.99, rawData: '{}' },
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
