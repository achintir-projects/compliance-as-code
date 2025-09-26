import { db } from '@/lib/db';
import { TrustTier } from '@prisma/client';

export interface TrustWeightConfig {
  T0: number; // Highest trust - direct from regulator
  T1: number; // Medium trust - verified secondary source
  T2: number; // Lower trust - unverified source
}

export interface ConfidenceAdjustment {
  baseConfidence: 'High' | 'Medium';
  trustTier: TrustTier;
  adjustedConfidence: number; // 0.0 to 1.0
  weight: number;
}

export class TrustTierSystem {
  private static readonly DEFAULT_WEIGHTS: TrustWeightConfig = {
    T0: 1.0,    // 100% weight
    T1: 0.8,    // 80% weight
    T2: 0.5     // 50% weight
  };

  private static readonly CONFIDENCE_MULTIPLIERS = {
    High: 1.0,
    Medium: 0.7
  };

  /**
   * Calculate adjusted confidence based on trust tier and base confidence
   */
  static calculateAdjustedConfidence(
    baseConfidence: 'High' | 'Medium',
    trustTier: TrustTier
  ): ConfidenceAdjustment {
    const baseMultiplier = this.CONFIDENCE_MULTIPLIERS[baseConfidence];
    const trustWeight = this.DEFAULT_WEIGHTS[trustTier];
    const adjustedConfidence = baseMultiplier * trustWeight;

    return {
      baseConfidence,
      trustTier,
      adjustedConfidence,
      weight: trustWeight
    };
  }

