import { AppDataSource } from './src/data-source';

async function addIsActiveColumn() {
  try {
    const connection = await AppDataSource.initialize();
    
    // Check if column exists
    const queryRunner = connection.createQueryRunner();
    try {
      // Try to add the column
      await queryRunner.query(`
        ALTER TABLE company_members 
        ADD COLUMN isActive boolean DEFAULT true
      `);
      console.log('✅ Column isActive added successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Column isActive already exists');
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
    
    await connection.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

addIsActiveColumn();
