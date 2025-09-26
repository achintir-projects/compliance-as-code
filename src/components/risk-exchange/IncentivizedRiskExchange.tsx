'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Network, 
  Plus, 
  Trophy, 
  Star, 
  Award, 
  TrendingUp, 
  Users, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Gift,
  Medal,
  Crown
} from 'lucide-react';

interface Contribution {
  id: string;
  signalType: string;
  confidence: number;
  points: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  verifications?: any[];
}

interface LeaderboardEntry {
  id: string;
  tenantId: string;
  tenant: { name: string; domain: string };
  totalPoints: number;
  contributions: number;
  badges: string[];
  rank: number;
}

interface TenantScore {
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

interface Incentives {
  availableCredits: number;
  activeDiscounts: any[];
  earnedBadges: string[];
  nextIncentive: {
    level: string;
    pointsNeeded: number;
    reward: string;
  };
}

export function IncentivizedRiskExchange() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tenantScore, setTenantScore] = useState<TenantScore | null>(null);
  const [incentives, setIncentives] = useState<Incentives | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch contributions
      const contributionsResponse = await fetch('/api/risk-exchange/contributions');
      const contributionsData = await contributionsResponse.json();
      if (contributionsData.success) {
        setContributions(contributionsData.contributions);
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch('/api/risk-exchange/contributions?action=leaderboard');
      const leaderboardData = await leaderboardResponse.json();
      if (leaderboardData.success) {
        setLeaderboard(leaderboardData.leaderboard);
      }

      // Fetch tenant score
      const scoreResponse = await fetch('/api/risk-exchange/contributions?action=score');
      const scoreData = await scoreResponse.json();
      if (scoreData.success) {
        setTenantScore(scoreData.score);
      }

      // Fetch incentives
      const incentivesResponse = await fetch('/api/risk-exchange/contributions?action=incentives');
      const incentivesData = await incentivesResponse.json();
      if (incentivesData.success) {
        setIncentives(incentivesData.incentives);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContribution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const contributionData = {
      signalType: formData.get('signalType'),
      signalData: JSON.parse(formData.get('signalData') as string),
      confidence: parseFloat(formData.get('confidence') as string),
      severity: formData.get('severity'),
      category: formData.get('category')
    };

    try {
      const response = await fetch('/api/risk-exchange/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contributionData)
      });

      const result = await response.json();
      if (result.success) {
        fetchData(); // Refresh data
        (event.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: 'secondary', icon: Clock },
      VERIFIED: { variant: 'default', icon: CheckCircle },
      REJECTED: { variant: 'destructive', icon: AlertTriangle }
    };

    const config = variants[status as keyof typeof variants] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getLevelIcon = (level: string) => {
    const icons = {
      'Diamond': <Crown className="w-4 h-4 text-yellow-500" />,
      'Platinum': <Medal className="w-4 h-4 text-gray-400" />,
      'Gold': <Trophy className="w-4 h-4 text-yellow-600" />,
      'Silver': <Medal className="w-4 h-4 text-gray-300" />,
      'Bronze': <Award className="w-4 h-4 text-orange-600" />,
      'Newcomer': <Star className="w-4 h-4 text-blue-500" />
    };

    return icons[level as keyof typeof icons] || icons.Newcomer;
  };

  const getProgressToNextLevel = (points: number, level: string) => {
    const thresholds = {
      'Newcomer': 100,
      'Bronze': 500,
      'Silver': 1000,
      'Gold': 2500,
      'Platinum': 5000,
      'Diamond': 10000
    };

    const current = thresholds[level as keyof typeof thresholds] || 0;
    const next = Object.values(thresholds).find(t => t > current) || 10000;
    return ((points - current) / (next - current)) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">
          <Network className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Federated Risk Exchange</h2>
          <p className="text-muted-foreground">
            Contribute fraud intelligence, earn rewards, and build a safer financial ecosystem
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Network Effect
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contribute">Contribute</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">My Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Points</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenantScore?.totalPoints || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Level: {tenantScore?.level || 'Newcomer'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Rank</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">#{tenantScore?.ranking.global || 999}</div>
                <p className="text-xs text-muted-foreground">
                  Global ranking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{incentives?.availableCredits || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Platform credits
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Badges</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenantScore?.badges.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Earned achievements
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress to Next Level */}
          {tenantScore && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getLevelIcon(tenantScore.level)}
                  Progress to Next Level
                </CardTitle>
                <CardDescription>
                  Earn more points to reach {incentives?.nextIncentive.level}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{tenantScore.level}</span>
                    <span>{incentives?.nextIncentive.level}</span>
                  </div>
                  <Progress 
                    value={getProgressToNextLevel(tenantScore.totalPoints, tenantScore.level)} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{tenantScore.totalPoints} points</span>
                    <span>{incentives?.nextIncentive.pointsNeeded} points needed</span>
                  </div>
                  <p className="text-sm text-center mt-2">
                    Reward: {incentives?.nextIncentive.reward}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Contributions */}
          <Card>
            <CardHeader>
              <CardTitle>My Recent Contributions</CardTitle>
              <CardDescription>
                Your latest contributions to the risk exchange
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.slice(0, 5).map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell className="font-medium">{contribution.signalType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={contribution.confidence * 100} className="w-16 h-2" />
                          <span className="text-sm">{(contribution.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">+{contribution.points}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(contribution.status)}</TableCell>
                      <TableCell>
                        {new Date(contribution.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contribute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Submit Risk Intelligence
              </CardTitle>
              <CardDescription>
                Share fraud signals, suspicious patterns, or risk insights with the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitContribution} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Signal Type</label>
                    <Select name="signalType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select signal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fraud">Fraud</SelectItem>
                        <SelectItem value="aml">AML Suspicious</SelectItem>
                        <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                        <SelectItem value="risk">Risk Pattern</SelectItem>
                        <SelectItem value="compliance">Compliance Issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <Select name="severity" defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Confidence Level (0-1)</label>
                  <Input 
                    type="number" 
                    name="confidence" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    defaultValue="0.8"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Signal Data (JSON)</label>
                  <Textarea 
                    name="signalData" 
                    placeholder='{"transaction_id": "tx123", "amount": 15000, "pattern": "structuring"}'
                    defaultValue='{"transaction_id": "example_tx_001", "amount": 15000, "pattern": "suspicious_structuring", "entities": ["account_A", "account_B"]}'
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select name="category" defaultValue="general">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="transaction">Transaction</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <div className="animate-spin mr-2">
                        <Network className="w-4 h-4" />
                      </div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Submit Contribution
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Global Leaderboard
              </CardTitle>
              <CardDescription>
                Top contributors in the federated risk exchange network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Top 3 Winners */}
                <div className="flex justify-center gap-4 pb-4">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <div key={entry.id} className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        <span className="text-2xl font-bold">#{entry.rank}</span>
                      </div>
                      <div className="font-medium">{entry.tenant.name}</div>
                      <div className="text-sm text-muted-foreground">{entry.totalPoints} pts</div>
                      <div className="text-xs text-muted-foreground">{entry.contributions} contributions</div>
                    </div>
                  ))}
                </div>

                {/* Full Leaderboard Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Contributions</TableHead>
                      <TableHead>Badges</TableHead>
                      <TableHead>Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.rank <= 3 && getLevelIcon(
                              entry.rank === 1 ? 'Diamond' :
                              entry.rank === 2 ? 'Platinum' : 'Gold'
                            )}
                            <span className="font-bold">#{entry.rank}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{entry.tenant.name}</TableCell>
                        <TableCell>{entry.totalPoints.toLocaleString()}</TableCell>
                        <TableCell>{entry.contributions}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {entry.badges.slice(0, 2).map((badge, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                            {entry.badges.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.badges.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tenantScore?.level || 'Newcomer'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Available Credits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Available Credits
                </CardTitle>
                <CardDescription>
                  Platform credits you can use for services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {incentives?.availableCredits || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Credits available
                  </p>
                  <Button className="w-full mt-4" variant="outline">
                    Use Credits
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Discounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Active Discounts
                </CardTitle>
                <CardDescription>
                  Subscription discounts you've earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incentives?.activeDiscounts?.length ? (
                  <div className="space-y-2">
                    {incentives.activeDiscounts.map((discount, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">{discount.description}</span>
                        <Badge variant="outline">{discount.value}% off</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    No active discounts
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Earned Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Earned Badges
              </CardTitle>
              <CardDescription>
                Achievements you've unlocked through contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tenantScore?.badges.map((badge, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-sm font-medium">{badge}</div>
                  </div>
                ))}
                {!tenantScore?.badges.length && (
                  <div className="col-span-full text-center text-muted-foreground">
                    Start contributing to earn badges!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}