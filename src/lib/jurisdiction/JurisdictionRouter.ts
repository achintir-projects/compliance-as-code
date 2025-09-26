import { db } from '@/lib/db';

export interface JurisdictionRule {
  id: string;
  jurisdiction: string;
  residencyRegion?: string;
  regulationType: string;
  priority: number; // Higher number = higher priority
  conditions: JurisdictionCondition[];
  actions: JurisdictionAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JurisdictionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte';
  value: any;
}

export interface JurisdictionAction {
  type: 'allow' | 'deny' | 'modify' | 'redirect' | 'require_approval';
  parameters?: Record<string, any>;
}

export interface RoutingContext {
  tenantId: string;
  jurisdiction: string;
  residencyRegion?: string;
  transactionType?: string;
  amount?: number;
  currency?: string;
  customerType?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface RoutingDecision {
  allowed: boolean;
  jurisdiction: string;
  ruleset: string;
  confidence: number;
  reasoning: string[];
  actions: JurisdictionAction[];
  fallbackRules?: string[];
}

export interface JurisdictionConfig {
  defaultJurisdiction: string;
  fallbackJurisdiction: string;
  enableGeoIP: boolean;
  enableResidencyDetection: boolean;
  cacheTTL: number; // in seconds
  logDecisions: boolean;
}

export class JurisdictionRouter {
  private static readonly DEFAULT_CONFIG: JurisdictionConfig = {
    defaultJurisdiction: 'US',
    fallbackJurisdiction: 'Global',
    enableGeoIP: true,
    enableResidencyDetection: true,
    cacheTTL: 3600, // 1 hour
    logDecisions: true
  };

  private config: JurisdictionConfig;
  private cache: Map<string, { decision: RoutingDecision; timestamp: number }> = new Map();
  private rules: Map<string, JurisdictionRule[]> = new Map();

  constructor(config?: Partial<JurisdictionConfig>) {
    this.config = { ...JurisdictionRouter.DEFAULT_CONFIG, ...config };
    this.initializeDefaultRules();
  }

  /**
   * Route a request to the appropriate jurisdiction ruleset
   */
  async route(context: RoutingContext): Promise<RoutingDecision> {
    // Check cache first
    const cacheKey = this.generateCacheKey(context);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL * 1000) {
      return cached.decision;
    }

    // Determine target jurisdiction
    const targetJurisdiction = await this.determineTargetJurisdiction(context);
    
    // Get applicable rules
    const applicableRules = await this.getApplicableRules(targetJurisdiction, context);
    
    // Evaluate rules and make decision
    const decision = await this.makeDecision(applicableRules, context, targetJurisdiction);
    
    // Cache the decision
    if (this.config.cacheTTL > 0) {
      this.cache.set(cacheKey, {
        decision,
        timestamp: Date.now()
      });
    }

    // Log the decision if enabled
    if (this.config.logDecisions) {
      await this.logRoutingDecision(context, decision);
    }

    return decision;
  }

  /**
   * Determine the target jurisdiction based on context
   */
  private async determineTargetJurisdiction(context: RoutingContext): Promise<string> {
    // Start with explicitly provided jurisdiction
    if (context.jurisdiction && context.jurisdiction !== 'auto') {
      return context.jurisdiction;
    }

    // Try to detect jurisdiction from residency region
    if (context.residencyRegion && this.config.enableResidencyDetection) {
      const jurisdictionFromRegion = await this.getJurisdictionFromRegion(context.residencyRegion);
      if (jurisdictionFromRegion) {
        return jurisdictionFromRegion;
      }
    }

    // Try to detect from IP address if enabled
    if (this.config.enableGeoIP && context.metadata?.ipAddress) {
      const jurisdictionFromIP = await this.getJurisdictionFromIP(context.metadata.ipAddress);
      if (jurisdictionFromIP) {
        return jurisdictionFromIP;
      }
    }

    // Try to detect from tenant configuration
    const tenantJurisdiction = await this.getTenantJurisdiction(context.tenantId);
    if (tenantJurisdiction) {
      return tenantJurisdiction;
    }

    // Fall back to default
    return this.config.defaultJurisdiction;
  }

