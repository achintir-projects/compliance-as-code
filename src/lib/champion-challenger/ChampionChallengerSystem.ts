import { ModelCard } from '@/lib/model-cards/ModelCardSystem';
import { DSLRule } from '@/lib/compliance/DSLCompiler';

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  championModelId: string;
  challengerModelId: string;
  status: 'setup' | 'running' | 'paused' | 'completed' | 'rolled_back';
  trafficSplit: {
    champion: number; // percentage (0-100)
    challenger: number; // percentage (0-100)
  };
  duration: {
    startDate: Date;
    endDate?: Date;
    estimatedDuration: string; // e.g., "7 days", "2 weeks"
  };
  successCriteria: {
    primaryMetric: string;
    targetImprovement: number; // percentage
    minimumSampleSize: number;
    confidenceLevel: number; // e.g., 0.95
  };
  rollbackConditions: {
    maxRegression: number; // percentage
    maxErrorRate: number; // percentage
    maxLatencyIncrease: number; // percentage
  };
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface ExperimentResult {
  experimentId: string;
  championMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    latency: number;
    errorRate: number;
    sampleSize: number;
  };
  challengerMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    latency: number;
    errorRate: number;
    sampleSize: number;
  };
  statisticalSignificance: {
    primaryMetric: string;
    pValue: number;
    confidence: number;
    significant: boolean;
    winner: 'champion' | 'challenger' | 'inconclusive';
  };
  recommendations: string[];
  completedAt: Date;
}

export interface RollbackPlan {
  experimentId: string;
  reason: string;
  rollbackType: 'immediate' | 'gradual' | 'scheduled';
  rollbackSteps: {
    step: number;
    action: string;
    estimatedTime: string;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  rollbackBy: string;
  rollbackAt: Date;
  completed: boolean;
  verificationSteps: string[];
}

export interface TrafficRouter {
  route(request: any): {
    modelId: string;
    modelVersion: string;
    reason: 'champion' | 'challenger' | 'fallback';
  };
  updateTrafficSplit(championPercentage: number, challengerPercentage: number): void;
  getCurrentSplit(): { champion: number; challenger: number };
}

export class ChampionChallengerSystem {
  private experiments: Map<string, ExperimentConfig> = new Map();
  private results: Map<string, ExperimentResult> = new Map();
  private rollbackPlans: Map<string, RollbackPlan> = new Map();
  private trafficRouter: TrafficRouter;
  private modelCards: Map<string, ModelCard> = new Map();

  constructor(trafficRouter: TrafficRouter) {
    this.trafficRouter = trafficRouter;
  }

  async createExperiment(config: {
    name: string;
    description: string;
    championModelId: string;
    challengerModelId: string;
    trafficSplit: { champion: number; challenger: number };
    estimatedDuration: string;
    successCriteria: {
      primaryMetric: string;
      targetImprovement: number;
      minimumSampleSize: number;
      confidenceLevel: number;
    };
    rollbackConditions: {
      maxRegression: number;
      maxErrorRate: number;
      maxLatencyIncrease: number;
    };
    createdBy: string;
  }): Promise<ExperimentConfig> {
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const experiment: ExperimentConfig = {
      id: experimentId,
      name: config.name,
      description: config.description,
      championModelId: config.championModelId,
      challengerModelId: config.challengerModelId,
      status: 'setup',
      trafficSplit: config.trafficSplit,
      duration: {
        startDate: new Date(),
        estimatedDuration: config.estimatedDuration
      },
      successCriteria: config.successCriteria,
      rollbackConditions: config.rollbackConditions,
      createdAt: new Date(),
      createdBy: config.createdBy,
      updatedAt: new Date()
    };

    // Validate models exist
    if (!this.modelCards.has(config.championModelId)) {
      throw new Error(`Champion model ${config.championModelId} not found`);
    }
    if (!this.modelCards.has(config.challengerModelId)) {
      throw new Error(`Challenger model ${config.challengerModelId} not found`);
    }

    // Validate traffic split
    if (config.trafficSplit.champion + config.trafficSplit.challenger !== 100) {
      throw new Error('Traffic split must sum to 100%');
    }

    this.experiments.set(experimentId, experiment);
    return experiment;
  }

  async startExperiment(experimentId: string): Promise<ExperimentConfig> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'setup') {
      throw new Error(`Experiment ${experimentId} is not in setup state`);
    }

    // Update traffic router
    this.trafficRouter.updateTrafficSplit(
      experiment.trafficSplit.champion,
      experiment.trafficSplit.challenger
    );

    // Update experiment status
    experiment.status = 'running';
    experiment.updatedAt = new Date();
    this.experiments.set(experimentId, experiment);

