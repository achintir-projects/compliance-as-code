import { db } from '@/lib/db';

export interface ContributionScore {
  userId: string;
  institutionId: string;
  score: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  contributions: {
    fraudReports: number;
    riskSignals: number;
    verifiedIntel: number;
    qualityScore: number;
    timelinessScore: number;
    impactScore: number;
  };
  achievements: Achievement[];
  totalEarnings: number;
  availableCredits: number;
  lastUpdated: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'volume' | 'quality' | 'impact' | 'consistency' | 'innovation';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  points: number;
}

export interface IncentiveTier {
  level: string;
  minScore: number;
  benefits: {
    discountPercentage: number;
    priorityAccess: boolean;
    exclusiveFeatures: string[];
    supportLevel: 'standard' | 'priority' | 'premium' | 'enterprise';
    monthlyCredits: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  institutionName: string;
  score: number;
  contributions: number;
  achievements: number;
  trend: 'up' | 'down' | 'stable';
  weeklyChange: number;
}

export class EconomicIncentivesEngine {
  private readonly SCORING_WEIGHTS = {
    fraudReports: 0.3,
    riskSignals: 0.25,
    verifiedIntel: 0.2,
    qualityScore: 0.15,
    timelinessScore: 0.1
  };

  private readonly INCENTIVE_TIERS: IncentiveTier[] = [
    {
      level: 'bronze',
      minScore: 0,
      benefits: {
        discountPercentage: 5,
        priorityAccess: false,
        exclusiveFeatures: ['basic_analytics'],
        supportLevel: 'standard',
        monthlyCredits: 100
      }
    },
    {
      level: 'silver',
      minScore: 1000,
      benefits: {
        discountPercentage: 10,
        priorityAccess: true,
        exclusiveFeatures: ['basic_analytics', 'advanced_reporting'],
        supportLevel: 'priority',
        monthlyCredits: 250
      }
    },
    {
      level: 'gold',
      minScore: 5000,
      benefits: {
        discountPercentage: 20,
        priorityAccess: true,
        exclusiveFeatures: ['basic_analytics', 'advanced_reporting', 'predictive_insights'],
        supportLevel: 'premium',
        monthlyCredits: 500
      }
    },
    {
      level: 'platinum',
      minScore: 15000,
      benefits: {
        discountPercentage: 35,
        priorityAccess: true,
        exclusiveFeatures: ['basic_analytics', 'advanced_reporting', 'predictive_insights', 'custom_models'],
        supportLevel: 'premium',
        monthlyCredits: 1000
      }
    },
    {
      level: 'diamond',
      minScore: 50000,
      benefits: {
        discountPercentage: 50,
        priorityAccess: true,
        exclusiveFeatures: ['basic_analytics', 'advanced_reporting', 'predictive_insights', 'custom_models', 'early_access'],
        supportLevel: 'enterprise',
        monthlyCredits: 2500
      }
    }
  ];

  private readonly ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
    {
      id: 'first_contribution',
      name: 'First Blood',
      description: 'Submit your first fraud/risk intelligence',
      icon: '🎯',
      category: 'volume',
      rarity: 'common',
      points: 50
    },
    {
      id: 'quality_expert',
      name: 'Quality Expert',
      description: 'Maintain 95%+ verification rate for 30 days',
      icon: '⭐',
      category: 'quality',
      rarity: 'rare',
      points: 200
    },
    {
      id: 'rapid_responder',
      name: 'Rapid Responder',
      description: 'Submit intelligence within 1 hour of detection',
      icon: '⚡',
      category: 'timeliness',
      rarity: 'rare',
      points: 150
    },
    {
      id: 'impact_player',
      name: 'Impact Player',
      description: 'Your intelligence prevented 10+ fraud incidents',
      icon: '🛡️',
      category: 'impact',
      rarity: 'epic',
      points: 500
    },
    {
      id: 'consistency_king',
      name: 'Consistency King',
      description: 'Submit quality intelligence for 90 consecutive days',
      icon: '👑',
      category: 'consistency',
      rarity: 'legendary',
      points: 1000
    },
    {
      id: 'innovation_pioneer',
      name: 'Innovation Pioneer',
      description: 'Contribute unique fraud pattern not seen before',
      icon: '💡',
      category: 'innovation',
      rarity: 'epic',
      points: 750
    }
  ];

