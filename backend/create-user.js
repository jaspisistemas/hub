/**
 * Script para criar usuário admin com senha hash válida
 */

const bcrypt = require('bcrypt');
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'jaspi_hub',
});

async function createUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco');

    const email = 'jaspi@gmail.com';
    const password = 'jaspi';
    const name = 'Jaspi Admin';

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 Senha hash gerada');

    // Verificar se usuário existe
    const existing = await AppDataSource.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.length > 0) {
      // Atualizar senha
      await AppDataSource.query(
        'UPDATE users SET password = $1, name = $2 WHERE email = $3',
        [hashedPassword, name, email]
      );
      console.log('✅ Usuário atualizado!');
    } else {
      // Criar novo usuário
      await AppDataSource.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3)',
        [email, hashedPassword, name]
      );
      console.log('✅ Usuário criado!');
    }

    console.log('\n📋 Credenciais:');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('\nUse essas credenciais no Postman!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createUser();
