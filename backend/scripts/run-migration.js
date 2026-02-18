const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'jaspi_hub',
    user: 'postgres',
    password: 'jaspihub',
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco');

    // Criar tabela companies
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        description text,
        cnpj varchar(20),
        "logoUrl" varchar(500),
        phone varchar(20),
        email varchar(255),
        address text,
        city varchar(100),
        state varchar(2),
        "zipCode" varchar(10),
        status varchar(20) DEFAULT 'active',
        settings jsonb DEFAULT '{}',
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela companies criada');

    // Criar tabela company_members
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        "userId" uuid REFERENCES users(id) ON DELETE SET NULL,
        email varchar(255) NOT NULL,
        role varchar(20) NOT NULL DEFAULT 'member',
        permissions jsonb DEFAULT '{}',
        "inviteToken" varchar(255),
        "inviteSentAt" timestamp,
        "acceptedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela company_members criada');

    // Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members("companyId");
      CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members("userId");
      CREATE INDEX IF NOT EXISTS idx_company_members_invite ON company_members("inviteToken");
    `);
    console.log('✅ Índices criados');

    console.log('\n🎉 Migration concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
