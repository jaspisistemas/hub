/**
 * Configuração centralizada de URLs e ambientes
 * Lê automaticamente do .env
 */

export const environmentConfig = {
  // URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  
  // CORS - todas as origens permitidas
  corsOrigins: [
    // Desenvolvimento local
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://localhost:5174',
    'https://localhost:5174',
    
    // Cloudflare Tunnels
    'https://portsmouth-tin-import-favour.trycloudflare.com',
    'https://panel-joshua-norfolk-molecular.trycloudflare.com',
    
    // Ambientes gerenciados
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL,
  ].filter((url): url is string => !!url && typeof url === 'string'),

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
    appId: process.env.ML_APP_ID,
    clientSecret: process.env.ML_CLIENT_SECRET,
    redirectUri: process.env.ML_REDIRECT_URI || 'http://localhost:3000/marketplace/mercadolivre/callback',
  },

  shopee: {
    partnerId: process.env.SHOPEE_PARTNER_ID,
    partnerKey: process.env.SHOPEE_PARTNER_KEY,
    redirectUri: process.env.SHOPEE_REDIRECT_URI || 'http://localhost:3000/marketplace/shopee/callback',
  },
};
