/**
 * Script de teste de integração Frontend-Backend
 * Verifica comunicação, autenticação e features
 */

const TEST_API_URL = process.env.API_URL || 'https://uneducated-georgiann-personifiant.ngrok-free.dev';

// Gerar senha segura para testes (nunca reutilizar em produção)
function createSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: any;
}

const allTestResults: TestResult[] = [];

async function executeTest(
  name: string,
  fn: () => Promise<any>
): Promise<void> {
  try {
    console.log(`\n🧪 Testando: ${name}`);
    const response = await fn();
    allTestResults.push({ name, passed: true, response });
    console.log(`✅ ${name} - OK`);
  } catch (error: any) {
    allTestResults.push({ 
      name, 
      passed: false, 
      error: error.message 
    });
    console.log(`❌ ${name} - ERRO: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 INICIANDO TESTES DE INTEGRAÇÃO');
  console.log('='.repeat(60));

  // 1. Health Check
  await executeTest('Health Check', async () => {
    const res = await fetch(`${TEST_API_URL}/`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return res.text();
  });

  // 2. Register
  let token = '';
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: createSecurePassword(),
    name: 'Test User',
  };

  await executeTest('Register - Novo Usuário', async () => {
    const res = await fetch(`${TEST_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Status ${res.status}: ${error}`);
    }
    
    const data = await res.json();
    if (!data.accessToken) throw new Error('Sem token na resposta');
    token = data.accessToken;
    
    return data;
  });

  // 3. Login
  await executeTest('Login - Credenciais Válidas', async () => {
    const res = await fetch(`${TEST_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Status ${res.status}: ${error}`);
    }
    
    const data = await res.json();
    if (!data.accessToken) throw new Error('Sem token na resposta');
    
    return data;
  });

  // 4. Validate Token
  await executeTest('Validate Token', async () => {
    const res = await fetch(`${TEST_API_URL}/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Status ${res.status}: ${error}`);
    }
    
    return await res.json();
  });

  // 5. Get Stores (com autenticação)
  await executeTest('Get Stores - Com Autenticação', async () => {
    const res = await fetch(`${TEST_API_URL}/stores`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Status ${res.status}: ${error}`);
    }
    
    return await res.json();
  });

  // 6. Get Products (com autenticação)
  await executeTest('Get Products - Com Autenticação', async () => {
    const res = await fetch(`${TEST_API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Status ${res.status}: ${error}`);
    }
    
    return await res.json();
  });

  // 7. Get Orders (com autenticação)
  await executeTest('Get Orders - Com Autenticação', async () => {
    const res = await fetch(`${TEST_API_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Status ${res.status}: ${error}`);
    }
    
    return await res.json();
  });

  // 8. CORS Test
  await executeTest('CORS Headers - Origin Check', async () => {
    const res = await fetch(`${TEST_API_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
      },
      body: JSON.stringify({ token }),
    });
    
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (!allowOrigin) throw new Error('Sem header CORS');
    
    return { 'access-control-allow-origin': allowOrigin };
  });

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));

  const passed = allTestResults.filter(r => r.passed).length;
  const total = allTestResults.length;
  
  allTestResults.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name}`);
    if (r.error) console.log(`   Error: ${r.error}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📈 Total: ${passed}/${total} testes passaram`);
  console.log('='.repeat(60));

  process.exit(passed === total ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
