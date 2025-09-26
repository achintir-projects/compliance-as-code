import { db } from './src/lib/db';

async function main() {
  try {
    console.log('Starting migration to add missing fields to existing knowledge objects...');
    
    // Get all existing knowledge objects
    const existingObjects = await db.knowledgeObject.findMany();
    
    console.log(`Found ${existingObjects.length} existing knowledge objects to migrate...`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const obj of existingObjects) {
      try {
        // Update with default values for new fields
        await db.knowledgeObject.update({
          where: { id: obj.id },
          data: {
            country: obj.country || 'Global',
            regulationType: obj.regulationType || 'General',
            effectiveDate: obj.effectiveDate || '2024-01-01',
          },
        });
        updatedCount++;
      } catch (error) {
        console.error(`Error updating object ${obj.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total objects processed: ${existingObjects.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Success rate: ${((updatedCount / existingObjects.length) * 100).toFixed(2)}%`);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await db.$disconnect();
  }
}

main();