import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'jaspihub',
  database: 'jaspi_hub',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function createJaspiUser() {
  await AppDataSource.initialize();
  console.log('✅ Conectado ao banco PostgreSQL');
  
  const hashedPassword = await bcrypt.hash('senha123', 10);
  
  // Verificar se jaspi existe
  const existingJaspi = await AppDataSource.query(
    "SELECT * FROM users WHERE email = 'jaspi@gmail.com'"
  );
  
  if (existingJaspi.length > 0) {
    console.log('⚠️  Usuário jaspi@gmail.com já existe!');
    console.log('   ID:', existingJaspi[0].id);
    console.log('   Nome:', existingJaspi[0].name);
  } else {
    await AppDataSource.query(
      `INSERT INTO users (email, password, name) VALUES ($1, $2, $3)`,
      ['jaspi@gmail.com', hashedPassword, 'Jaspi Hub']
    );
    console.log('✅ Usuário jaspi@gmail.com criado!');
    console.log('   Email: jaspi@gmail.com');
    console.log('   Senha: senha123');
  }
  
  // Listar todos os usuários
  const allUsers = await AppDataSource.query('SELECT id, email, name FROM users');
  console.log('\n📋 Todos os usuários no banco:');
  allUsers.forEach((u: any) => {
    console.log(`   ${u.email} (${u.name}) - ID: ${u.id}`);
  });
  
  await AppDataSource.destroy();
}

createJaspiUser().catch(console.error);