  /**
   * Get applicable rules for a jurisdiction and context
   */
  private async getApplicableRules(jurisdiction: string, context: RoutingContext): Promise<JurisdictionRule[]> {
    // Get rules for the specific jurisdiction
    let rules = this.rules.get(jurisdiction) || [];
    
    // Add global rules if no specific rules found
    if (rules.length === 0) {
      rules = this.rules.get('Global') || [];
    }

    // Add fallback jurisdiction rules if still no rules
    if (rules.length === 0 && jurisdiction !== this.config.fallbackJurisdiction) {
      rules = this.rules.get(this.config.fallbackJurisdiction) || [];
    }

    // Filter rules based on conditions
    return rules.filter(rule => {
      if (!rule.isActive) return false;
      
      return rule.conditions.every(condition => 
        this.evaluateCondition(condition, context)
      );
    }).sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  /**
   * Evaluate a condition against the context
   */
  private evaluateCondition(condition: JurisdictionCondition, context: RoutingContext): boolean {
    const fieldValue = this.getNestedValue(context, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      
      case 'starts_with':
        return typeof fieldValue === 'string' && fieldValue.startsWith(condition.value);
      
      case 'ends_with':
        return typeof fieldValue === 'string' && fieldValue.endsWith(condition.value);
      
      case 'regex':
        return typeof fieldValue === 'string' && new RegExp(condition.value).test(fieldValue);
      
      case 'gt':
        return typeof fieldValue === 'number' && fieldValue > condition.value;
      
      case 'lt':
        return typeof fieldValue === 'number' && fieldValue < condition.value;
      
      case 'gte':
        return typeof fieldValue === 'number' && fieldValue >= condition.value;
      
      case 'lte':
        return typeof fieldValue === 'number' && fieldValue <= condition.value;
      
      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Make routing decision based on applicable rules
   */
  private async makeDecision(
    rules: JurisdictionRule[], 
    context: RoutingContext, 
    jurisdiction: string
  ): Promise<RoutingDecision> {
    const reasoning: string[] = [];
    const actions: JurisdictionAction[] = [];
    let allowed = true;
    let confidence = 1.0;
    let ruleset = jurisdiction;

    // Evaluate rules in priority order
    for (const rule of rules) {
      reasoning.push(`Evaluating rule ${rule.id} (priority: ${rule.priority})`);
      
      for (const action of rule.actions) {
        actions.push(action);
        
        switch (action.type) {
          case 'deny':
            allowed = false;
            reasoning.push(`Rule ${rule.id} denies the request`);
            confidence *= 0.8; // Reduce confidence for deny actions
            break;
          
          case 'allow':
            allowed = true;
            reasoning.push(`Rule ${rule.id} allows the request`);
            break;
          
          case 'modify':
            reasoning.push(`Rule ${rule.id} modifies the request`);
            // Modification logic would be implemented here
            break;
          
          case 'redirect':
            ruleset = action.parameters?.targetJurisdiction || jurisdiction;
            reasoning.push(`Rule ${rule.id} redirects to ${ruleset}`);
            confidence *= 0.9; // Slightly reduce confidence for redirects
            break;
          
          case 'require_approval':
            reasoning.push(`Rule ${rule.id} requires approval`);
            confidence *= 0.7; // Significant confidence reduction for approval requirements
            break;
        }
      }
    }

    // If no rules matched, use default behavior
    if (rules.length === 0) {
      reasoning.push('No specific rules found, using default behavior');
      allowed = true;
      confidence = 0.5; // Lower confidence for default behavior
    }

    return {
      allowed,
      jurisdiction,
      ruleset,
      confidence,
      reasoning,
      actions,
      fallbackRules: rules.length === 0 ? [this.config.fallbackJurisdiction] : undefined
    };
  }

  /**
   * Get jurisdiction from residency region
   */
  private async getJurisdictionFromRegion(region: string): Promise<string | null> {
    // Simple mapping - in production, this would be more sophisticated
    const regionToJurisdiction: Record<string, string> = {
      'North America': 'US',
      'Europe': 'EU',
      'United Kingdom': 'GB',
      'Middle East': 'AE',
      'Asia Pacific': 'SG',
      'Latin America': 'BR'
    };

    return regionToJurisdiction[region] || null;
  }

  /**
   * Get jurisdiction from IP address (placeholder implementation)
   */
  private async getJurisdictionFromIP(ipAddress: string): Promise<string | null> {
    // In production, this would use a GeoIP service
    // For now, return null to fall back to other methods
    return null;
  }

  /**
   * Get tenant's default jurisdiction
   */
  private async getTenantJurisdiction(tenantId: string): Promise<string | null> {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true }
    });

    return tenant?.config?.defaultJurisdiction || null;
  }

