import { db } from '@/lib/db';

export interface AirtableEntry {
  id: string;
  confidence: 'High' | 'Medium';
  topic: string;
  fintechCategory: string;
  content: string;
  country: string;
  regulationType: string;
  effectiveDate: string;
  lastUpdated?: string;
}

export interface KnowledgeObject {
  id: string;
  confidence: 'High' | 'Medium';
  topic: string;
  category: string;
  content: string;
  country: string;
  regulationType: string;
  effectiveDate: string;
  status: 'validated' | 'pending_review' | 'deployed';
  lastUpdated: string;
  airtableId: string;
}

export class AirtableService {
  private apiKey: string;
  private baseId: string;
  private tableName: string;

  constructor() {
    this.apiKey = process.env.AIRTABLE_API_KEY || '';
    this.baseId = process.env.AIRTABLE_BASE_ID || 'appCkdSgsRNnPkCGT';
    this.tableName = process.env.AIRTABLE_TABLE_NAME || 'shrm4bjocB8xtgM8k';
    
    if (!this.apiKey) {
      console.warn('AIRTABLE_API_KEY not found in environment variables. Using mock data for development.');
    }
  }

  async fetchEntries(): Promise<AirtableEntry[]> {
    try {
      // If no API key is available, use mock data
      if (!this.apiKey) {
        console.log('Using mock Airtable data for development');
        return this.getMockData();
      }
      
      const allRecords: any[] = [];
      let offset = null;
      
      do {
        const url = new URL(`https://api.airtable.com/v0/${this.baseId}/${this.tableName}`);
        if (offset) {
          url.searchParams.append('offset', offset);
        }
        
        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`Airtable API error: ${response.statusText}. Falling back to mock data.`);
          return this.getMockData();
        }

        const data = await response.json();
        allRecords.push(...data.records);
        offset = data.offset;
        
        // Add a small delay to avoid rate limiting
        if (offset) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } while (offset);

