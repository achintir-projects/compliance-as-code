import { db } from '@/lib/db';

export interface ContributionScore {
  tenantId: string;
  totalPoints: number;
  level: string;
  badges: string[];
  contributions: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
  ranking: {
    global: number;
    regional: number;
    sector: number;
  };
}

export interface IncentiveCalculation {
  credits: number;
  discount: number;
  badges: string[];
  nextLevel: string;
  pointsToNext: number;
}

export class ContributionScoringSystem {
  private scoreThresholds = {
    bronze: 100,
    silver: 500,
    gold: 1000,
    platinum: 2500,
    diamond: 5000
  };

  private badgeRequirements = {
    'First Contribution': { points: 1, type: 'milestone' },
    'Rising Star': { points: 10, type: 'achievement' },
    'Community Leader': { points: 50, type: 'achievement' },
    'Expert Contributor': { points: 100, type: 'achievement' },
    'Fraud Hunter': { points: 25, type: 'specialty', category: 'fraud' },
    'AML Specialist': { points: 30, type: 'specialty', category: 'aml' },
    'Risk Analyst': { points: 35, type: 'specialty', category: 'risk' },
    'Compliance Guardian': { points: 40, type: 'specialty', category: 'compliance' },
    'Early Adopter': { points: 15, type: 'temporal', timeframe: 'first_month' },
    'Consistent Contributor': { points: 20, type: 'temporal', timeframe: 'monthly_streak' },
    'Quality Champion': { points: 45, type: 'quality', minVerificationScore: 0.9 },
    'Speed Demon': { points: 25, type: 'speed', maxResponseTime: 3600 },
    'Team Player': { points: 30, type: 'collaboration', minCollaborativeActions: 5 }
  };

  async calculateContributionScore(tenantId: string): Promise<ContributionScore> {
    // Get all contributions for the tenant
    const contributions = await db.riskExchangeContribution.findMany({
      where: { tenantId },
      include: { verifications: true }
    });

    const totalPoints = contributions.reduce((sum, contribution) => sum + contribution.points, 0);
    const level = this.calculateLevel(totalPoints);
    const badges = await this.calculateBadges(tenantId, contributions);
    
    const contributionStats = {
      total: contributions.length,
      verified: contributions.filter(c => c.verified).length,
      pending: contributions.filter(c => c.status === 'PENDING').length,
      rejected: contributions.filter(c => c.status === 'REJECTED').length
    };

    const ranking = await this.calculateRanking(tenantId, totalPoints);

    return {
      tenantId,
      totalPoints,
      level,
      badges,
      contributions: contributionStats,
      ranking
    };
  }

  private calculateLevel(points: number): string {
    if (points >= this.scoreThresholds.diamond) return 'Diamond';
    if (points >= this.scoreThresholds.platinum) return 'Platinum';
    if (points >= this.scoreThresholds.gold) return 'Gold';
    if (points >= this.scoreThresholds.silver) return 'Silver';
    if (points >= this.scoreThresholds.bronze) return 'Bronze';
    return 'Newcomer';
  }

  private async calculateBadges(tenantId: string, contributions: any[]): Promise<string[]> {
    const badges: string[] = [];
    
    for (const [badgeName, requirement] of Object.entries(this.badgeRequirements)) {
      if (await this.eligibleForBadge(tenantId, contributions, badgeName, requirement)) {
        badges.push(badgeName);
      }
    }

    return badges;
  }

  private async eligibleForBadge(
    tenantId: string, 
    contributions: any[], 
    badgeName: string, 
    requirement: any
  ): Promise<boolean> {
    switch (requirement.type) {
      case 'milestone':
        return contributions.length >= requirement.points;
      
      case 'achievement':
        const totalPoints = contributions.reduce((sum, c) => sum + c.points, 0);
        return totalPoints >= requirement.points;
      
      case 'specialty':
        const categoryContributions = contributions.filter(c => 
          c.signalType.toLowerCase().includes(requirement.category)
        );
        return categoryContributions.length >= requirement.points;
      
      case 'temporal':
        if (requirement.timeframe === 'first_month') {
          const firstContribution = contributions.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0];
          if (!firstContribution) return false;
          const contributionDate = new Date(firstContribution.createdAt);
          const now = new Date();
          const daysDiff = (now.getTime() - contributionDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 30;
        }
        return false;
      
      case 'quality':
        const highQualityContributions = contributions.filter(c => 
          c.verifications.some((v: any) => v.score >= requirement.minVerificationScore)
        );
        return highQualityContributions.length >= requirement.points;
      
      case 'speed':
        // This would check response time for verification requests
        return false; // Placeholder
      
      case 'collaboration':
        // This would check collaborative actions with other tenants
        return false; // Placeholder
      
      default:
        return false;
    }
  }

