import { AirtableService } from './src/lib/airtable/AirtableService';

// Test data with 10 entries
const testData = [
  {
    confidence: 'High',
    topic: 'AML Compliance',
    category: 'RegTech',
    content: 'Bank Secrecy Act (BSA): Financial institutions must establish and maintain AML programs, file CTRs for transactions over $10,000, and report suspicious activities.',
    country: 'US',
    regulationType: 'AML',
    effectiveDate: '2024-01-01'
  },
  {
    confidence: 'High',
    topic: 'KYC Requirements',
    category: 'Commercial Banking',
    content: 'Customer Identification Program (CIP): Financial institutions must verify the identity of customers using reasonable and reliable methods.',
    country: 'US',
    regulationType: 'KYC',
    effectiveDate: '2024-01-01'
  },
  {
    confidence: 'High',
    topic: 'Data Privacy',
    category: 'RegTech',
    content: 'Gramm-Leach-Bliley Act (GLBA): Financial institutions must protect consumers\' private financial information and provide privacy notices.',
    country: 'US',
    regulationType: 'Privacy',
    effectiveDate: '2024-01-01'
  },
  {
    confidence: 'Medium',
    topic: 'Consumer Protection',
    category: 'Commercial Banking',
    content: 'Truth in Lending Act (TILA): Lenders must disclose credit terms in a standardized manner to enable comparison shopping.',
    country: 'US',
    regulationType: 'Consumer Protection',
    effectiveDate: '2024-01-01'
  },
  {
    confidence: 'High',
    topic: 'Securities Regulation',
    category: 'Wealth Management',
    content: 'SEC Regulation Best Interest: Broker-dealers must act in the best interest of retail customers when making recommendations.',
    country: 'US',
    regulationType: 'Securities',
    effectiveDate: '2024-01-01'
  },
  {
    confidence: 'Medium',
    topic: 'Payment Processing',
    category: 'Payments',
    content: 'Electronic Fund Transfer Act (EFTA): Financial institutions must provide disclosure of electronic transfer terms and consumer rights.',
    country: 'US',
    regulationType: 'Payments',
    effectiveDate: '2024-01-01'
  },
  {
    confidence: 'High',
    topic: 'Insurance Regulation',
    category: 'Insurance',
    content: 'State Insurance Regulations: Insurers must maintain adequate reserves, file rates for approval, and comply with market conduct standards.',
    country: 'US',
    regulationType: 'Insurance',
    effectiveDate: '2024-01-01'
  },
  {
    confidence: 'Medium',
    topic: 'Credit Reporting',
    category: 'Commercial Banking',
    content: 'Fair Credit Reporting Act (FCRA): Consumer reporting agencies must maintain accurate information and provide dispute resolution.',
    country: 'US',
    regulationType: 'Consumer Protection',
    effectiveDate: '2024-01-01'
  },
  {
    confidence: 'High',
    topic: 'Fraud Prevention',
    category: 'RegTech',
    content: 'Federal Trade Commission Act: Prohibition of unfair or deceptive acts or practices in financial services.',
    country: 'US',
    regulationType: 'Fraud Prevention',
    effectiveDate: '2024-01-01'
  },
  {
    confidence: 'Medium',
    topic: 'Investment Advisory',
    category: 'Wealth Management',
    content: 'Investment Advisers Act of 1940: Investment advisers must register with SEC and adhere to fiduciary standards.',
    country: 'US',
    regulationType: 'Investment',
    effectiveDate: '2024-01-01'
  }
];

async function main() {
  try {
    console.log('Starting test regulatory data import...');
    console.log(`Importing ${testData.length} regulatory entries...`);
    
    const airtableService = new AirtableService();
    
    const result = await airtableService.bulkCreateKnowledgeObjects(testData);
    
    console.log('\n=== Import Summary ===');
    console.log(`Total entries processed: ${testData.length}`);
    console.log(`Successfully created: ${result.success}`);
    console.log(`Errors: ${result.errors}`);
    console.log(`Success rate: ${((result.success / testData.length) * 100).toFixed(2)}%`);
    
    // Get statistics after import
    console.log('\n=== Knowledge Base Statistics ===');
    const stats = await airtableService.getKnowledgeStatistics();
    console.log(`Total knowledge objects: ${stats.total}`);
    console.log(`Countries covered: ${Object.keys(stats.byCountry).length}`);
    console.log(`Regulation types: ${Object.keys(stats.byRegulationType).length}`);
    console.log(`Categories: ${Object.keys(stats.byCategory).length}`);
    
    console.log('\n✅ Test regulatory data import completed successfully!');
    
  } catch (error) {
    console.error('Error during test regulatory data import:', error);
  }
}

main();