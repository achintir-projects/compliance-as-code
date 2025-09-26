'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Network, 
  TrendingUp, 
  Award, 
  Trophy, 
  Star, 
  Shield, 
  DollarSign, 
  Users,
  Target,
  Zap,
  Crown,
  Medal,
  Gift,
  CreditCard
} from 'lucide-react';

interface IncentiveTier {
  level: string;
  minScore: number;
  benefits: {
    discountPercentage: number;
    priorityAccess: boolean;
    exclusiveFeatures: string[];
    supportLevel: string;
    monthlyCredits: number;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  points: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  institutionName: string;
  score: number;
  contributions: number;
  achievements: number;
  trend: string;
  weeklyChange: number;
}

interface UserScore {
  userId: string;
  score: number;
  level: string;
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
}

export function EnhancedFederatedRiskExchange() {
  const [userScore, setUserScore] = useState<UserScore | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [incentiveTiers, setIncentiveTiers] = useState<IncentiveTier[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('alltime');
  const [isLoading, setIsLoading] = useState(false);

  const demoUserId = 'demo-user-123';

  useEffect(() => {
    loadIncentivesData();
    loadUserScore();
    loadLeaderboard();
  }, [activeTimeframe]);

  const loadIncentivesData = async () => {
    try {
      const response = await fetch('/api/risk-exchange/incentives/score');
      const data = await response.json();
      
      if (data.success) {
        setIncentiveTiers(data.tiers);
        setAchievements(data.achievements);
      }
    } catch (error) {
      console.error('Error loading incentives data:', error);
    }
  };

  const loadUserScore = async () => {
    try {
      const response = await fetch('/api/risk-exchange/incentives/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: demoUserId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUserScore(data.score);
      }
    } catch (error) {
      console.error('Error loading user score:', error);
    }
  };

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/risk-exchange/incentives/leaderboard?timeframe=${activeTimeframe}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'text-amber-600 bg-amber-50';
      case 'silver': return 'text-gray-600 bg-gray-50';
      case 'gold': return 'text-yellow-600 bg-yellow-50';
      case 'platinum': return 'text-blue-600 bg-blue-50';
      case 'diamond': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="h-4 w-4" />;
      case 'silver': return <Medal className="h-4 w-4" />;
      case 'gold': return <Trophy className="h-4 w-4" />;
      case 'platinum': return <Star className="h-4 w-4" />;
      case 'diamond': return <Crown className="h-4 w-4" />;
      default: return <Medal className="h-4 w-4" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold">#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Economic Incentives Engine</span>
            <Badge variant="secondary">Network Effect</Badge>
          </CardTitle>
          <CardDescription>
            Build a self-sustaining ecosystem where banks earn rewards for contributing fraud/risk intelligence
          </CardDescription>
        </CardHeader>
      </Card>

      {userScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Contribution Profile</span>
              <Badge className={getLevelColor(userScore.level)}>
                {getLevelIcon(userScore.level)}
                <span className="ml-1 capitalize">{userScore.level}</span>
              </Badge>
            </CardTitle>
            <CardDescription>
              Track your impact and rewards in the Global Federated Risk Exchange
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{userScore.score.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total Points</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">${userScore.totalEarnings.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Total Earnings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">{userScore.availableCredits}</div>
                      <div className="text-xs text-muted-foreground">Available Credits</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <div>
                      <div className="text-2xl font-bold">{userScore.achievements.length}</div>
                      <div className="text-xs text-muted-foreground">Achievements</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Contribution Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fraud Reports</span>
                    <span className="text-sm font-medium">{userScore.contributions.fraudReports}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Risk Signals</span>
                    <span className="text-sm font-medium">{userScore.contributions.riskSignals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Verified Intelligence</span>
                    <span className="text-sm font-medium">{userScore.contributions.verifiedIntel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quality Score</span>
                    <span className="text-sm font-medium">{userScore.contributions.qualityScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Timeliness Score</span>
                    <span className="text-sm font-medium">{userScore.contributions.timelinessScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Impact Score</span>
                    <span className="text-sm font-medium">{userScore.contributions.impactScore}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Recent Achievements</h4>
                <div className="space-y-2">
                  {userScore.achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-2 p-2 bg-muted rounded">
                      <span className="text-lg">{achievement.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      </div>
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                  ))}
                  {userScore.achievements.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No achievements yet. Start contributing to unlock rewards!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="tiers">Incentive Tiers</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Global Leaderboard</span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={activeTimeframe === 'weekly' ? 'default' : 'outline'}
                    onClick={() => setActiveTimeframe('weekly')}
                  >
                    Weekly
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTimeframe === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setActiveTimeframe('monthly')}
                  >
                    Monthly
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTimeframe === 'alltime' ? 'default' : 'outline'}
                    onClick={() => setActiveTimeframe('alltime')}
                  >
                    All Time
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Top contributors in the Global Federated Risk Exchange
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading leaderboard...</div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div key={entry.userId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div>
                          <div className="font-medium">{entry.institutionName}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.contributions} contributions • {entry.achievements} achievements
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{entry.score.toLocaleString()} pts</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.trend === 'up' ? '📈' : entry.trend === 'down' ? '📉' : '➡️'} {entry.weeklyChange}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers">
          <Card>
            <CardHeader>
              <CardTitle>Incentive Tiers</CardTitle>
              <CardDescription>
                Unlock greater benefits as you contribute more to the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {incentiveTiers.map((tier) => (
                  <Card key={tier.level} className="border-l-4 border-l-transparent">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{tier.level}</span>
                        <Badge variant="outline">{tier.minScore.toLocaleString()}+ points</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium">Discount</div>
                          <div className="text-lg font-bold text-green-600">{tier.benefits.discountPercentage}%</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Monthly Credits</div>
                          <div className="text-lg font-bold text-purple-600">{tier.benefits.monthlyCredits}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Exclusive Features</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tier.benefits.exclusiveFeatures.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Support Level</div>
                        <Badge variant="outline" className="capitalize">{tier.benefits.supportLevel}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Achievement System</CardTitle>
              <CardDescription>
                Unlock achievements and earn bonus points for your contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <div className="font-medium">{achievement.name}</div>
                        <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                          <Badge variant="outline">{achievement.category}</Badge>
                          <span className="text-sm text-muted-foreground">+{achievement.points} pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert>
        <AlertDescription>
          <strong>Impact:</strong> Builds a "NATO for fraud defense" → every bank has reason to share. 
          The economic incentives create a self-sustaining ecosystem where institutions are rewarded 
          for contributing high-quality fraud and risk intelligence, creating powerful network effects.
        </AlertDescription>
      </Alert>
    </div>
  );
}