  private async calculateRanking(tenantId: string, points: number): Promise<{
    global: number;
    regional: number;
    sector: number;
  }> {
    // Get all tenants with their points for ranking
    const allScores = await db.riskExchangeLeaderboard.findMany({
      where: { period: 'ALL_TIME' },
      orderBy: { totalPoints: 'desc' }
    });

    const globalRank = allScores.findIndex(score => score.tenantId === tenantId) + 1;
    
    // For regional and sector rankings, we'd need more tenant information
    // For now, we'll use placeholder logic
    const regionalRank = Math.max(1, Math.floor(globalRank * 0.7));
    const sectorRank = Math.max(1, Math.floor(globalRank * 0.8));

    return {
      global: globalRank || 999,
      regional: regionalRank,
      sector: sectorRank
    };
  }

  async calculateIncentives(tenantId: string): Promise<IncentiveCalculation> {
    const score = await this.calculateContributionScore(tenantId);
    
    const credits = this.calculateCredits(score.totalPoints, score.level);
    const discount = this.calculateDiscount(score.level);
    const nextLevel = this.getNextLevel(score.level);
    const pointsToNext = this.getPointsToNext(score.totalPoints, score.level);

    return {
      credits,
      discount,
      badges: score.badges,
      nextLevel,
      pointsToNext
    };
  }

  private calculateCredits(points: number, level: string): number {
    let baseCredits = Math.floor(points / 10); // 1 credit per 10 points
    
    // Level multiplier
    const levelMultipliers = {
      'Newcomer': 1,
      'Bronze': 1.2,
      'Silver': 1.5,
      'Gold': 2,
      'Platinum': 2.5,
      'Diamond': 3
    };

    baseCredits *= levelMultipliers[level as keyof typeof levelMultipliers] || 1;

    return Math.floor(baseCredits);
  }

  private calculateDiscount(level: string): number {
    const discounts = {
      'Newcomer': 0,
      'Bronze': 5,
      'Silver': 10,
      'Gold': 15,
      'Platinum': 20,
      'Diamond': 25
    };

    return discounts[level as keyof typeof discounts] || 0;
  }

  private getNextLevel(currentLevel: string): string {
    const levels = ['Newcomer', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'MAX';
  }

  private getPointsToNext(currentPoints: number, currentLevel: string): number {
    const nextLevel = this.getNextLevel(currentLevel);
    if (nextLevel === 'MAX') return 0;
    
    const threshold = this.scoreThresholds[nextLevel.toLowerCase() as keyof typeof this.scoreThresholds];
    return threshold - currentPoints;
  }

  async processContribution(contributionData: any): Promise<{
    success: boolean;
    points: number;
    badges: string[];
    message: string;
  }> {
    try {
      // Calculate base points for the contribution
      const basePoints = this.calculateBasePoints(contributionData);
      
      // Apply confidence multiplier
      const confidenceMultiplier = Math.max(0.5, contributionData.confidence);
      const finalPoints = Math.floor(basePoints * confidenceMultiplier);

      // Create the contribution record
      const contribution = await db.riskExchangeContribution.create({
        data: {
          contributorId: contributionData.tenantId,
          signalType: contributionData.signalType,
          signalData: contributionData.signalData,
          confidence: contributionData.confidence,
          points: finalPoints,
          status: 'PENDING',
          tenantId: contributionData.tenantId,
          metadata: {
            source: contributionData.source || 'manual',
            category: contributionData.category || 'general',
            severity: contributionData.severity || 'medium'
          }
        }
      });

      // Update leaderboard
      await this.updateLeaderboard(contributionData.tenantId);

      // Check for new badges
      const currentScore = await this.calculateContributionScore(contributionData.tenantId);
      const newBadges = currentScore.badges;

      return {
        success: true,
        points: finalPoints,
        badges: newBadges,
        message: `Contribution submitted successfully! Earned ${finalPoints} points.`
      };

    } catch (error) {
      console.error('Error processing contribution:', error);
      return {
        success: false,
        points: 0,
        badges: [],
        message: `Failed to process contribution: ${error.message}`
      };
    }
  }

  private calculateBasePoints(contributionData: any): number {
    let points = 10; // Base points for any contribution

    // Signal type multiplier
    const typeMultipliers = {
      'fraud': 25,
      'aml': 20,
      'suspicious': 15,
      'risk': 18,
      'compliance': 12,
      'general': 10
    };

    points *= typeMultipliers[contributionData.signalType.toLowerCase()] || 1;

    // Severity multiplier
    const severityMultipliers = {
      'critical': 2,
      'high': 1.5,
      'medium': 1,
      'low': 0.8
    };

    points *= severityMultipliers[contributionData.severity?.toLowerCase()] || 1;

    // Data completeness bonus
    if (contributionData.signalData && Object.keys(contributionData.signalData).length > 5) {
      points *= 1.2;
    }

    return Math.floor(points);
  }

  private async updateLeaderboard(tenantId: string): Promise<void> {
    const score = await this.calculateContributionScore(tenantId);

    // Update different leaderboard periods
    const periods = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];
    
    for (const period of periods) {
      await db.riskExchangeLeaderboard.upsert({
        where: {
          tenantId_period: {
            tenantId,
            period
          }
        },
        update: {
          totalPoints: score.totalPoints,
          contributions: score.contributions.total,
          badges: score.badges,
          rank: 0 // Will be recalculated by a separate process
        },
        create: {
          tenantId,
          period,
          totalPoints: score.totalPoints,
          contributions: score.contributions.total,
          badges: score.badges,
          rank: 0
        }
      });
    }
  }

