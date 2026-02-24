import { config as loadEnv } from 'dotenv';

loadEnv();

/**
 * Configuracao centralizada de URLs e ambientes
 * Le automaticamente do .env
 */

export const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[ENV] ${name} is required`);
  }
  return value;
};

const optionalEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
};

const parseCorsOrigins = (raw: string): Array<string | RegExp> =>
  raw
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
    .map(origin => {
      if (origin.startsWith('/') && origin.endsWith('/')) {
        return new RegExp(origin.slice(1, -1));
      }
      return origin;
    });

export const environmentConfig = {
  // URLs
  frontendUrl: requiredEnv('FRONTEND_URL'),
  backendUrl: requiredEnv('BACKEND_URL'),
  
  // CORS - todas as origens permitidas
  corsOrigins: (() => {
    const origins = parseCorsOrigins(requiredEnv('CORS_ORIGINS'));
    console.log('[CORS] Origens permitidas:', origins);
    return origins;
  })(),

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-12345',
  jwtExpiresIn: '24h',

  // Banco de dados
  database: {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'jaspi_hub',
  },

  // APIs de terceiros
  mercadoLivre: {
    appId: requiredEnv('ML_APP_ID'),
    clientSecret: requiredEnv('ML_CLIENT_SECRET'),
    redirectUri: requiredEnv('ML_REDIRECT_URI'),
  },

  shopee: {
    partnerId: optionalEnv('SHOPEE_PARTNER_ID'),
    partnerKey: optionalEnv('SHOPEE_PARTNER_KEY'),
    redirectUri: optionalEnv('SHOPEE_REDIRECT_URI'),
  },

  email: {
    host: optionalEnv('SMTP_HOST'),
    port: optionalEnv('SMTP_PORT') ? parseInt(optionalEnv('SMTP_PORT') as string, 10) : undefined,
    user: optionalEnv('SMTP_USER'),
    pass: optionalEnv('SMTP_PASS'),
    from: optionalEnv('SMTP_FROM'),
  },
};
