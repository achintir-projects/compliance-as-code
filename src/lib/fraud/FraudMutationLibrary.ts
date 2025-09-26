import { db } from '@/lib/db';

export interface FraudTestCase {
  id: string;
  name: string;
  description: string;
  category: FraudCategory;
  input: any;
  expectedOutput: any;
  mutationType: MutationType;
  severity: FraudSeverity;
  confidence: number;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface FraudMutationPattern {
  id: string;
  name: string;
  description: string;
  category: FraudCategory;
  mutationType: MutationType;
  pattern: any;
  parameters: any;
  effectiveness: number;
  detectionRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MutationResult {
  originalCase: FraudTestCase;
  mutatedCase: FraudTestCase;
  mutationApplied: string;
  confidenceChange: number;
  detectionStatus: 'DETECTED' | 'MISSED' | 'PARTIAL';
  executionTime: number;
  agentResponse: any;
}

export enum FraudCategory {
  TRANSACTION_FRAUD = 'TRANSACTION_FRAUD',
  IDENTITY_FRAUD = 'IDENTITY_FRAUD',
  ACCOUNT_TAKEOVER = 'ACCOUNT_TAKEOVER',
  PAYMENT_FRAUD = 'PAYMENT_FRAUD',
  INSURANCE_FRAUD = 'INSURANCE_FRAUD',
  MONEY_LAUNDERING = 'MONEY_LAUNDERING',
  CREDIT_CARD_FRAUD = 'CREDIT_CARD_FRAUD',
  SYNTHETIC_IDENTITY = 'SYNTHETIC_IDENTITY'
}

export enum MutationType {
  AMOUNT_MANIPULATION = 'AMOUNT_MANIPULATION',
  TIMING_VARIATION = 'TIMING_VARIATION',
  GEOGRAPHIC_SPOOFING = 'GEOGRAPHIC_SPOOFING',
  BEHAVIORAL_PERTURBATION = 'BEHAVIORAL_PERTURBATION',
  DATA_OBSCURATION = 'DATA_OBSCURATION',
  STRUCTURE_MODIFICATION = 'STRUCTURE_MODIFICATION',
  FEATURE_ENGINEERING = 'FEATURE_ENGINEERING',
  ADVERSARIAL_NOISE = 'ADVERSARIAL_NOISE',
  CROSS_DOMAIN_TRANSFER = 'CROSS_DOMAIN_TRANSFER',
  ZERO_DAY_ATTACK = 'ZERO_DAY_ATTACK'
}

export enum FraudSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class FraudMutationLibrary {
  private static instance: FraudMutationLibrary;
  private mutationPatterns: Map<string, FraudMutationPattern> = new Map();

  private constructor() {
    this.initializeDefaultPatterns();
  }

  static getInstance(): FraudMutationLibrary {
    if (!FraudMutationLibrary.instance) {
      FraudMutationLibrary.instance = new FraudMutationLibrary();
    }
    return FraudMutationLibrary.instance;
  }

  /**
   * Initialize default mutation patterns
   */
  private initializeDefaultPatterns() {
    const defaultPatterns: FraudMutationPattern[] = [
      {
        id: 'amount_threshold_bypass',
        name: 'Amount Threshold Bypass',
        description: 'Modify transaction amounts to stay just below detection thresholds',
        category: FraudCategory.TRANSACTION_FRAUD,
        mutationType: MutationType.AMOUNT_MANIPULATION,
        pattern: {
          operation: 'subtract_small_amount',
          threshold: 10000,
          variance: 0.05,
          currency: 'USD'
        },
        parameters: {
          thresholdRange: [5000, 50000],
          varianceRange: [0.01, 0.15]
        },
        effectiveness: 0.85,
        detectionRate: 0.35,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'timing_smoothing',
        name: 'Timing Smoothing Attack',
        description: 'Distribute transactions over time to avoid frequency-based detection',
        category: FraudCategory.TRANSACTION_FRAUD,
        mutationType: MutationType.TIMING_VARIATION,
        pattern: {
          operation: 'distribute_over_time',
          window: 3600000, // 1 hour
          interval: 300000, // 5 minutes
          maxTransactions: 10
        },
        parameters: {
          windowRange: [1800000, 7200000], // 30 min to 2 hours
          intervalRange: [60000, 600000] // 1 min to 10 min
        },
        effectiveness: 0.78,
        detectionRate: 0.42,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'geographic_spoofing',
        name: 'Geographic Location Spoofing',
        description: 'Modify geographic coordinates to appear from legitimate locations',
        category: FraudCategory.ACCOUNT_TAKEOVER,
        mutationType: MutationType.GEOGRAPHIC_SPOOFING,
        pattern: {
          operation: 'coordinate_offset',
          maxDistance: 50000, // 50km
          useProxies: true,
          rotateLocations: true
        },
        parameters: {
          distanceRange: [10000, 100000], // 10km to 100km
          proxyTypes: ['VPN', 'TOR', 'RESIDENTIAL_PROXY']
        },
        effectiveness: 0.72,
        detectionRate: 0.38,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'behavioral_perturbation',
        name: 'Behavioral Pattern Perturbation',
        description: 'Subtly modify user behavior patterns to avoid anomaly detection',
        category: FraudCategory.IDENTITY_FRAUD,
        mutationType: MutationType.BEHAVIORAL_PERTURBATION,
        pattern: {
          operation: 'perturb_features',
          features: ['login_frequency', 'session_duration', 'navigation_pattern'],
          perturbationStrength: 0.15,
          preserveCorrelations: true
        },
        parameters: {
          strengthRange: [0.05, 0.3],
          featureCategories: ['temporal', 'spatial', 'interaction']
        },
        effectiveness: 0.81,
        detectionRate: 0.29,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'data_obfuscation',
        name: 'Data Obfuscation Layer',
        description: 'Add noise or modify data fields to obscure fraudulent patterns',
        category: FraudCategory.PAYMENT_FRAUD,
        mutationType: MutationType.DATA_OBSCURATION,
        pattern: {
          operation: 'add_noise',
          targetFields: ['merchant_category', 'device_id', 'ip_address'],
          noiseType: 'gaussian',
          noiseLevel: 0.1
        },
        parameters: {
          noiseTypes: ['gaussian', 'uniform', 'laplacian'],
          fieldCategories: ['identifiers', 'behavioral', 'contextual']
        },
        effectiveness: 0.76,
        detectionRate: 0.45,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'structure_modification',
        name: 'Transaction Structure Modification',
        description: 'Change transaction structure to break pattern recognition',
        category: FraudCategory.MONEY_LAUNDERING,
        mutationType: MutationType.STRUCTURE_MODIFICATION,
        pattern: {
          operation: 'split_transactions',
          maxSplits: 5,
          minAmount: 100,
          randomizeOrder: true
        },
        parameters: {
          splitRange: [2, 10],
          amountThresholds: [50, 1000]
        },
        effectiveness: 0.89,
        detectionRate: 0.31,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'feature_engineering',
        name: 'Adversarial Feature Engineering',
        description: 'Engineer features to specifically counter known detection models',
        category: FraudCategory.CREDIT_CARD_FRAUD,
        mutationType: MutationType.FEATURE_ENGINEERING,
        pattern: {
          operation: 'optimize_features',
          targetModel: 'random_forest',
          optimizationGoal: 'minimize_detection_probability',
          featureWeights: {
            amount_importance: 0.3,
            timing_importance: 0.25,
            location_importance: 0.2,
            behavioral_importance: 0.25
          }
        },
        parameters: {
          modelTypes: ['random_forest', 'neural_network', 'gradient_boosting'],
          optimizationStrategies: ['gradient_descent', 'genetic_algorithm', 'simulated_annealing']
        },
        effectiveness: 0.83,
        detectionRate: 0.27,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'adversarial_noise',
        name: 'Adversarial Noise Injection',
        description: 'Inject carefully crafted noise to mislead ML models',
        category: FraudCategory.SYNTHETIC_IDENTITY,
        mutationType: MutationType.ADVERSARIAL_NOISE,
        pattern: {
          operation: 'fgsm_attack',
          epsilon: 0.1,
          norm_type: 'l2',
          targeted: true,
          targetClass: 'legitimate'
        },
        parameters: {
          epsilonRange: [0.01, 0.5],
          normTypes: ['l1', 'l2', 'linf'],
          attackTypes: ['fgsm', 'pgd', 'cw']
        },
        effectiveness: 0.79,
        detectionRate: 0.33,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cross_domain_transfer',
        name: 'Cross-Domain Pattern Transfer',
        description: 'Apply fraud patterns from one domain to another',
        category: FraudCategory.INSURANCE_FRAUD,
        mutationType: MutationType.CROSS_DOMAIN_TRANSFER,
        pattern: {
          operation: 'transfer_pattern',
          sourceDomain: 'retail_fraud',
          targetDomain: 'insurance_claims',
          adaptationMethod: 'feature_mapping',
          preserveCoreCharacteristics: true
        },
        parameters: {
          domainPairs: [
            ['retail_fraud', 'insurance_claims'],
            ['credit_card_fraud', 'loan_fraud'],
            ['account_takeover', 'identity_theft']
          ],
          adaptationMethods: ['feature_mapping', 'pattern_embedding', 'knowledge_transfer']
        },
        effectiveness: 0.74,
        detectionRate: 0.41,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'zero_day_simulation',
        name: 'Zero-Day Attack Simulation',
        description: 'Simulate novel attack patterns not seen in training data',
        category: FraudCategory.ACCOUNT_TAKEOVER,
        mutationType: MutationType.ZERO_DAY_ATTACK,
        pattern: {
          operation: 'generate_novel_pattern',
          noveltyThreshold: 0.8,
          complexityLevel: 'high',
          useGenerativeModel: true
        },
        parameters: {
          noveltyRange: [0.6, 1.0],
          complexityLevels: ['low', 'medium', 'high'],
          generationMethods: ['rule_based', 'ml_generated', 'hybrid']
        },
        effectiveness: 0.68,
        detectionRate: 0.19,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultPatterns.forEach(pattern => {
      this.mutationPatterns.set(pattern.id, pattern);
    });
  }

  /**
   * Get all mutation patterns
   */
  getMutationPatterns(): FraudMutationPattern[] {
    return Array.from(this.mutationPatterns.values()).filter(p => p.isActive);
  }

  /**
   * Get mutation patterns by category
   */
  getPatternsByCategory(category: FraudCategory): FraudMutationPattern[] {
    return Array.from(this.mutationPatterns.values())
      .filter(p => p.category === category && p.isActive);
  }

  /**
   * Get mutation patterns by type
   */
  getPatternsByType(type: MutationType): FraudMutationPattern[] {
    return Array.from(this.mutationPatterns.values())
      .filter(p => p.mutationType === type && p.isActive);
  }

  /**
   * Apply mutation to a test case
   */
  async applyMutation(
    testCase: FraudTestCase,
    patternId: string,
    parameters?: any
  ): Promise<MutationResult> {
    const pattern = this.mutationPatterns.get(patternId);
    if (!pattern) {
      throw new Error(`Mutation pattern ${patternId} not found`);
    }

    const startTime = Date.now();
    
    // Create mutated test case
    const mutatedCase = this.mutateTestCase(testCase, pattern, parameters);
    
    // Execute the mutated case against fraud detection agents
    const agentResponse = await this.executeAgainstAgents(mutatedCase);
    
    const executionTime = Date.now() - startTime;
    
    // Determine detection status
    const detectionStatus = this.determineDetectionStatus(agentResponse, mutatedCase);
    
    // Calculate confidence change
    const confidenceChange = this.calculateConfidenceChange(testCase, mutatedCase, agentResponse);

    return {
      originalCase: testCase,
      mutatedCase,
      mutationApplied: pattern.name,
      confidenceChange,
      detectionStatus,
      executionTime,
      agentResponse
    };
  }

  /**
   * Apply multiple mutations to a test case
   */
  async applyMultipleMutations(
    testCase: FraudTestCase,
    patternIds: string[],
    parameters?: any[]
  ): Promise<MutationResult[]> {
    const results: MutationResult[] = [];
    let currentCase = testCase;

    for (let i = 0; i < patternIds.length; i++) {
      const patternId = patternIds[i];
      const param = parameters?.[i];
      
      const result = await this.applyMutation(currentCase, patternId, param);
      results.push(result);
      currentCase = result.mutatedCase;
    }

    return results;
  }

  /**
   * Generate adversarial test cases for a specific fraud category
   */
  async generateAdversarialTestCases(
    baseCase: FraudTestCase,
    category: FraudCategory,
    count: number = 10
  ): Promise<FraudTestCase[]> {
    const patterns = this.getPatternsByCategory(category);
    const testCases: FraudTestCase[] = [];

    for (let i = 0; i < count; i++) {
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      const result = await this.applyMutation(baseCase, pattern.id);
      testCases.push(result.mutatedCase);
    }

    return testCases;
  }

  /**
   * Run comprehensive adversarial testing campaign
   */
  async runAdversarialTestingCampaign(
    testCases: FraudTestCase[],
    targetAgents: string[] = ['fraud_detection', 'aml_compliance', 'kyc_verification']
  ): Promise<{
    totalTests: number;
    detectionRate: number;
    evasionRate: number;
    averageConfidenceChange: number;
    resultsByCategory: Record<string, any>;
    resultsByPattern: Record<string, any>;
    weakPoints: string[];
  }> {
    const allResults: MutationResult[] = [];
    const resultsByCategory: Record<string, any> = {};
    const resultsByPattern: Record<string, any> = {};

    // Test each case against all relevant patterns
    for (const testCase of testCases) {
      const patterns = this.getPatternsByCategory(testCase.category);
      
      for (const pattern of patterns) {
        try {
          const result = await this.applyMutation(testCase, pattern.id);
          allResults.push(result);

          // Aggregate by category
          if (!resultsByCategory[testCase.category]) {
            resultsByCategory[testCase.category] = [];
          }
          resultsByCategory[testCase.category].push(result);

          // Aggregate by pattern
          if (!resultsByPattern[pattern.id]) {
            resultsByPattern[pattern.id] = [];
          }
          resultsByPattern[pattern.id].push(result);
        } catch (error) {
          console.error(`Error applying mutation ${pattern.id} to test case ${testCase.id}:`, error);
        }
      }
    }

    // Calculate metrics
    const totalTests = allResults.length;
    const detectedCount = allResults.filter(r => r.detectionStatus === 'DETECTED').length;
    const missedCount = allResults.filter(r => r.detectionStatus === 'MISSED').length;
    
    const detectionRate = totalTests > 0 ? detectedCount / totalTests : 0;
    const evasionRate = totalTests > 0 ? missedCount / totalTests : 0;
    
    const avgConfidenceChange = totalTests > 0 
      ? allResults.reduce((sum, r) => sum + r.confidenceChange, 0) / totalTests 
      : 0;

    // Identify weak points (patterns with high evasion rates)
    const weakPoints: string[] = [];
    for (const [patternId, results] of Object.entries(resultsByPattern)) {
      const pattern = this.mutationPatterns.get(patternId);
      if (pattern) {
        const evasionRateForPattern = results.filter(r => r.detectionStatus === 'MISSED').length / results.length;
        if (evasionRateForPattern > 0.6) { // 60% evasion rate threshold
          weakPoints.push(pattern.name);
        }
      }
    }

    return {
      totalTests,
      detectionRate,
      evasionRate,
      averageConfidenceChange: avgConfidenceChange,
      resultsByCategory,
      resultsByPattern,
      weakPoints
    };
  }

  /**
   * Mutate a test case using a specific pattern
   */
  private mutateTestCase(
    testCase: FraudTestCase,
    pattern: FraudMutationPattern,
    parameters?: any
  ): FraudTestCase {
    const mutatedInput = this.applyMutationPattern(testCase.input, pattern, parameters);
    
    return {
      ...testCase,
      id: `${testCase.id}_mutated_${Date.now()}`,
      name: `${testCase.name} (Mutated: ${pattern.name})`,
      description: `${testCase.description} - Mutated using ${pattern.name}`,
      input: mutatedInput,
      mutationType: pattern.mutationType,
      confidence: Math.max(0, testCase.confidence - 0.1), // Slightly reduce confidence
      metadata: {
        ...testCase.metadata,
        mutationInfo: {
          patternId: pattern.id,
          patternName: pattern.name,
          parameters: parameters || pattern.parameters,
          mutatedAt: new Date().toISOString()
        }
      },
      updatedAt: new Date()
    };
  }

  /**
   * Apply mutation pattern to input data
   */
  private applyMutationPattern(input: any, pattern: FraudMutationPattern, parameters?: any): any {
    const mutatedInput = JSON.parse(JSON.stringify(input)); // Deep clone
    const params = parameters || pattern.parameters;

    switch (pattern.mutationType) {
      case MutationType.AMOUNT_MANIPULATION:
        return this.applyAmountManipulation(mutatedInput, pattern.pattern, params);
      
      case MutationType.TIMING_VARIATION:
        return this.applyTimingVariation(mutatedInput, pattern.pattern, params);
      
      case MutationType.GEOGRAPHIC_SPOOFING:
        return this.applyGeographicSpoofing(mutatedInput, pattern.pattern, params);
      
      case MutationType.BEHAVIORAL_PERTURBATION:
        return this.applyBehavioralPerturbation(mutatedInput, pattern.pattern, params);
      
      case MutationType.DATA_OBSCURATION:
        return this.applyDataObfuscation(mutatedInput, pattern.pattern, params);
      
      case MutationType.STRUCTURE_MODIFICATION:
        return this.applyStructureModification(mutatedInput, pattern.pattern, params);
      
      case MutationType.FEATURE_ENGINEERING:
        return this.applyFeatureEngineering(mutatedInput, pattern.pattern, params);
      
      case MutationType.ADVERSARIAL_NOISE:
        return this.applyAdversarialNoise(mutatedInput, pattern.pattern, params);
      
      case MutationType.CROSS_DOMAIN_TRANSFER:
        return this.applyCrossDomainTransfer(mutatedInput, pattern.pattern, params);
      
      case MutationType.ZERO_DAY_ATTACK:
        return this.applyZeroDayAttack(mutatedInput, pattern.pattern, params);
      
      default:
        return mutatedInput;
    }
  }

  /**
   * Apply amount manipulation mutation
   */
  private applyAmountManipulation(input: any, pattern: any, params: any): any {
    if (input.amount && typeof input.amount === 'number') {
      const threshold = params.thresholdRange?.[0] || pattern.threshold;
      const variance = params.varianceRange?.[0] || pattern.variance;
      
      // Reduce amount to stay below threshold
      if (input.amount > threshold) {
        input.amount = threshold - (threshold * variance * Math.random());
      }
    }
    return input;
  }

  /**
   * Apply timing variation mutation
   */
  private applyTimingVariation(input: any, pattern: any, params: any): any {
    if (input.timestamp) {
      const window = params.windowRange?.[0] || pattern.window;
      const interval = params.intervalRange?.[0] || pattern.interval;
      
      // Distribute timestamp over a time window
      const baseTime = new Date(input.timestamp).getTime();
      const offset = Math.random() * window;
      input.timestamp = new Date(baseTime + offset).toISOString();
    }
    return input;
  }

  /**
   * Apply geographic spoofing mutation
   */
  private applyGeographicSpoofing(input: any, pattern: any, params: any): any {
    if (input.location) {
      const maxDistance = params.distanceRange?.[0] || pattern.maxDistance;
      
      // Add random offset to coordinates
      if (input.location.latitude && input.location.longitude) {
        const latOffset = (Math.random() - 0.5) * (maxDistance / 111000); // Convert to degrees
        const lonOffset = (Math.random() - 0.5) * (maxDistance / (111000 * Math.cos(input.location.latitude * Math.PI / 180)));
        
        input.location.latitude += latOffset;
        input.location.longitude += lonOffset;
      }
    }
    return input;
  }

  /**
   * Apply behavioral perturbation mutation
   */
  private applyBehavioralPerturbation(input: any, pattern: any, params: any): any {
    const strength = params.strengthRange?.[0] || pattern.perturbationStrength;
    const features = pattern.features;
    
    features.forEach((feature: string) => {
      if (input[feature] && typeof input[feature] === 'number') {
        const perturbation = (Math.random() - 0.5) * 2 * strength;
        input[feature] = Math.max(0, input[feature] * (1 + perturbation));
      }
    });
    
    return input;
  }

  /**
   * Apply data obfuscation mutation
   */
  private applyDataObfuscation(input: any, pattern: any, params: any): any {
    const noiseLevel = params.noiseLevel || pattern.noiseLevel;
    const targetFields = pattern.targetFields;
    
    targetFields.forEach((field: string) => {
      if (input[field]) {
        if (typeof input[field] === 'number') {
          const noise = (Math.random() - 0.5) * 2 * noiseLevel;
          input[field] = Math.max(0, input[field] * (1 + noise));
        } else if (typeof input[field] === 'string') {
          // Add random characters or modify slightly
          const chars = input[field].split('');
          const modifyCount = Math.floor(chars.length * noiseLevel);
          for (let i = 0; i < modifyCount; i++) {
            const pos = Math.floor(Math.random() * chars.length);
            chars[pos] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
          }
          input[field] = chars.join('');
        }
      }
    });
    
    return input;
  }

  /**
   * Apply structure modification mutation
   */
  private applyStructureModification(input: any, pattern: any, params: any): any {
    if (input.transactions && Array.isArray(input.transactions)) {
      const maxSplits = params.splitRange?.[1] || pattern.maxSplits;
      const numSplits = Math.floor(Math.random() * (maxSplits - 1)) + 2;
      
      // Split large transactions into smaller ones
      const newTransactions = [];
      for (const transaction of input.transactions) {
        if (transaction.amount > 1000) {
          const splitAmount = transaction.amount / numSplits;
          for (let i = 0; i < numSplits; i++) {
            newTransactions.push({
              ...transaction,
              amount: splitAmount,
              id: `${transaction.id}_split_${i}`,
              timestamp: new Date(new Date(transaction.timestamp).getTime() + i * 60000).toISOString()
            });
          }
        } else {
          newTransactions.push(transaction);
        }
      }
      input.transactions = newTransactions;
    }
    
    return input;
  }

  /**
   * Apply feature engineering mutation
   */
  private applyFeatureEngineering(input: any, pattern: any, params: any): any {
    const weights = pattern.featureWeights;
    
    // Optimize features based on weights
    Object.keys(weights).forEach((feature: string) => {
      const weight = weights[feature];
      if (input[feature] && typeof input[feature] === 'number') {
        // Adjust feature value to minimize detection probability
        const adjustment = (1 - weight) * 0.1;
        input[feature] = input[feature] * (1 + adjustment);
      }
    });
    
    return input;
  }

  /**
   * Apply adversarial noise mutation
   */
  private applyAdversarialNoise(input: any, pattern: any, params: any): any {
    const epsilon = params.epsilonRange?.[0] || pattern.epsilon;
    
    // Add adversarial noise to numerical features
    Object.keys(input).forEach(key => {
      if (typeof input[key] === 'number') {
        const noise = (Math.random() - 0.5) * 2 * epsilon;
        input[key] = input[key] * (1 + noise);
      }
    });
    
    return input;
  }

  /**
   * Apply cross-domain transfer mutation
   */
  private applyCrossDomainTransfer(input: any, pattern: any, params: any): any {
    // Map features from source domain to target domain
    const domainMapping: Record<string, any> = {
      'retail_fraud': {
        'amount': 'claim_amount',
        'merchant': 'service_provider',
        'timestamp': 'incident_date'
      },
      'credit_card_fraud': {
        'amount': 'loan_amount',
        'card_number': 'account_number',
        'merchant': 'lender'
      }
    };
    
    const mapping = domainMapping[pattern.sourceDomain] || {};
    
    // Apply feature mapping
    Object.keys(mapping).forEach(sourceKey => {
      const targetKey = mapping[sourceKey];
      if (input[sourceKey] && !input[targetKey]) {
        input[targetKey] = input[sourceKey];
        delete input[sourceKey];
      }
    });
    
    return input;
  }

  /**
   * Apply zero-day attack mutation
   */
  private applyZeroDayAttack(input: any, pattern: any, params: any): any {
    const noveltyThreshold = params.noveltyRange?.[0] || pattern.noveltyThreshold;
    
    // Generate novel patterns by combining existing features in new ways
    if (input.features && Array.isArray(input.features)) {
      const novelFeatures = [];
      for (let i = 0; i < input.features.length; i++) {
        for (let j = i + 1; j < input.features.length; j++) {
          // Create novel feature combinations
          novelFeatures.push({
            name: `novel_${input.features[i].name}_${input.features[j].name}`,
            value: input.features[i].value * input.features[j].value * noveltyThreshold,
            type: 'derived'
          });
        }
      }
      input.features = [...input.features, ...novelFeatures];
    }
    
    return input;
  }

  /**
   * Execute mutated test case against fraud detection agents
   */
  private async executeAgainstAgents(testCase: FraudTestCase): Promise<any> {
    // In a real implementation, this would call the actual fraud detection agents
    // For now, we'll simulate the response
    
    const baseDetectionScore = Math.random();
    const mutationComplexity = testCase.metadata?.mutationInfo ? 0.3 : 0;
    
    // Simulate agent response
    return {
      fraudScore: Math.max(0, Math.min(1, baseDetectionScore - mutationComplexity)),
      isFlagged: baseDetectionScore > 0.7,
      confidence: Math.random(),
      rulesTriggered: Math.random() > 0.5 ? ['rule_1', 'rule_3'] : [],
      agentId: 'fraud_detection_agent',
      processedAt: new Date().toISOString(),
      executionTime: Math.floor(Math.random() * 100) + 10
    };
  }

  /**
   * Determine detection status based on agent response
   */
  private determineDetectionStatus(agentResponse: any, testCase: FraudTestCase): 'DETECTED' | 'MISSED' | 'PARTIAL' {
    if (agentResponse.isFlagged && agentResponse.fraudScore > 0.7) {
      return 'DETECTED';
    } else if (agentResponse.fraudScore < 0.3) {
      return 'MISSED';
    } else {
      return 'PARTIAL';
    }
  }

  /**
   * Calculate confidence change between original and mutated case
   */
  private calculateConfidenceChange(
    originalCase: FraudTestCase,
    mutatedCase: FraudTestCase,
    agentResponse: any
  ): number {
    const originalConfidence = originalCase.confidence;
    const newConfidence = agentResponse.confidence || mutatedCase.confidence;
    
    return newConfidence - originalConfidence;
  }

  /**
   * Add custom mutation pattern
   */
  addMutationPattern(pattern: FraudMutationPattern): void {
    this.mutationPatterns.set(pattern.id, pattern);
  }

  /**
   * Update mutation pattern effectiveness based on test results
   */
  updatePatternEffectiveness(patternId: string, results: MutationResult[]): void {
    const pattern = this.mutationPatterns.get(patternId);
    if (!pattern) return;

    const detectedCount = results.filter(r => r.detectionStatus === 'DETECTED').length;
    const totalCount = results.length;
    
    pattern.detectionRate = totalCount > 0 ? detectedCount / totalCount : 0;
    pattern.effectiveness = 1 - pattern.detectionRate; // Effectiveness is inverse of detection rate
    pattern.updatedAt = new Date();
    
    this.mutationPatterns.set(patternId, pattern);
  }

  /**
   * Export mutation patterns to JSON
   */
  exportPatterns(): string {
    const patterns = Array.from(this.mutationPatterns.values());
    return JSON.stringify(patterns, null, 2);
  }

  /**
   * Import mutation patterns from JSON
   */
  importPatterns(jsonData: string): void {
    try {
      const patterns = JSON.parse(jsonData);
      patterns.forEach((pattern: FraudMutationPattern) => {
        this.mutationPatterns.set(pattern.id, pattern);
      });
    } catch (error) {
      throw new Error('Invalid JSON data for mutation patterns');
    }
  }
}