  /**
   * Generate cache key for routing decisions
   */
  private generateCacheKey(context: RoutingContext): string {
    const keyData = {
      tenantId: context.tenantId,
      jurisdiction: context.jurisdiction,
      residencyRegion: context.residencyRegion,
      transactionType: context.transactionType,
      amount: context.amount,
      currency: context.currency,
      customerType: context.customerType,
      riskLevel: context.riskLevel
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Log routing decision for audit purposes
   */
  private async logRoutingDecision(context: RoutingContext, decision: RoutingDecision): Promise<void> {
    // In production, this would log to your audit system
    console.log('Jurisdiction Routing Decision:', {
      timestamp: new Date().toISOString(),
      context,
      decision
    });
  }

  /**
   * Initialize default jurisdiction rules
   */
  private initializeDefaultRules(): void {
    // Global rules
    this.rules.set('Global', [
      {
        id: 'global-default-allow',
        jurisdiction: 'Global',
        regulationType: 'General',
        priority: 1,
        conditions: [],
        actions: [{ type: 'allow' }],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // US-specific rules
    this.rules.set('US', [
      {
        id: 'us-high-value-transaction',
        jurisdiction: 'US',
        regulationType: 'AML',
        priority: 10,
        conditions: [
          { field: 'amount', operator: 'gt', value: 10000 },
          { field: 'currency', operator: 'equals', value: 'USD' }
        ],
        actions: [
          { type: 'require_approval', parameters: { approvalType: 'compliance' } }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'us-crypto-transaction',
        jurisdiction: 'US',
        regulationType: 'SEC',
        priority: 8,
        conditions: [
          { field: 'transactionType', operator: 'contains', value: 'crypto' }
        ],
        actions: [
          { type: 'modify', parameters: { enhancedMonitoring: true } }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // EU-specific rules (GDPR)
    this.rules.set('EU', [
      {
        id: 'eu-data-privacy',
        jurisdiction: 'EU',
        regulationType: 'GDPR',
        priority: 15,
        conditions: [
          { field: 'customerType', operator: 'equals', value: 'individual' }
        ],
        actions: [
          { type: 'modify', parameters: { dataRetention: 'limited' } }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // UK-specific rules
    this.rules.set('GB', [
      {
        id: 'uk-fca-regulation',
        jurisdiction: 'GB',
        regulationType: 'FCA',
        priority: 12,
        conditions: [
          { field: 'transactionType', operator: 'contains', value: 'investment' }
        ],
        actions: [
          { type: 'require_approval', parameters: { approvalType: 'regulatory' } }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  }

  /**
   * Add a new jurisdiction rule
   */
  async addRule(rule: Omit<JurisdictionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<JurisdictionRule> {
    const newRule: JurisdictionRule = {
      ...rule,
      id: this.generateRuleId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const jurisdictionRules = this.rules.get(rule.jurisdiction) || [];
    jurisdictionRules.push(newRule);
    this.rules.set(rule.jurisdiction, jurisdictionRules);

    return newRule;
  }

  /**
   * Update an existing jurisdiction rule
   */
  async updateRule(ruleId: string, updates: Partial<JurisdictionRule>): Promise<JurisdictionRule | null> {
    for (const [jurisdiction, rules] of this.rules.entries()) {
      const ruleIndex = rules.findIndex(r => r.id === ruleId);
      if (ruleIndex !== -1) {
        rules[ruleIndex] = {
          ...rules[ruleIndex],
          ...updates,
          updatedAt: new Date()
        };
        return rules[ruleIndex];
      }
    }
    return null;
  }

  /**
   * Remove a jurisdiction rule
   */
  async removeRule(ruleId: string): Promise<boolean> {
    for (const [jurisdiction, rules] of this.rules.entries()) {
      const ruleIndex = rules.findIndex(r => r.id === ruleId);
      if (ruleIndex !== -1) {
        rules.splice(ruleIndex, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Get all rules for a jurisdiction
   */
  getRules(jurisdiction: string): JurisdictionRule[] {
    return this.rules.get(jurisdiction) || [];
  }

  /**
   * Clear the routing cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<JurisdictionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): JurisdictionConfig {
    return { ...this.config };
  }

  private generateRuleId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const jurisdictionRouter = new JurisdictionRouter();