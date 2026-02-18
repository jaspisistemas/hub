const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createTestUser() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'jaspi_hub',
    user: 'postgres',
    password: 'jaspihub',
  });

  try {
    await client.connect();
    
    // Hash da senha
    const passwordHash = await bcrypt.hash('123456', 10);
    
    // Deletar se existir
    await client.query(`DELETE FROM users WHERE email = 'admin@test.com'`);
    
    // Criar novo
    await client.query(`
      INSERT INTO users (id, email, password, name, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
    `, ['admin@test.com', passwordHash, 'Admin Test']);
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('Email: admin@test.com');
    console.log('Senha: 123456');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

createTestUser();