  async verifyContribution(
    contributionId: string, 
    verifierId: string, 
    score: number, 
    feedback?: string
  ): Promise<{
    success: boolean;
    message: string;
    pointsAdjustment?: number;
  }> {
    try {
      const contribution = await db.riskExchangeContribution.findUnique({
        where: { id: contributionId }
      });

      if (!contribution) {
        return {
          success: false,
          message: 'Contribution not found'
        };
      }

      // Create verification record
      await db.riskExchangeVerification.create({
        data: {
          contributionId,
          verifierId,
          score,
          feedback,
          tenantId: verifierId
        }
      });

      // Update contribution status and points
      const isVerified = score >= 0.7; // 70% threshold for verification
      const status = isVerified ? 'VERIFIED' : 'REJECTED';
      
      let pointsAdjustment = 0;
      if (isVerified) {
        // Bonus points for high-quality contributions
        if (score >= 0.9) {
          pointsAdjustment = Math.floor(contribution.points * 0.2); // 20% bonus
        }
      } else {
        // Remove points for rejected contributions
        pointsAdjustment = -contribution.points;
      }

      await db.riskExchangeContribution.update({
        where: { id: contributionId },
        data: {
          status,
          verified: isVerified,
          verificationScore: score,
          points: Math.max(0, contribution.points + pointsAdjustment)
        }
      });

      // Update contributor's score and leaderboard
      await this.updateLeaderboard(contribution.contributorId);

      // Award incentives to verifier
      if (isVerified) {
        await this.awardVerificationIncentive(verifierId, 5); // 5 points for verification
      }

      return {
        success: true,
        message: `Contribution ${status.toLowerCase()}. ${pointsAdjustment > 0 ? `Bonus: +${pointsAdjustment} points` : pointsAdjustment < 0 ? `Penalty: ${pointsAdjustment} points` : ''}`,
        pointsAdjustment
      };

    } catch (error) {
      console.error('Error verifying contribution:', error);
      return {
        success: false,
        message: `Failed to verify contribution: ${error.message}`
      };
    }
  }

  private async awardVerificationIncentive(verifierId: string, points: number): Promise<void> {
    // This would create incentive records for the verifier
    // For now, we'll just update their leaderboard score
    await this.updateLeaderboard(verifierId);
  }

  async getLeaderboard(period: string = 'ALL_TIME', limit: number = 50): Promise<any[]> {
    const leaderboard = await db.riskExchangeLeaderboard.findMany({
      where: { period },
      orderBy: [
        { totalPoints: 'desc' },
        { contributions: 'desc' }
      ],
      take: limit,
      include: {
        tenant: {
          select: {
            name: true,
            domain: true
          }
        }
      }
    });

    // Assign ranks
    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }

  async getTenantIncentives(tenantId: string): Promise<{
    availableCredits: number;
    activeDiscounts: any[];
    earnedBadges: string[];
    nextIncentive: any;
  }> {
    const incentives = await db.riskExchangeIncentive.findMany({
      where: {
        tenantId,
        status: 'ACTIVE'
      }
    });

    const availableCredits = incentives
      .filter(i => i.type === 'CREDIT')
      .reduce((sum, i) => sum + i.value, 0);

    const activeDiscounts = incentives.filter(i => i.type === 'DISCOUNT');

    const score = await this.calculateContributionScore(tenantId);
    const nextIncentive = await this.calculateIncentives(tenantId);

    return {
      availableCredits,
      activeDiscounts,
      earnedBadges: score.badges,
      nextIncentive: {
        level: nextIncentive.nextLevel,
        pointsNeeded: nextIncentive.pointsToNext,
        reward: `${nextIncentive.credits} credits + ${nextIncentive.discount}% discount`
      }
    };
  }
}