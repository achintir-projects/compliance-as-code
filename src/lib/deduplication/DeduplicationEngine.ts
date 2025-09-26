import { db } from '@/lib/db';
import crypto from 'crypto';

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingId?: string;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'none';
  similarityScore?: number;
}

export interface DeduplicationStats {
  totalProcessed: number;
  duplicatesFound: number;
  uniqueItems: number;
  byMatchType: Record<string, number>;
  averageSimilarity: number;
}

export interface DeduplicationConfig {
  fuzzyThreshold: number; // 0.0 to 1.0
  semanticThreshold: number; // 0.0 to 1.0
  enableFuzzyMatching: boolean;
  enableSemanticMatching: boolean;
  checkFields: string[];
  weightings: Record<string, number>;
}

export class DeduplicationEngine {
  private static readonly DEFAULT_CONFIG: DeduplicationConfig = {
    fuzzyThreshold: 0.85,
    semanticThreshold: 0.8,
    enableFuzzyMatching: true,
    enableSemanticMatching: true,
    checkFields: ['topic', 'category', 'content', 'country', 'regulationType'],
    weightings: {
      topic: 0.3,
      category: 0.2,
      content: 0.4,
      country: 0.05,
      regulationType: 0.05
    }
  };

  private config: DeduplicationConfig;