  async calculateContributionScore(userId: string): Promise<ContributionScore> {
    // Fetch user's contributions from database
    const contributions = await db.riskExchangeContribution.findMany({
      where: { userId },
      include: { verifications: true }
    });

    const fraudReports = contributions.filter(c => c.type === 'fraud_report').length;
    const riskSignals = contributions.filter(c => c.type === 'risk_signal').length;
    const verifiedIntel = contributions.filter(c => c.verifications.some(v => v.status === 'verified')).length;

    // Calculate quality score (verification rate)
    const qualityScore = contributions.length > 0 
      ? (verifiedIntel / contributions.length) * 100 
      : 0;

    // Calculate timeliness score (average submission time)
    const timelinessScores = contributions.map(c => {
      const timeDiff = new Date(c.createdAt).getTime() - new Date(c.detectedAt).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      return Math.max(0, 100 - (hoursDiff * 2)); // Lose 2 points per hour
    });
    const timelinessScore = timelinessScores.length > 0 
      ? timelinessScores.reduce((a, b) => a + b, 0) / timelinessScores.length 
      : 0;

    // Calculate impact score (based on prevented incidents)
    const impactScore = contributions.reduce((total, c) => {
      return total + (c.impactScore || 0);
    }, 0);

    // Calculate weighted total score
    const totalScore = Math.round(
      (fraudReports * this.SCORING_WEIGHTS.fraudReports * 10) +
      (riskSignals * this.SCORING_WEIGHTS.riskSignals * 8) +
      (verifiedIntel * this.SCORING_WEIGHTS.verifiedIntel * 15) +
      (qualityScore * this.SCORING_WEIGHTS.qualityScore * 5) +
      (timelinessScore * this.SCORING_WEIGHTS.timelinessScore * 3) +
      (impactScore * this.SCORING_WEIGHTS.impactScore * 2)
    );

    // Determine level based on score
    const level = this.getLevelFromScore(totalScore);

    // Check for new achievements
    const achievements = await this.checkAndUnlockAchievements(userId, {
      fraudReports,
      riskSignals,
      verifiedIntel,
      qualityScore,
      timelinessScore,
      impactScore,
      totalContributions: contributions.length
    });

    // Calculate earnings and credits
    const totalEarnings = totalScore * 0.1; // $0.10 per point
    const availableCredits = Math.floor(totalScore * 0.05); // 1 credit per 20 points

    const contributionScore: ContributionScore = {
      userId,
      institutionId: contributions[0]?.institutionId || '',
      score: totalScore,
      level,
      contributions: {
        fraudReports,
        riskSignals,
        verifiedIntel,
        qualityScore: Math.round(qualityScore),
        timelinessScore: Math.round(timelinessScore),
        impactScore
      },
      achievements,
      totalEarnings,
      availableCredits,
      lastUpdated: new Date()
    };

    // Update user's score in database
    await this.updateUserScore(userId, contributionScore);

    return contributionScore;
  }

  private getLevelFromScore(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
    if (score >= 50000) return 'diamond';
    if (score >= 15000) return 'platinum';
    if (score >= 5000) return 'gold';
    if (score >= 1000) return 'silver';
    return 'bronze';
  }