  /**
   * Get knowledge objects weighted by trust tier
   */
  static async getWeightedKnowledgeObjects(
    filters?: {
      country?: string;
      regulationType?: string;
      category?: string;
      minConfidence?: number;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'confidence' | 'trustTier' | 'createdAt';
    }
  ) {
    const where: any = {};

    if (filters?.country) {
      where.country = filters.country;
    }

    if (filters?.regulationType) {
      where.regulationType = filters.regulationType;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    // Get all matching knowledge objects
    const knowledgeObjects = await db.knowledgeObject.findMany({
      where,
      include: {
        decisionBundles: true,
        consentObjects: true
      },
      orderBy: options?.orderBy ? {
        [options.orderBy]: 'desc'
      } : {
        createdAt: 'desc'
      },
      take: options?.limit,
      skip: options?.offset
    });

    // Calculate weighted confidence for each object
    const weightedObjects = knowledgeObjects.map(ko => {
      const adjustment = this.calculateAdjustedConfidence(
        ko.confidence as 'High' | 'Medium',
        ko.trustTier
      );

      return {
        ...ko,
        weightedConfidence: adjustment.adjustedConfidence,
        trustWeight: adjustment.weight,
        confidenceBreakdown: adjustment
      };
    });

    // Filter by minimum confidence if specified
    if (filters?.minConfidence) {
      return weightedObjects.filter(
        obj => obj.weightedConfidence >= filters.minConfidence!
      );
    }

    return weightedObjects;
  }

  /**
   * Get trust tier statistics
   */
  static async getTrustTierStats() {
    const stats = await db.knowledgeObject.groupBy({
      by: ['trustTier'],
      _count: {
        id: true
      },
      _sum: {
        // This is a placeholder - in a real implementation, you might want to calculate actual sums
      }
    });

    const total = stats.reduce((sum, stat) => sum + stat._count.id, 0);

    return {
      total,
      distribution: stats.map(stat => ({
        trustTier: stat.trustTier,
        count: stat._count.id,
        percentage: total > 0 ? (stat._count.id / total) * 100 : 0
      })),
      weights: this.DEFAULT_WEIGHTS
    };
  }

  /**
   * Promote or demote trust tier for a knowledge object
   */
  static async updateTrustTier(
    knowledgeObjectId: string,
    newTrustTier: TrustTier,
    reason?: string
  ) {
    const updated = await db.knowledgeObject.update({
      where: { id: knowledgeObjectId },
      data: { 
        trustTier: newTrustTier,
        // You might want to add an audit log here
      }
    });

    // Log the trust tier change (you could integrate with your audit system)
    console.log(`Trust tier updated for KO ${knowledgeObjectId}: ${newTrustTier}`, reason);

    return updated;
  }

  /**
   * Bulk update trust tiers based on source patterns
   */
  static async bulkUpdateTrustTierBySource(
    sourcePattern: string,
    newTrustTier: TrustTier
  ) {
    const updated = await db.knowledgeObject.updateMany({
      where: {
        OR: [
          {
            sourceUri: {
              contains: sourcePattern
            }
          },
          {
            publisher: {
              contains: sourcePattern
            }
          }
        ]
      },
      data: {
        trustTier: newTrustTier
      }
    });

    console.log(`Bulk updated ${updated.count} knowledge objects to trust tier ${newTrustTier}`);

    return updated;
  }

  /**
   * Validate trust tier assignment based on source
   */
  static validateTrustTierAssignment(
    sourceUri: string,
    publisher: string,
    assignedTrustTier: TrustTier
  ): boolean {
    const officialSources = [
      'fca.org.uk',
      'fatf-gafi.org',
      'bis.org',
      'esma.europa.eu',
      'centralbank.ae',
      'federalreserve.gov',
      'sec.gov',
      'fsb.org'
    ];

    const isOfficialSource = officialSources.some(domain => 
      sourceUri.includes(domain) || publisher.toLowerCase().includes(domain)
    );

    // T0 should only be assigned to official sources
    if (assignedTrustTier === 'T0' && !isOfficialSource) {
      return false;
    }

    return true;
  }

  /**
   * Get recommended trust tier based on source
   */
  static getRecommendedTrustTier(
    sourceUri: string,
    publisher: string
  ): TrustTier {
    const officialSources = [
      'fca.org.uk',
      'fatf-gafi.org',
      'bis.org',
      'esma.europa.eu',
      'centralbank.ae',
      'federalreserve.gov',
      'sec.gov',
      'fsb.org'
    ];

    const verifiedSources = [
      'europa.eu',
      'un.org',
      'oecd.org',
      'imf.org',
      'worldbank.org'
    ];

    const isOfficialSource = officialSources.some(domain => 
      sourceUri.includes(domain) || publisher.toLowerCase().includes(domain)
    );

    const isVerifiedSource = verifiedSources.some(domain => 
      sourceUri.includes(domain) || publisher.toLowerCase().includes(domain)
    );

    if (isOfficialSource) {
      return 'T0';
    } else if (isVerifiedSource) {
      return 'T1';
    } else {
      return 'T2';
    }
  }

  /**
   * Get confidence score for decision making
   */
  static async getDecisionConfidenceScore(
    knowledgeObjectIds: string[]
  ): Promise<{
    overallConfidence: number;
    breakdown: Array<{
      knowledgeObjectId: string;
      confidence: number;
      trustTier: TrustTier;
      weight: number;
    }>;
    trustTierDistribution: Record<TrustTier, number>;
  }> {
    const knowledgeObjects = await db.knowledgeObject.findMany({
      where: {
        id: {
          in: knowledgeObjectIds
        }
      }
    });

    const breakdown = knowledgeObjects.map(ko => {
      const adjustment = this.calculateAdjustedConfidence(
        ko.confidence as 'High' | 'Medium',
        ko.trustTier
      );

      return {
        knowledgeObjectId: ko.id,
        confidence: adjustment.adjustedConfidence,
        trustTier: ko.trustTier,
        weight: adjustment.weight
      };
    });

    const totalWeight = breakdown.reduce((sum, item) => sum + item.weight, 0);
    const weightedConfidence = breakdown.reduce(
      (sum, item) => sum + (item.confidence * item.weight), 
      0
    );

    const overallConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

    const trustTierDistribution = breakdown.reduce((acc, item) => {
      acc[item.trustTier] = (acc[item.trustTier] || 0) + 1;
      return acc;
    }, {} as Record<TrustTier, number>);

    return {
      overallConfidence,
      breakdown,
      trustTierDistribution
    };
  }
}

export default TrustTierSystem;