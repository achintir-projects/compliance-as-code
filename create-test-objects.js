import { AirtableService } from './src/lib/airtable/AirtableService';

async function main() {
  try {
    console.log('Creating test knowledge objects with new fields...');
    
    const airtableService = new AirtableService();
    
    // Create a test knowledge object with all fields
    const testObject = await airtableService.createKnowledgeObject({
      confidence: 'High',
      topic: 'Test AML Regulation',
      category: 'RegTech',
      content: 'Test AML regulation with country and regulation type fields',
      country: 'US',
      regulationType: 'AML',
      effectiveDate: '2024-01-01'
    });
    
    console.log('Created test object:', testObject);
    
    // Create another test object
    const testObject2 = await airtableService.createKnowledgeObject({
      confidence: 'Medium',
      topic: 'Test GDPR Regulation',
      category: 'RegTech',
      content: 'Test GDPR regulation with country and regulation type fields',
      country: 'EU',
      regulationType: 'Privacy',
      effectiveDate: '2024-05-01'
    });
    
    console.log('Created test object 2:', testObject2);
    
    // Get statistics
    const stats = await airtableService.getKnowledgeStatistics();
    console.log('\n=== Updated Statistics ===');
    console.log('Total objects:', stats.total);
    console.log('Countries:', Object.keys(stats.byCountry));
    console.log('Regulation types:', Object.keys(stats.byRegulationType));
    
    console.log('\n✅ Test objects created successfully!');
    
  } catch (error) {
    console.error('Error creating test objects:', error);
  }
}

main();