  private async checkAndUnlockAchievements(userId: string, metrics: any): Promise<Achievement[]> {
    const existingAchievements = await db.userAchievement.findMany({
      where: { userId }
    });

    const existingIds = existingAchievements.map(a => a.achievementId);
    const newAchievements: Achievement[] = [];

    for (const achievement of this.ACHIEVEMENTS) {
      if (existingIds.includes(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.id) {
        case 'first_contribution':
          shouldUnlock = metrics.totalContributions >= 1;
          break;
        case 'quality_expert':
          shouldUnlock = metrics.qualityScore >= 95;
          break;
        case 'rapid_responder':
          shouldUnlock = metrics.timelinessScore >= 90;
          break;
        case 'impact_player':
          shouldUnlock = metrics.impactScore >= 10;
          break;
        case 'consistency_king':
          // Check for 90 consecutive days (simplified for demo)
          shouldUnlock = metrics.totalContributions >= 90;
          break;
        case 'innovation_pioneer':
          // Check for unique patterns (simplified)
          shouldUnlock = metrics.verifiedIntel >= 5;
          break;
      }

      if (shouldUnlock) {
        const newAchievement: Achievement = {
          ...achievement,
          unlockedAt: new Date()
        };
        newAchievements.push(newAchievement);

        // Save to database
        await db.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            unlockedAt: new Date()
          }
        });
      }
    }

    return newAchievements;
  }

  private async updateUserScore(userId: string, score: ContributionScore) {
    await db.contributionScore.upsert({
      where: { userId },
      update: {
        score: score.score,
        level: score.level,
        contributions: score.contributions,
        totalEarnings: score.totalEarnings,
        availableCredits: score.availableCredits,
        lastUpdated: score.lastUpdated
      },
      create: {
        userId,
        institutionId: score.institutionId,
        score: score.score,
        level: score.level,
        contributions: score.contributions,
        totalEarnings: score.totalEarnings,
        availableCredits: score.availableCredits,
        lastUpdated: score.lastUpdated
      }
    });
  }

  async getLeaderboard(limit: number = 10, timeframe: 'weekly' | 'monthly' | 'alltime' = 'alltime'): Promise<LeaderboardEntry[]> {
    const whereClause: any = {};
    
    if (timeframe === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      whereClause.lastUpdated = { gte: weekAgo };
    } else if (timeframe === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      whereClause.lastUpdated = { gte: monthAgo };
    }

    const scores = await db.contributionScore.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            institution: true
          }
        }
      },
      orderBy: { score: 'desc' },
      take: limit
    });

    return scores.map((score, index) => ({
      rank: index + 1,
      userId: score.userId,
      institutionName: score.user.institution?.name || 'Unknown',
      score: score.score,
      contributions: score.contributions.fraudReports + score.contributions.riskSignals + score.contributions.verifiedIntel,
      achievements: score.achievements?.length || 0,
      trend: 'stable', // Would calculate based on historical data
      weeklyChange: 0 // Would calculate based on previous period
    }));
  }

  async getUserBenefits(userId: string): Promise<IncentiveTier | null> {
    const userScore = await db.contributionScore.findUnique({
      where: { userId }
    });

    if (!userScore) return null;

    const tier = this.INCENTIVE_TIERS.find(t => userScore.score >= t.minScore);
    return tier || this.INCENTIVE_TIERS[0]; // Default to bronze
  }

  async applyCredits(userId: string, amount: number): Promise<boolean> {
    const userScore = await db.contributionScore.findUnique({
      where: { userId }
    });

    if (!userScore || userScore.availableCredits < amount) {
      return false;
    }

    await db.contributionScore.update({
      where: { userId },
      data: {
        availableCredits: {
          decrement: amount
        },
        lastUpdated: new Date()
      }
    });

    return true;
  }

  async processContributionReward(userId: string, contributionId: string, verificationStatus: 'verified' | 'rejected'): Promise<void> {
    if (verificationStatus === 'verified') {
      // Award points for verified contribution
      await this.calculateContributionScore(userId);

      // Send notification
      await db.notification.create({
        data: {
          userId,
          type: 'contribution_verified',
          title: 'Contribution Verified!',
          message: 'Your risk intelligence has been verified and points have been awarded.',
          metadata: {
            contributionId,
            pointsAwarded: 50 // Base points for verification
          }
        }
      });
    }
  }

  getIncentiveTiers(): IncentiveTier[] {
    return this.INCENTIVE_TIERS;
  }

  getAvailableAchievements(): Omit<Achievement, 'unlockedAt'>[] {
    return this.ACHIEVEMENTS;
  }
}