      console.log(`Fetched ${allRecords.length} records from Airtable`);
      return this.transformAirtableData(allRecords);
    } catch (error) {
      console.error('Error fetching Airtable data:', error);
      // Fallback to mock data for development
      return this.getMockData();
    }
  }

  private transformAirtableData(records: any[]): AirtableEntry[] {
    return records.map(record => ({
      id: record.id,
      confidence: record.fields['Confidence Score'] || 'Medium',
      topic: record.fields['Topic'] || '',
      fintechCategory: record.fields['FinTech Category'] || '',
      content: record.fields['Content/Description'] || '',
      country: record.fields['Country'] || 'Global',
      regulationType: record.fields['Regulation Type'] || 'General',
      effectiveDate: record.fields['Effective Date'] || new Date().toISOString().split('T')[0],
      lastUpdated: record.createdTime,
    }));
  }

  private getMockData(): AirtableEntry[] {
    return [
      {
        id: 'rec1',
        confidence: 'High',
        topic: 'Key Regulation',
        fintechCategory: 'Crypto/Blockchain',
        content: 'Cryptocurrency transactions must include AML screening and wallet address verification',
        country: 'US',
        regulationType: 'AML',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'rec2',
        confidence: 'High',
        topic: 'Key Regulation',
        fintechCategory: 'Insurance',
        content: 'Insurance claims must be processed within 48 hours of submission with proper verification',
        country: 'UK',
        regulationType: 'Insurance',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'rec3',
        confidence: 'High',
        topic: 'Key Regulation',
        fintechCategory: 'RegTech',
        content: 'Regulatory reporting must be automated and submitted within 24 hours of threshold breach',
        country: 'EU',
        regulationType: 'Regulatory',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'rec4',
        confidence: 'Medium',
        topic: 'Key Regulation',
        fintechCategory: 'Lending',
        content: 'Loan applications must include credit score verification and affordability assessment',
        country: 'US',
        regulationType: 'Lending',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'rec5',
        confidence: 'High',
        topic: 'Key Regulation',
        fintechCategory: 'Digital Banking',
        content: 'Customer onboarding must include KYC verification and identity proofing',
        country: 'Global',
        regulationType: 'KYC',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'rec6',
        confidence: 'High',
        topic: 'Key Regulation',
        fintechCategory: 'Payments',
        content: 'Payment processing must include real-time fraud detection for all transactions over $1,000',
        country: 'EU',
        regulationType: 'PSD2',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'rec7',
        confidence: 'Medium',
        topic: 'Key Regulation',
        fintechCategory: 'Personal Finance',
        content: 'Financial advice recommendations must be based on customer risk profile and financial goals',
        country: 'US',
        regulationType: 'Investment',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'rec8',
        confidence: 'High',
        topic: 'Key Regulation',
        fintechCategory: 'WealthTech',
        content: 'Portfolio management must include risk assessment and diversification requirements',
        country: 'Global',
        regulationType: 'Investment',
        effectiveDate: '2024-01-01',
        lastUpdated: new Date().toISOString(),
      },
    ];
  }

  async normalizeToKnowledgeObjects(entries: AirtableEntry[]): Promise<KnowledgeObject[]> {
    return entries.map(entry => ({
      id: `ko_${entry.id}`,
      confidence: entry.confidence,
      topic: entry.topic,
      category: this.mapFintechCategory(entry.fintechCategory),
      content: entry.content,
      country: entry.country,
      regulationType: entry.regulationType,
      effectiveDate: entry.effectiveDate,
      status: entry.confidence === 'High' ? 'validated' : 'pending_review',
      lastUpdated: entry.lastUpdated || new Date().toISOString(),
      airtableId: entry.id,
    }));
  }

  private mapFintechCategory(fintechCategory: string): string {
    const categoryMap: Record<string, string> = {
      'RegTech': 'RegTech',
      'Payments': 'Payments',
      'Insurance': 'Insurance',
      'Digital Banking': 'Digital Banking',
      'WealthTech': 'WealthTech',
      'Crypto/Blockchain': 'Crypto/Blockchain',
      'Lending': 'Lending',
      'Personal Finance': 'Personal Finance',
    };

    return categoryMap[fintechCategory] || fintechCategory;
  }

  async saveKnowledgeObjects(objects: KnowledgeObject[]): Promise<void> {
    // Ensure system tenant exists
    try {
      await db.tenant.upsert({
        where: { id: 'system' },
        update: {},
        create: {
          id: 'system',
          name: 'System',
          domain: 'system.local',
          status: 'ACTIVE',
          config: {},
        },
      });
    } catch (error) {
      console.error('Error creating system tenant:', error);
    }

    // Ensure default compliance domain exists
    try {
      await db.complianceDomain.upsert({
        where: { id: 'default' },
        update: {},
        create: {
          id: 'default',
          name: 'Global Regulatory Compliance',
          description: 'Default compliance domain for global regulatory requirements',
          regulations: JSON.stringify(['AML', 'KYC', 'PSD2', 'Investment', 'Insurance', 'Lending', 'Regulatory']),
          isActive: true,
          metadata: {},
        },
      });
    } catch (error) {
      console.error('Error creating default compliance domain:', error);
    }

    for (const obj of objects) {
      try {
        await db.knowledgeObject.upsert({
          where: { id: obj.id },
          update: {
            confidence: obj.confidence,
            topic: obj.topic,
            category: obj.category,
            content: obj.content,
            country: obj.country,
            regulationType: obj.regulationType,
            effectiveDate: obj.effectiveDate,
            status: obj.status,
            lastUpdated: obj.lastUpdated,
            airtableId: obj.airtableId,
            complianceDomainId: 'default',
          },
          create: {
            id: obj.id,
            confidence: obj.confidence,
            topic: obj.topic,
            category: obj.category,
            content: obj.content,
            country: obj.country,
            regulationType: obj.regulationType,
            effectiveDate: obj.effectiveDate,
            status: obj.status,
            lastUpdated: obj.lastUpdated,
            airtableId: obj.airtableId,
            tenantId: 'system', // System-wide knowledge
            complianceDomainId: 'default',
          },
        });
      } catch (error) {
        console.error(`Error saving knowledge object ${obj.id}:`, error);
      }
    }
  }

  async syncAirtableData(): Promise<{ success: boolean; message: string; processed: number }> {
    try {
      // Fetch entries from Airtable
      const entries = await this.fetchEntries();
      
      // Normalize to knowledge objects
      const knowledgeObjects = await this.normalizeToKnowledgeObjects(entries);
      
      // Save to database
      await this.saveKnowledgeObjects(knowledgeObjects);
      
      return {
        success: true,
        message: 'Airtable data synchronized successfully',
        processed: knowledgeObjects.length,
      };
    } catch (error) {
      console.error('Error syncing Airtable data:', error);
      return {
        success: false,
        message: `Error syncing Airtable data: ${error.message}`,
        processed: 0,
      };
    }
  }

  async getKnowledgeObjects(filters?: {
    confidence?: 'High' | 'Medium';
    category?: string;
    status?: 'validated' | 'pending_review' | 'deployed';
  }): Promise<KnowledgeObject[]> {
    const whereClause: any = {};
    
    if (filters?.confidence) {
      whereClause.confidence = filters.confidence;
    }
    
    if (filters?.category) {
      whereClause.category = filters.category;
    }
    
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    const objects = await db.knowledgeObject.findMany({
      where: whereClause,
      orderBy: { lastUpdated: 'desc' },
    });

    return objects.map(obj => ({
      id: obj.id,
      confidence: obj.confidence,
      topic: obj.topic,
      category: obj.category,
      content: obj.content,
      country: obj.country,
      regulationType: obj.regulationType,
      status: obj.status,
      lastUpdated: obj.lastUpdated.toISOString(),
      airtableId: obj.airtableId,
    }));
  }

  async deployKnowledgeObject(id: string): Promise<boolean> {
    try {
      await db.knowledgeObject.update({
        where: { id },
        data: { status: 'deployed' },
      });
      return true;
    } catch (error) {
      console.error(`Error deploying knowledge object ${id}:`, error);
      return false;
    }
  }

  async getPendingReviewObjects(): Promise<KnowledgeObject[]> {
    return this.getKnowledgeObjects({ status: 'pending_review' });
  }

  async getDeployedRules(): Promise<KnowledgeObject[]> {
    return this.getKnowledgeObjects({ status: 'deployed' });
  }

  // Local knowledge management methods
  async createKnowledgeObject(data: {
    confidence: 'High' | 'Medium';
    topic: string;
    category: string;
    content: string;
    country: string;
    regulationType: string;
    effectiveDate: string;
  }): Promise<KnowledgeObject> {
    // Ensure system tenant exists
    try {
      await db.tenant.upsert({
        where: { id: 'system' },
        update: {},
        create: {
          id: 'system',
          name: 'System',
          domain: 'system.local',
          status: 'ACTIVE',
          config: {},
        },
      });
    } catch (error) {
      console.error('Error creating system tenant:', error);
    }

    // Ensure default compliance domain exists
    try {
      await db.complianceDomain.upsert({
        where: { id: 'default' },
        update: {},
        create: {
          id: 'default',
          name: 'Global Regulatory Compliance',
          description: 'Default compliance domain for global regulatory requirements',
          regulations: JSON.stringify(['AML', 'KYC', 'PSD2', 'Investment', 'Insurance', 'Lending', 'Regulatory']),
          isActive: true,
          metadata: {},
        },
      });
    } catch (error) {
      console.error('Error creating default compliance domain:', error);
    }

    const id = `ko_local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const knowledgeObject: KnowledgeObject = {
      id,
      confidence: data.confidence,
      topic: data.topic,
      category: data.category,
      content: data.content,
      country: data.country,
      regulationType: data.regulationType,
      effectiveDate: data.effectiveDate,
      status: data.confidence === 'High' ? 'validated' : 'pending_review',
      lastUpdated: new Date().toISOString(),
      airtableId: `local_${id}`,
    };

    await db.knowledgeObject.create({
      data: {
        id: knowledgeObject.id,
        confidence: knowledgeObject.confidence,
        topic: knowledgeObject.topic,
        category: knowledgeObject.category,
        content: knowledgeObject.content,
        country: knowledgeObject.country,
        regulationType: knowledgeObject.regulationType,
        effectiveDate: knowledgeObject.effectiveDate,
        status: knowledgeObject.status,
        lastUpdated: knowledgeObject.lastUpdated,
        airtableId: knowledgeObject.airtableId,
        tenantId: 'system',
        complianceDomainId: 'default',
      },
    });

    return knowledgeObject;
  }

  async updateKnowledgeObject(id: string, data: Partial<KnowledgeObject>): Promise<KnowledgeObject | null> {
    try {
      const updated = await db.knowledgeObject.update({
        where: { id },
        data: {
          ...(data.confidence && { confidence: data.confidence }),
          ...(data.topic && { topic: data.topic }),
          ...(data.category && { category: data.category }),
          ...(data.content && { content: data.content }),
          ...(data.country && { country: data.country }),
          ...(data.regulationType && { regulationType: data.regulationType }),
          ...(data.effectiveDate && { effectiveDate: data.effectiveDate }),
          ...(data.status && { status: data.status }),
          lastUpdated: new Date().toISOString(),
        },
      });

      return {
        id: updated.id,
        confidence: updated.confidence,
        topic: updated.topic,
        category: updated.category,
        content: updated.content,
        country: updated.country,
        regulationType: updated.regulationType,
        effectiveDate: updated.effectiveDate,
        status: updated.status,
        lastUpdated: updated.lastUpdated.toISOString(),
        airtableId: updated.airtableId,
      };
    } catch (error) {
      console.error(`Error updating knowledge object ${id}:`, error);
      return null;
    }
  }

  async deleteKnowledgeObject(id: string): Promise<boolean> {
    try {
      await db.knowledgeObject.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error(`Error deleting knowledge object ${id}:`, error);
      return false;
    }
  }

  async bulkCreateKnowledgeObjects(objects: Array<{
    confidence: 'High' | 'Medium';
    topic: string;
    category: string;
    content: string;
    country: string;
    regulationType: string;
    effectiveDate: string;
  }>): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    for (const obj of objects) {
      try {
        await this.createKnowledgeObject(obj);
        success++;
      } catch (error) {
        console.error('Error creating knowledge object:', error);
        errors++;
      }
    }

    return { success, errors };
  }

  async getKnowledgeStatistics(): Promise<{
    total: number;
    byCountry: Record<string, number>;
    byRegulationType: Record<string, number>;
    byConfidence: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const allObjects = await this.getKnowledgeObjects();
    
    const stats = {
      total: allObjects.length,
      byCountry: {} as Record<string, number>,
      byRegulationType: {} as Record<string, number>,
      byConfidence: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    allObjects.forEach(obj => {
      stats.byCountry[obj.country] = (stats.byCountry[obj.country] || 0) + 1;
      stats.byRegulationType[obj.regulationType] = (stats.byRegulationType[obj.regulationType] || 0) + 1;
      stats.byConfidence[obj.confidence] = (stats.byConfidence[obj.confidence] || 0) + 1;
      stats.byStatus[obj.status] = (stats.byStatus[obj.status] || 0) + 1;
    });

    return stats;
  }
}