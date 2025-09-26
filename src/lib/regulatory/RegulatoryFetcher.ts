import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import crypto from 'crypto';

export interface RegulatorySource {
  id: string;
  name: string;
  baseUrl: string;
  jurisdiction: string;
  publisher: string;
  trustTier: 'T0' | 'T1' | 'T2';
  endpoints: RegulatoryEndpoint[];
  lastSyncAt?: Date;
}

export interface RegulatoryEndpoint {
  path: string;
  method: 'GET' | 'POST';
  category: string;
  regulationType: string;
  description: string;
  parser: string; // Reference to parser function
}

export interface RegulatoryContent {
  sourceId: string;
  title: string;
  content: string;
  category: string;
  regulationType: string;
  effectiveDate: string;
  sunsetDate?: string;
  uri: string;
  publisher: string;
  jurisdiction: string;
  license?: string;
  metadata?: Record<string, any>;
}

export interface ParsedRegulation {
  topic: string;
  category: string;
  content: string;
  confidence: 'High' | 'Medium';
  country: string;
  regulationType: string;
  effectiveDate: string;
  sunsetDate?: string;
  sourceUri: string;
  publisher: string;
  jurisdiction: string;
  contentLicense?: string;
  trustTier: 'T0' | 'T1' | 'T2';
}

