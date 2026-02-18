import { AppDataSource } from './src/data-source';

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');
    
    await AppDataSource.runMigrations();
    console.log('Migrations executed successfully');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
