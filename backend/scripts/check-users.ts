import { DataSource } from 'typeorm';
import { User } from './src/domains/auth/entities/user.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'jaspihub',
  database: 'jaspi_hub',
  entities: [User],
  synchronize: false,
});

async function checkUsers() {
  await AppDataSource.initialize();
  
  const userRepository = AppDataSource.getRepository(User);
  
  const jaspi = await userRepository.findOne({ where: { email: 'jaspi@gmail.com' } });
  const natan = await userRepository.findOne({ where: { email: 'natan@gmail.com' } });
  
  console.log('\n=== USUÁRIOS NO BANCO ===');
  console.log('\njaspi@gmail.com:');
  console.log(jaspi ? `  ID: ${jaspi.id}` : '  ❌ NÃO EXISTE');
  console.log(jaspi ? `  Nome: ${jaspi.name}` : '');
  
  console.log('\nnatan@gmail.com:');
  console.log(natan ? `  ID: ${natan.id}` : '  ❌ NÃO EXISTE');
  console.log(natan ? `  Nome: ${natan.name}` : '');
  
  await AppDataSource.destroy();
}

checkUsers().catch(console.error);
