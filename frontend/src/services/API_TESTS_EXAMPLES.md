# Exemplos de Testes - API Client com Retry

Exemplos de código para testar o retry e timeout do API client.

## Setup

```bash
# Instalar dependências de teste
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

## Arquivo de Configuração Jest

`jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
};
```

## Exemplos de Testes

### Teste 1: Timeout Básico

```typescript
import { apiFetch, TimeoutError } from '../api';

describe('API Client - Timeout', () => {
  it('deveria fazer timeout após tempo configurado', async () => {
    // Mock fetch para simular requisição que nunca responde
    global.fetch = jest.fn(() => new Promise(() => {}));

    await expect(
      apiFetch('/test', {
        needsAuth: false,
        retry: { timeoutMs: 100 },
      })
    ).rejects.toThrow(TimeoutError);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
```

### Teste 2: Retry em Erro 503

```typescript
describe('API Client - Retry', () => {
  it('deveria fazer retry em erro 503', async () => {
    let callCount = 0;

    global.fetch = jest.fn(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: 'Service Unavailable' }), {
            status: 503,
          })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );
    });

    const result = await apiFetch<{ success: boolean }>('/test', {
      needsAuth: false,
      retry: {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
      },
    });

    expect(result).toEqual({ success: true });
    expect(callCount).toBe(3);
  });
});
```

### Teste 3: Não Retry em 404

```typescript
it('deveria falhar imediatamente em erro 404 sem retry', async () => {
  let callCount = 0;

  global.fetch = jest.fn(() => {
    callCount++;
    return Promise.resolve(
      new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 })
    );
  });

  await expect(
    apiFetch<any>('/not-found', {
      needsAuth: false,
      retry: { maxRetries: 3, initialDelayMs: 10 },
    })
  ).rejects.toThrow('Not Found');

  // Deve ser apenas 1 chamada, sem retry
  expect(callCount).toBe(1);
});
```

### Teste 4: RetryError

```typescript
import { RetryError } from '../api';

it('deveria lançar RetryError após todas tentativas falharem', async () => {
  global.fetch = jest.fn(() => {
    return Promise.resolve(
      new Response(JSON.stringify({ message: 'Service Unavailable' }), {
        status: 503,
      })
    );
  });

  try {
    await apiFetch<any>('/test', {
      needsAuth: false,
      retry: {
        maxRetries: 2,
        initialDelayMs: 10,
      },
    });
    fail('Deveria ter lançado RetryError');
  } catch (error) {
    expect(error).toBeInstanceOf(RetryError);
    expect((error as RetryError).attempts).toBe(3); // tentativa + 2 retries
    expect((error as RetryError).lastError).toBeDefined();
  }
});
```

### Teste 5: Sucesso Imediato

```typescript
it('deveria retornar com sucesso imediato', async () => {
  global.fetch = jest.fn(() => {
    return Promise.resolve(
      new Response(
        JSON.stringify({ id: 1, name: 'Test User' }),
        { status: 200 }
      )
    );
  });

  const result = await apiFetch<{ id: number; name: string }>('/users/1', {
    needsAuth: false,
  });

  expect(result).toEqual({ id: 1, name: 'Test User' });
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
```

## Testes de Integração Real

### Teste com Servidor Local

```typescript
// Testar com um servidor de mock real
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const apiBaseUrl = process.env.API_URL;
if (!apiBaseUrl) {
  throw new Error('API_URL is required');
}

const server = setupServer(
  rest.get(`${apiBaseUrl}/test`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('deveria fazer requisição com retry', async () => {
  const result = await apiFetch<{ success: boolean }>('/test', {
    needsAuth: false,
    retry: { maxRetries: 3 },
  });

  expect(result).toEqual({ success: true });
});
```

## Executar Testes

```bash
# Rodar todos os testes
npm test

# Rodar com coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Teste específico
npm test -- api.test.ts
```

## Boas Práticas para Testes

✅ Sempre teste sucesso imediato  
✅ Teste retry com vários status codes (503, 429, 502)  
✅ Teste que NÃO faz retry em 4XX  
✅ Teste timeout com delays  
✅ Teste exponential backoff  
✅ Teste com FormData  
✅ Teste com auth header  

## Exemplo Completo PT 1

```typescript
// src/services/__tests__/api.test.ts

import { apiFetch, TimeoutError, RetryError } from '../api';
import { authService } from '../authService';

// Mock do authService
jest.mock('../authService', () => ({
  authService: {
    getAuthHeader: jest.fn(() => ({ Authorization: 'Bearer token' })),
    removeToken: jest.fn(),
  },
}));

describe('apiFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('Timeout', () => {
    it('deve fazer timeout', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      await expect(
        apiFetch('/test', {
          needsAuth: false,
          retry: { timeoutMs: 50 },
        })
      ).rejects.toThrow(TimeoutError);
    });
  });

  describe('Retry', () => {
    it('deve fazer retry em 503', async () => {
      let calls = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        calls++;
        if (calls < 2) {
          return Promise.resolve(
            new Response(null, { status: 503 })
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true }), { status: 200 })
        );
      });

      const result = await apiFetch<any>('/test', {
        needsAuth: false,
        retry: { maxRetries: 2, initialDelayMs: 10 },
      });

      expect(result).toEqual({ ok: true });
      expect(calls).toBe(2);
    });
  });
});
```

## Exemplo Completo PT 2

```typescript
// Teste com simulação de rede lenta

it('deve respeitar timeout maior para upload', async () => {
  let resolved = false;

  (global.fetch as jest.Mock).mockImplementation(() =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolved = true;
        resolve(
          new Response(JSON.stringify({ uploaded: true }), { status: 200 })
        );
      }, 500); // responde após 500ms
    })
  );

  const result = await apiFetch<any>('/upload', {
    method: 'POST',
    needsAuth: false,
    retry: { timeoutMs: 1000 }, // timeout maior que o delay
  });

  expect(result).toEqual({ uploaded: true });
  expect(resolved).toBe(true);
});

// Teste de backoff exponencial

it('deve implementar backoff exponencial', async () => {
  let calls = 0;
  const callTimes: number[] = [];

  (global.fetch as jest.Mock).mockImplementation(() => {
    calls++;
    callTimes.push(Date.now());
    
    if (calls < 3) {
      return Promise.resolve(
        new Response(null, { status: 503 })
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
  });

  const start = Date.now();
  await apiFetch<any>('/test', {
    needsAuth: false,
    retry: {
      maxRetries: 2,
      initialDelayMs: 50,
      backoffMultiplier: 2,
    },
  });

  const elapsed = Date.now() - start;
  const delay1 = callTimes[1] - callTimes[0];
  const delay2 = callTimes[2] - callTimes[1];

  // delay2 deve ser maior que delay1 (exponential)
  expect(delay2).toBeGreaterThan(delay1);
  // Total deve ser >= backoff delays
  expect(elapsed).toBeGreaterThan(50);
});
```

---

**Para copiar estes exemplos para seu projeto:**

1. Instale Jest: `npm install --save-dev jest @types/jest ts-jest`
2. Crie arquivo `jest.config.js` com a configuração acima
3. Copie os exemplos para `src/services/__tests__/api.test.ts`
4. Execute: `npm test`