export class RegulatoryFetcher {
  private zai: ZAI | null = null;
  private sources: RegulatorySource[] = [
    {
      id: 'fca',
      name: 'Financial Conduct Authority',
      baseUrl: 'https://www.fca.org.uk',
      jurisdiction: 'GB',
      publisher: 'FCA',
      trustTier: 'T0',
      endpoints: [
        {
          path: '/api/handbook',
          method: 'GET',
          category: 'Regulatory Handbook',
          regulationType: 'General',
          description: 'FCA Handbook and regulations',
          parser: 'parseFCAHandbook'
        }
      ]
    },
    {
      id: 'fatf',
      name: 'Financial Action Task Force',
      baseUrl: 'https://www.fatf-gafi.org',
      jurisdiction: 'Global',
      publisher: 'FATF',
      trustTier: 'T0',
      endpoints: [
        {
          path: '/api/recommendations',
          method: 'GET',
          category: 'AML Recommendations',
          regulationType: 'AML',
          description: 'FATF 40 Recommendations',
          parser: 'parseFATFRecommendations'
        }
      ]
    },
    {
      id: 'basel',
      name: 'Basel Committee on Banking Supervision',
      baseUrl: 'https://www.bis.org/bcbs',
      jurisdiction: 'Global',
      publisher: 'BIS',
      trustTier: 'T0',
      endpoints: [
        {
          path: '/api/standards',
          method: 'GET',
          category: 'Banking Standards',
          regulationType: 'BASEL_III',
          description: 'Basel III Framework',
          parser: 'parseBaselStandards'
        }
      ]
    },
    {
      id: 'esma',
      name: 'European Securities and Markets Authority',
      baseUrl: 'https://www.esma.europa.eu',
      jurisdiction: 'EU',
      publisher: 'ESMA',
      trustTier: 'T0',
      endpoints: [
        {
          path: '/api/regulations',
          method: 'GET',
          category: 'Securities Regulation',
          regulationType: 'General',
          description: 'EU Securities Regulations',
          parser: 'parseESMARegulations'
        }
      ]
    },
    {
      id: 'cbuae',
      name: 'Central Bank of UAE',
      baseUrl: 'https://www.centralbank.ae',
      jurisdiction: 'AE',
      publisher: 'CBUAE',
      trustTier: 'T0',
      endpoints: [
        {
          path: '/api/regulations',
          method: 'GET',
          category: 'Banking Regulation',
          regulationType: 'General',
          description: 'UAE Banking Regulations',
          parser: 'parseCBUAERegulations'
        }
      ]
    }
  ];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.zai = await ZAI.create();
    } catch (error) {
      console.error('Failed to initialize ZAI:', error);
    }
  }

  async fetchFromSource(sourceId: string): Promise<RegulatoryContent[]> {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    const results: RegulatoryContent[] = [];

    for (const endpoint of source.endpoints) {
      try {
        const content = await this.fetchEndpoint(source, endpoint);
        results.push(...content);
      } catch (error) {
        console.error(`Failed to fetch from ${source.name} endpoint ${endpoint.path}:`, error);
      }
    }

    return results;
  }

  private async fetchEndpoint(source: RegulatorySource, endpoint: RegulatoryEndpoint): Promise<RegulatoryContent[]> {
    if (!this.zai) {
      throw new Error('ZAI not initialized');
    }

    try {
      // Use web search to find regulatory content
      const searchQuery = `${source.name} ${endpoint.description} ${new Date().getFullYear()}`;
      const searchResult = await this.zai.functions.invoke("web_search", {
        query: searchQuery,
        num: 10
      });

      const results: RegulatoryContent[] = [];

      for (const item of searchResult) {
        try {
          // Fetch and parse the content
          const parsedContent = await this.parseRegulatoryContent(item, source, endpoint);
          if (parsedContent) {
            results.push({
              sourceId: source.id,
              title: parsedContent.topic,
              content: parsedContent.content,
              category: parsedContent.category,
              regulationType: parsedContent.regulationType,
              effectiveDate: parsedContent.effectiveDate,
              sunsetDate: parsedContent.sunsetDate,
              uri: item.url,
              publisher: source.publisher,
              jurisdiction: source.jurisdiction,
              license: parsedContent.contentLicense,
              metadata: {
                confidence: parsedContent.confidence,
                trustTier: parsedContent.trustTier,
                searchRank: item.rank,
                hostName: item.host_name
              }
            });
          }
        } catch (error) {
          console.error(`Failed to parse content from ${item.url}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error(`Failed to fetch endpoint ${endpoint.path}:`, error);
      return [];
    }
  }

  private async parseRegulatoryContent(
    searchResult: any, 
    source: RegulatorySource, 
    endpoint: RegulatoryEndpoint
  ): Promise<ParsedRegulation | null> {
    if (!this.zai) {
      return null;
    }

    try {
      // Use AI to parse and structure the regulatory content
      const prompt = `
        You are a regulatory compliance expert. Parse the following regulatory content and extract structured information.

        Source: ${source.name}
        URL: ${searchResult.url}
        Category: ${endpoint.category}
        Regulation Type: ${endpoint.regulationType}
        Content Snippet: ${searchResult.snippet}

        Please extract and return a JSON object with the following structure:
        {
          "topic": "Clear topic title",
          "category": "${endpoint.category}",
          "content": "Full regulatory content (you may need to fetch more details)",
          "confidence": "High" or "Medium",
          "country": "${source.jurisdiction === 'Global' ? 'Global' : source.jurisdiction}",
          "regulationType": "${endpoint.regulationType}",
          "effectiveDate": "YYYY-MM-DD format",
          "sunsetDate": "YYYY-MM-DD format or null if not applicable",
          "sourceUri": "${searchResult.url}",
          "publisher": "${source.publisher}",
          "jurisdiction": "${source.jurisdiction}",
          "contentLicense": "License type if specified, otherwise null",
          "trustTier": "${source.trustTier}"
        }

        If the content is not relevant to financial regulation or cannot be properly parsed, return null.
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a regulatory compliance expert specializing in financial regulations. You extract and structure regulatory content accurately.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return null;
      }

      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.error('Failed to parse regulatory content:', error);
      return null;
    }
  }

  async ingestToKnowledgeBase(contents: RegulatoryContent[]): Promise<void> {
    for (const content of contents) {
      try {
        // Generate content fingerprint for deduplication
        const contentFingerprint = this.generateContentFingerprint(content.content);
        const retrievalHash = this.generateRetrievalHash(content.content);

        // Check for duplicates
        const existing = await db.knowledgeObject.findFirst({
          where: {
            contentFingerprint: contentFingerprint
          }
        });

        if (existing) {
          console.log(`Skipping duplicate content: ${content.title}`);
          continue;
        }

        // Create knowledge object
        await db.knowledgeObject.create({
          data: {
            confidence: content.metadata?.confidence || 'Medium',
            topic: content.title,
            category: content.category,
            content: content.content,
            country: content.jurisdiction === 'Global' ? 'Global' : content.jurisdiction,
            regulationType: content.regulationType,
            effectiveDate: content.effectiveDate,
            sunsetDate: content.sunsetDate,
            status: 'validated',
            sourceUri: content.uri,
            publisher: content.publisher,
            jurisdiction: content.jurisdiction,
            retrievalHash,
            contentLicense: content.license,
            contentFingerprint,
            trustTier: content.metadata?.trustTier || 'T1',
            tenantId: 'system'
          }
        });

        console.log(`Successfully ingested: ${content.title}`);
      } catch (error) {
        console.error(`Failed to ingest content ${content.title}:`, error);
      }
    }
  }

  private generateContentFingerprint(content: string): string {
    return crypto
      .createHash('sha256')
      .update(content.toLowerCase().replace(/\s+/g, ' ').trim())
      .digest('hex');
  }

  private generateRetrievalHash(content: string): string {
    return crypto
      .createHash('sha512')
      .update(content)
      .digest('hex');
  }

  async syncAllSources(): Promise<void> {
    console.log('Starting regulatory sources sync...');
    
    for (const source of this.sources) {
      try {
        console.log(`Syncing ${source.name}...`);
        const contents = await this.fetchFromSource(source.id);
        await this.ingestToKnowledgeBase(contents);
        console.log(`Completed sync for ${source.name}: ${contents.length} items`);
      } catch (error) {
        console.error(`Failed to sync ${source.name}:`, error);
      }
    }

    console.log('Regulatory sources sync completed');
  }

  async syncSource(sourceId: string): Promise<void> {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    console.log(`Syncing ${source.name}...`);
    const contents = await this.fetchFromSource(sourceId);
    await this.ingestToKnowledgeBase(contents);
    console.log(`Completed sync for ${source.name}: ${contents.length} items`);
  }

  getSources(): RegulatorySource[] {
    return this.sources;
  }

  getSource(sourceId: string): RegulatorySource | undefined {
    return this.sources.find(s => s.id === sourceId);
  }
}

export const regulatoryFetcher = new RegulatoryFetcher();