  constructor(config?: Partial<DeduplicationConfig>) {
    this.config = { ...DeduplicationEngine.DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a knowledge object is a duplicate
   */
  async checkDuplicate(
    knowledgeObject: any,
    config?: Partial<DeduplicationConfig>
  ): Promise<DeduplicationResult> {
    const currentConfig = { ...this.config, ...config };

    // First check exact fingerprint match
    const fingerprint = this.generateContentFingerprint(knowledgeObject.content);
    const exactMatch = await this.findExactFingerprintMatch(fingerprint);
    
    if (exactMatch) {
      return {
        isDuplicate: true,
        existingId: exactMatch.id,
        confidence: 1.0,
        matchType: 'exact',
        similarityScore: 1.0
      };
    }

    // Check fuzzy matches if enabled
    if (currentConfig.enableFuzzyMatching) {
      const fuzzyMatch = await this.findFuzzyMatch(knowledgeObject, currentConfig);
      if (fuzzyMatch && fuzzyMatch.similarityScore >= currentConfig.fuzzyThreshold) {
        return {
          isDuplicate: true,
          existingId: fuzzyMatch.id,
          confidence: fuzzyMatch.similarityScore,
          matchType: 'fuzzy',
          similarityScore: fuzzyMatch.similarityScore
        };
      }
    }

    // Check semantic matches if enabled
    if (currentConfig.enableSemanticMatching) {
      const semanticMatch = await this.findSemanticMatch(knowledgeObject, currentConfig);
      if (semanticMatch && semanticMatch.similarityScore >= currentConfig.semanticThreshold) {
        return {
          isDuplicate: true,
          existingId: semanticMatch.id,
          confidence: semanticMatch.similarityScore,
          matchType: 'semantic',
          similarityScore: semanticMatch.similarityScore
        };
      }
    }

    return {
      isDuplicate: false,
      confidence: 0,
      matchType: 'none'
    };
  }

  /**
   * Generate content fingerprint for exact matching
   */
  generateContentFingerprint(content: string): string {
    // Normalize content: lowercase, remove extra whitespace, normalize punctuation
    const normalized = content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .trim();

    return crypto
      .createHash('sha256')
      .update(normalized)
      .digest('hex');
  }

  /**
   * Find exact fingerprint matches
   */
  private async findExactFingerprintMatch(fingerprint: string) {
    return await db.knowledgeObject.findFirst({
      where: {
        contentFingerprint: fingerprint
      }
    });
  }

  /**
   * Find fuzzy matches using weighted field comparison
   */
  private async findFuzzyMatch(
    knowledgeObject: any,
    config: DeduplicationConfig
  ): Promise<{ id: string; similarityScore: number } | null> {
    const allObjects = await db.knowledgeObject.findMany({
      where: {
        OR: [
          { country: knowledgeObject.country },
          { regulationType: knowledgeObject.regulationType },
          { category: knowledgeObject.category }
        ]
      }
    });

    let bestMatch: { id: string; similarityScore: number } | null = null;
    let bestScore = 0;

    for (const obj of allObjects) {
      const similarityScore = this.calculateWeightedSimilarity(
        knowledgeObject,
        obj,
        config
      );

      if (similarityScore > bestScore) {
        bestScore = similarityScore;
        bestMatch = {
          id: obj.id,
          similarityScore
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate weighted similarity between two objects
   */
  private calculateWeightedSimilarity(
    obj1: any,
    obj2: any,
    config: DeduplicationConfig
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const field of config.checkFields) {
      const weight = config.weightings[field] || 0;
      if (weight === 0) continue;

      const value1 = obj1[field] || '';
      const value2 = obj2[field] || '';
      
      const fieldSimilarity = this.calculateFieldSimilarity(value1, value2, field);
      totalScore += fieldSimilarity * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate similarity for a specific field
   */
  private calculateFieldSimilarity(value1: string, value2: string, field: string): number {
    if (value1 === value2) return 1.0;

    switch (field) {
      case 'topic':
      case 'category':
        return this.calculateStringSimilarity(value1, value2);
      
      case 'content':
        return this.calculateContentSimilarity(value1, value2);
      
      case 'country':
      case 'regulationType':
        return value1.toLowerCase() === value2.toLowerCase() ? 1.0 : 0;
      
      default:
        return this.calculateStringSimilarity(value1, value2);
    }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate content similarity using word overlap
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = this.tokenize(content1);
    const words2 = this.tokenize(content2);

    if (words1.length === 0 && words2.length === 0) return 1.0;
    if (words1.length === 0 || words2.length === 0) return 0.0;

    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out very short words
  }

  /**
   * Find semantic matches (placeholder for AI-powered semantic similarity)
   */
  private async findSemanticMatch(
    knowledgeObject: any,
    config: DeduplicationConfig
  ): Promise<{ id: string; similarityScore: number } | null> {
    // In a real implementation, this would use embeddings or AI models
    // For now, we'll use a more sophisticated version of fuzzy matching
    
    const allObjects = await db.knowledgeObject.findMany({
      where: {
        category: knowledgeObject.category
      }
    });

    let bestMatch: { id: string; similarityScore: number } | null = null;
    let bestScore = 0;

    for (const obj of allObjects) {
      const similarityScore = this.calculateSemanticSimilarity(
        knowledgeObject.content,
        obj.content
      );

      if (similarityScore > bestScore) {
        bestScore = similarityScore;
        bestMatch = {
          id: obj.id,
          similarityScore
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate semantic similarity (placeholder implementation)
   */
  private calculateSemanticSimilarity(content1: string, content2: string): number {
    // This is a simplified version - in production, use embeddings or AI models
    const words1 = this.tokenize(content1);
    const words2 = this.tokenize(content2);

    if (words1.length === 0 && words2.length === 0) return 1.0;
    if (words1.length === 0 || words2.length === 0) return 0.0;

    // Calculate Jaccard similarity
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  /**
   * Batch deduplication for multiple knowledge objects
   */
  async batchDeduplicate(
    knowledgeObjects: any[],
    config?: Partial<DeduplicationConfig>
  ): Promise<{
    results: DeduplicationResult[];
    stats: DeduplicationStats;
  }> {
    const currentConfig = { ...this.config, ...config };
    const results: DeduplicationResult[] = [];
    const stats: DeduplicationStats = {
      totalProcessed: knowledgeObjects.length,
      duplicatesFound: 0,
      uniqueItems: 0,
      byMatchType: {},
      averageSimilarity: 0
    };

    let totalSimilarity = 0;
    let similarityCount = 0;

    for (const ko of knowledgeObjects) {
      const result = await this.checkDuplicate(ko, currentConfig);
      results.push(result);

      if (result.isDuplicate) {
        stats.duplicatesFound++;
        stats.byMatchType[result.matchType] = (stats.byMatchType[result.matchType] || 0) + 1;
        
        if (result.similarityScore) {
          totalSimilarity += result.similarityScore;
          similarityCount++;
        }
      } else {
        stats.uniqueItems++;
      }
    }

    stats.averageSimilarity = similarityCount > 0 ? totalSimilarity / similarityCount : 0;

    return { results, stats };
  }

  /**
   * Get deduplication statistics for the entire knowledge base
   */
  async getDeduplicationStats(): Promise<DeduplicationStats> {
    const totalObjects = await db.knowledgeObject.count();
    
    // Count unique fingerprints
    const uniqueFingerprints = await db.knowledgeObject.groupBy({
      by: ['contentFingerprint'],
      _count: {
        id: true
      }
    });

    const duplicates = uniqueFingerprints
      .filter(group => group._count.id > 1)
      .reduce((sum, group) => sum + (group._count.id - 1), 0);

    return {
      totalProcessed: totalObjects,
      duplicatesFound: duplicates,
      uniqueItems: totalObjects - duplicates,
      byMatchType: {
        exact: duplicates
      },
      averageSimilarity: 1.0 // Exact matches have perfect similarity
    };
  }

  /**
   * Clean up duplicates by keeping the most recent version
   */
  async cleanupDuplicates(keepStrategy: 'newest' | 'oldest' | 'highest-trust' = 'newest'): Promise<{
    removedCount: number;
    keptCount: number;
  }> {
    const duplicates = await db.knowledgeObject.groupBy({
      by: ['contentFingerprint'],
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    });

    let removedCount = 0;
    let keptCount = 0;

    for (const group of duplicates) {
      const objects = await db.knowledgeObject.findMany({
        where: {
          contentFingerprint: group.contentFingerprint
        },
        orderBy: [
          { createdAt: 'desc' },
          { trustTier: 'asc' } // T0 is highest trust
        ]
      });

      if (objects.length <= 1) continue;

      // Keep the first object based on strategy, remove the rest
      const keepIndex = keepStrategy === 'oldest' ? objects.length - 1 : 0;
      const keepObject = objects[keepIndex];

      const objectsToRemove = objects.filter(obj => obj.id !== keepObject.id);
      
      for (const objToRemove of objectsToRemove) {
        await db.knowledgeObject.delete({
          where: { id: objToRemove.id }
        });
        removedCount++;
      }

      keptCount++;
    }

    return { removedCount, keptCount };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DeduplicationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): DeduplicationConfig {
    return { ...this.config };
  }
}

export const deduplicationEngine = new DeduplicationEngine();