    return experiment;
  }

  async pauseExperiment(experimentId: string, reason: string): Promise<ExperimentConfig> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'running') {
      throw new Error(`Experiment ${experimentId} is not running`);
    }

    // Pause traffic routing (send all to champion)
    this.trafficRouter.updateTrafficSplit(100, 0);

    // Update experiment status
    experiment.status = 'paused';
    experiment.updatedAt = new Date();
    this.experiments.set(experimentId, experiment);

    return experiment;
  }

  async resumeExperiment(experimentId: string): Promise<ExperimentConfig> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'paused') {
      throw new Error(`Experiment ${experimentId} is not paused`);
    }

    // Restore traffic routing
    this.trafficRouter.updateTrafficSplit(
      experiment.trafficSplit.champion,
      experiment.trafficSplit.challenger
    );

    // Update experiment status
    experiment.status = 'running';
    experiment.updatedAt = new Date();
    this.experiments.set(experimentId, experiment);

    return experiment;
  }

  async adjustTrafficSplit(experimentId: string, newSplit: { champion: number; challenger: number }): Promise<ExperimentConfig> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'running') {
      throw new Error(`Experiment ${experimentId} is not running`);
    }

    if (newSplit.champion + newSplit.challenger !== 100) {
      throw new Error('Traffic split must sum to 100%');
    }

    // Update traffic router
    this.trafficRouter.updateTrafficSplit(newSplit.champion, newSplit.challenger);

    // Update experiment
    experiment.trafficSplit = newSplit;
    experiment.updatedAt = new Date();
    this.experiments.set(experimentId, experiment);

    return experiment;
  }

  async executeRollback(experimentId: string, options: {
    reason: string;
    rollbackType: 'immediate' | 'gradual' | 'scheduled';
    rollbackBy: string;
    scheduledTime?: Date;
  }): Promise<RollbackPlan> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const rollbackPlan: RollbackPlan = {
      experimentId,
      reason: options.reason,
      rollbackType: options.rollbackType,
      rollbackSteps: this.generateRollbackSteps(options.rollbackType),
      rollbackBy: options.rollbackBy,
      rollbackAt: options.scheduledTime || new Date(),
      completed: false,
      verificationSteps: [
        'Verify all traffic routed to champion model',
        'Check error rates return to baseline',
        'Confirm latency within acceptable range',
        'Validate accuracy metrics meet expectations'
      ]
    };

    this.rollbackPlans.set(experimentId, rollbackPlan);

    if (options.rollbackType === 'immediate') {
      await this.executeImmediateRollback(experimentId, rollbackPlan);
    }

    return rollbackPlan;
  }

  private async executeImmediateRollback(experimentId: string, rollbackPlan: RollbackPlan): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    // Step 1: Route all traffic to champion
    this.trafficRouter.updateTrafficSplit(100, 0);
    rollbackPlan.rollbackSteps[0].status = 'completed';

    // Step 2: Update experiment status
    experiment.status = 'rolled_back';
    experiment.updatedAt = new Date();
    this.experiments.set(experimentId, experiment);
    rollbackPlan.rollbackSteps[1].status = 'completed';

    // Step 3: Log rollback completion
    rollbackPlan.completed = true;
    rollbackPlan.rollbackSteps[2].status = 'completed';
    this.rollbackPlans.set(experimentId, rollbackPlan);
  }

  private generateRollbackSteps(rollbackType: 'immediate' | 'gradual' | 'scheduled'): RollbackPlan['rollbackSteps'] {
    if (rollbackType === 'immediate') {
      return [
        {
          step: 1,
          action: 'Route 100% traffic to champion model',
          estimatedTime: '< 1 minute',
          status: 'pending'
        },
        {
          step: 2,
          action: 'Update experiment status to rolled_back',
          estimatedTime: '< 1 minute',
          status: 'pending'
        },
        {
          step: 3,
          action: 'Log rollback completion and notify stakeholders',
          estimatedTime: '< 5 minutes',
          status: 'pending'
        }
      ];
    }

    if (rollbackType === 'gradual') {
      return [
        {
          step: 1,
          action: 'Reduce challenger traffic to 25%',
          estimatedTime: '1 hour',
          status: 'pending'
        },
        {
          step: 2,
          action: 'Monitor metrics for 1 hour',
          estimatedTime: '1 hour',
          status: 'pending'
        },
        {
          step: 3,
          action: 'Reduce challenger traffic to 10%',
          estimatedTime: '30 minutes',
          status: 'pending'
        },
        {
          step: 4,
          action: 'Monitor metrics for 1 hour',
          estimatedTime: '1 hour',
          status: 'pending'
        },
        {
          step: 5,
          action: 'Route 100% traffic to champion model',
          estimatedTime: '30 minutes',
          status: 'pending'
        },
        {
          step: 6,
          action: 'Update experiment status to rolled_back',
          estimatedTime: '< 1 minute',
          status: 'pending'
        }
      ];
    }

    // Scheduled rollback
    return [
      {
        step: 1,
        action: 'Schedule rollback for specified time',
        estimatedTime: '< 1 minute',
        status: 'pending'
      },
      {
        step: 2,
        action: 'Notify stakeholders of scheduled rollback',
        estimatedTime: '< 5 minutes',
        status: 'pending'
      },
      {
        step: 3,
        action: 'Execute rollback at scheduled time',
        estimatedTime: '< 1 minute',
        status: 'pending'
      },
      {
        step: 4,
        action: 'Update experiment status to rolled_back',
        estimatedTime: '< 1 minute',
        status: 'pending'
      }
    ];
  }

  async checkRollbackConditions(experimentId: string, currentMetrics: {
    championErrorRate: number;
    challengerErrorRate: number;
    championLatency: number;
    challengerLatency: number;
    championAccuracy: number;
    challengerAccuracy: number;
  }): Promise<{
    shouldRollback: boolean;
    reasons: string[];
    severity: 'low' | 'medium' | 'high';
  }> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return { shouldRollback: false, reasons: [], severity: 'low' };
    }

    const reasons: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Check error rate regression
    const errorRateRegression = ((currentMetrics.challengerErrorRate - currentMetrics.championErrorRate) / currentMetrics.championErrorRate) * 100;
    if (errorRateRegression > experiment.rollbackConditions.maxErrorRate) {
      reasons.push(`Challenger error rate ${errorRateRegression.toFixed(1)}% higher than champion`);
      severity = errorRateRegression > experiment.rollbackConditions.maxErrorRate * 2 ? 'high' : 'medium';
    }

    // Check latency increase
    const latencyIncrease = ((currentMetrics.challengerLatency - currentMetrics.championLatency) / currentMetrics.championLatency) * 100;
    if (latencyIncrease > experiment.rollbackConditions.maxLatencyIncrease) {
      reasons.push(`Challenger latency ${latencyIncrease.toFixed(1)}% higher than champion`);
      if (severity === 'low') severity = 'medium';
    }

    // Check accuracy regression
    const accuracyRegression = ((currentMetrics.championAccuracy - currentMetrics.challengerAccuracy) / currentMetrics.championAccuracy) * 100;
    if (accuracyRegression > experiment.rollbackConditions.maxRegression) {
      reasons.push(`Challenger accuracy ${accuracyRegression.toFixed(1)}% lower than champion`);
      severity = 'high';
    }

    // Check for critical errors
    if (currentMetrics.challengerErrorRate > 10) { // 10% error rate threshold
      reasons.push('Challenger error rate exceeds critical threshold');
      severity = 'high';
    }

    return {
      shouldRollback: reasons.length > 0,
      reasons,
      severity
    };
  }

  async completeExperiment(experimentId: string, results: ExperimentResult): Promise<ExperimentConfig> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'running') {
      throw new Error(`Experiment ${experimentId} is not running`);
    }

    // Store results
    this.results.set(experimentId, results);

    // Update experiment status
    experiment.status = 'completed';
    experiment.duration.endDate = new Date();
    experiment.updatedAt = new Date();
    this.experiments.set(experimentId, experiment);

    // Route all traffic back to champion
    this.trafficRouter.updateTrafficSplit(100, 0);

    return experiment;
  }

  async promoteChallenger(experimentId: string, promoteTo: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'completed') {
      throw new Error(`Experiment ${experimentId} must be completed before promotion`);
    }

    const results = this.results.get(experimentId);
    if (!results) {
      throw new Error(`No results found for experiment ${experimentId}`);
    }

    if (results.statisticalSignificance.winner !== 'challenger') {
      throw new Error(`Challenger did not win the experiment. Winner: ${results.statisticalSignificance.winner}`);
    }

    // Update model cards to reflect promotion
    const challengerModel = this.modelCards.get(experiment.challengerModelId);
    const championModel = this.modelCards.get(experiment.championModelId);

    if (challengerModel && championModel) {
      // Update challenger to be the new champion
      challengerModel.status = 'active';
      challengerModel.deployment.environment = promoteTo as any;
      
      // Deprecate old champion
      championModel.status = 'deprecated';

      this.modelCards.set(experiment.challengerModelId, challengerModel);
      this.modelCards.set(experiment.championModelId, championModel);
    }

    // Log promotion
    console.log(`Challenger ${experiment.challengerModelId} promoted to ${promoteTo} replacing champion ${experiment.championModelId}`);
  }

  getExperiment(experimentId: string): ExperimentConfig | undefined {
    return this.experiments.get(experimentId);
  }

  getAllExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values());
  }

  getExperimentsByStatus(status: ExperimentConfig['status']): ExperimentConfig[] {
    return Array.from(this.experiments.values()).filter(exp => exp.status === status);
  }

  getExperimentResults(experimentId: string): ExperimentResult | undefined {
    return this.results.get(experimentId);
  }

  getRollbackPlan(experimentId: string): RollbackPlan | undefined {
    return this.rollbackPlans.get(experimentId);
  }

  getActiveExperiments(): ExperimentConfig[] {
    return this.getExperimentsByStatus('running');
  }

  getExperimentSummary(): {
    total: number;
    running: number;
    completed: number;
    rolledBack: number;
    paused: number;
  } {
    const all = Array.from(this.experiments.values());
    return {
      total: all.length,
      running: all.filter(exp => exp.status === 'running').length,
      completed: all.filter(exp => exp.status === 'completed').length,
      rolledBack: all.filter(exp => exp.status === 'rolled_back').length,
      paused: all.filter(exp => exp.status === 'paused').length
    };
  }

  // Helper method to calculate statistical significance
  calculateStatisticalSignificance(
    championMetric: number,
    challengerMetric: number,
    championSampleSize: number,
    challengerSampleSize: number,
    confidenceLevel: number = 0.95
  ): {
    pValue: number;
    confidence: number;
    significant: boolean;
    winner: 'champion' | 'challenger' | 'inconclusive';
  } {
    // Simplified statistical significance calculation
    // In practice, you would use proper statistical tests like t-test or z-test
    
    const improvement = ((challengerMetric - championMetric) / championMetric) * 100;
    const pooledStandardError = Math.sqrt(
      (championMetric * (1 - championMetric) / championSampleSize) +
      (challengerMetric * (1 - challengerMetric) / challengerSampleSize)
    );
    
    const zScore = improvement / 100 / pooledStandardError;
    const pValue = 2 * (1 - this.cumulativeNormalDistribution(Math.abs(zScore)));
    
    const significant = pValue < (1 - confidenceLevel);
    
    let winner: 'champion' | 'challenger' | 'inconclusive' = 'inconclusive';
    if (significant) {
      winner = improvement > 0 ? 'challenger' : 'champion';
    }
    
    return {
      pValue,
      confidence: confidenceLevel,
      significant,
      winner
    };
  }

  private cumulativeNormalDistribution(z: number): number {
    // Approximation of cumulative normal distribution
    return 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));
  }

  // Set model cards for reference
  setModelCards(modelCards: Map<string, ModelCard>): void {
    this.modelCards = modelCards;
  }

  // Export experiment data
  exportExperimentData(experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    const results = this.results.get(experimentId);
    const rollbackPlan = this.rollbackPlans.get(experimentId);

    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    return JSON.stringify({
      experiment,
      results,
      rollbackPlan,
      exportedAt: new Date()
    }, null, 2);
  }

  // Import experiment data
  importExperimentData(jsonData: string): void {
    const data = JSON.parse(jsonData);
    
    if (data.experiment) {
      this.experiments.set(data.experiment.id, data.experiment);
    }
    
    if (data.results) {
      this.results.set(data.results.experimentId, data.results);
    }
    
    if (data.rollbackPlan) {
      this.rollbackPlans.set(data.rollbackPlan.experimentId, data.rollbackPlan);
    }
  }
}

// Default traffic router implementation
export class DefaultTrafficRouter implements TrafficRouter {
  private championPercentage: number = 100;
  private challengerPercentage: number = 0;

  route(request: any): { modelId: string; modelVersion: string; reason: 'champion' | 'challenger' | 'fallback' } {
    const random = Math.random() * 100;
    
    if (random < this.championPercentage) {
      return {
        modelId: 'champion_model',
        modelVersion: 'v1.0',
        reason: 'champion'
      };
    } else if (random < this.championPercentage + this.challengerPercentage) {
      return {
        modelId: 'challenger_model',
        modelVersion: 'v2.0',
        reason: 'challenger'
      };
    } else {
      // Fallback to champion
      return {
        modelId: 'champion_model',
        modelVersion: 'v1.0',
        reason: 'fallback'
      };
    }
  }

  updateTrafficSplit(championPercentage: number, challengerPercentage: number): void {
    this.championPercentage = championPercentage;
    this.challengerPercentage = challengerPercentage;
  }

  getCurrentSplit(): { champion: number; challenger: number } {
    return {
      champion: this.championPercentage,
      challenger: this.challengerPercentage
    };
  }
}