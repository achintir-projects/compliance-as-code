import { AirtableService, KnowledgeObject } from '@/lib/airtable/AirtableService';
import { DSLCompiler, DSLRule, CompiledDSL } from '@/lib/compliance/DSLCompiler';
import { AutoSync } from './AutoSync';
import { db } from '@/lib/db';

export interface KnowledgeCoreConfig {
  autoSync: boolean;
  syncInterval: number; // in minutes
  autoDeployHighConfidence: boolean;
  requireHumanReview: boolean;
}

export interface KnowledgeVersion {
  id: string;
  version: string;
  knowledgeObjectId: string;
  changes: string[];
  createdAt: string;
  createdBy: string;
}

export interface RegulatorQuery {
  id: string;
  query: string;
  filters: {
    category?: string;
    confidence?: 'High' | 'Medium';
    status?: 'validated' | 'pending_review' | 'deployed';
    dateRange?: {
      start: string;
      end: string;
    };
  };
  result: {
    knowledgeObjects: KnowledgeObject[];
    dslRules: DSLRule[];
    decisionBundles: any[];
    total: number;
  };
  timestamp: string;
}

export class KnowledgeCore {
  private airtableService: AirtableService;
  private dslCompiler: DSLCompiler;
  private autoSync: AutoSync;
  private config: KnowledgeCoreConfig;
  private syncInterval?: NodeJS.Timeout;

  constructor(config: Partial<KnowledgeCoreConfig> = {}) {
    this.airtableService = new AirtableService();
    this.dslCompiler = new DSLCompiler();
    this.autoSync = new AutoSync(this);
    this.config = {
      autoSync: true,
      syncInterval: 60, // 1 hour
      autoDeployHighConfidence: true,
      requireHumanReview: true,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    console.log('Initializing AURA Knowledge Core...');
    
    // Initial sync
    await this.syncKnowledge();
    
    // Set up periodic sync if enabled
    if (this.config.autoSync) {
      console.log(`Starting auto-sync every ${this.config.syncInterval} minutes`);
      await this.autoSync.startAutoSync(this.config.syncInterval);
    }
    
    console.log('AURA Knowledge Core initialized successfully');
  }

  async syncKnowledge(): Promise<{
    success: boolean;
    message: string;
    processed: number;
    compiled: number;
    deployed: number;
  }> {
    try {
      console.log('Starting knowledge synchronization...');
      
      // Step 1: Fetch and normalize Airtable data
      const syncResult = await this.airtableService.syncAirtableData();
      
      if (!syncResult.success) {
        throw new Error(syncResult.message);
      }
      
      // Step 2: Get knowledge objects
      const knowledgeObjects = await this.airtableService.getKnowledgeObjects();
      
      // Step 3: Compile DSL rules
      let compiledCount = 0;
      let deployedCount = 0;
      
      for (const ko of knowledgeObjects) {
        if (ko.status === 'validated' || ko.status === 'deployed') {
          const compiled = await this.dslCompiler.compileKnowledgeObject(ko);
          
          if (compiled.validation.valid) {
            compiledCount++;
            
            // Auto-deploy high confidence rules if enabled
            if (this.config.autoDeployHighConfidence && ko.confidence === 'High') {
              await this.deployKnowledgeObject(ko.id);
              deployedCount++;
            }
          }
        }
      }
      
      console.log(`Knowledge sync completed: ${syncResult.processed} processed, ${compiledCount} compiled, ${deployedCount} deployed`);
      
      return {
        success: true,
        message: 'Knowledge synchronized successfully',
        processed: syncResult.processed,
        compiled: compiledCount,
        deployed: deployedCount,
      };
    } catch (error) {
      console.error('Error syncing knowledge:', error);
      return {
        success: false,
        message: `Error syncing knowledge: ${error.message}`,
        processed: 0,
        compiled: 0,
        deployed: 0,
      };
    }
  }

  stopPeriodicSync(): void {
    // This method is kept for backward compatibility
    this.autoSync.stopAutoSync();
  }

  async deployKnowledgeObject(knowledgeObjectId: string): Promise<boolean> {
    try {
      // Update knowledge object status
      const success = await this.airtableService.deployKnowledgeObject(knowledgeObjectId);
      
      if (success) {
        // Create version record
        await this.createVersionRecord(knowledgeObjectId, 'deployed', 'System auto-deployment');
        
        console.log(`Knowledge object ${knowledgeObjectId} deployed successfully`);
      }
      
      return success;
    } catch (error) {
      console.error(`Error deploying knowledge object ${knowledgeObjectId}:`, error);
      return false;
    }
  }

  async createVersionRecord(
    knowledgeObjectId: string,
    action: string,
    changes: string[],
    createdBy: string = 'system'
  ): Promise<KnowledgeVersion> {
    const version = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: `v${Date.now()}`,
      knowledgeObjectId,
      changes: Array.isArray(changes) ? changes : [changes],
      createdAt: new Date().toISOString(),
      createdBy,
    };

    // Store version in database (simplified - would need proper versioning table)
    console.log(`Version record created: ${version.id} for ${knowledgeObjectId}`);
    
    return version;
  }

  async getKnowledgeObjects(filters?: {
    confidence?: 'High' | 'Medium';
    category?: string;
    status?: 'validated' | 'pending_review' | 'deployed';
  }): Promise<KnowledgeObject[]> {
    return this.airtableService.getKnowledgeObjects(filters);
  }

  async getPendingReviewObjects(): Promise<KnowledgeObject[]> {
    return this.airtableService.getPendingReviewObjects();
  }

  async getDeployedRules(): Promise<KnowledgeObject[]> {
    return this.airtableService.getDeployedRules();
  }

  async executeComplianceCheck(
    context: any,
    category?: string
  ): Promise<{
    triggered: boolean;
    actions: string[];
    decisionBundle: any;
    knowledgeObjects: KnowledgeObject[];
  }> {
    const deployedRules = await this.getDeployedRules();
    const relevantRules = category 
      ? deployedRules.filter(rule => rule.category === category)
      : deployedRules;

    const actions: string[] = [];
    const triggeredKnowledgeObjects: KnowledgeObject[] = [];
    let decisionBundle: any = null;

    for (const ko of relevantRules) {
      try {
        const compiled = await this.dslCompiler.compileKnowledgeObject(ko);
        
        if (compiled.validation.valid) {
          const result = await this.dslCompiler.executeDSLRule(compiled.rule, context);
          
          if (result.triggered) {
            actions.push(...result.actions);
            triggeredKnowledgeObjects.push(ko);
            
            // Create decision bundle
            decisionBundle = await this.createDecisionBundle(
              compiled.rule,
              context,
              result.output,
              ko
            );
          }
        }
      } catch (error) {
        console.error(`Error executing rule for ${ko.id}:`, error);
      }
    }

    return {
      triggered: actions.length > 0,
      actions,
      decisionBundle,
      knowledgeObjects: triggeredKnowledgeObjects,
    };
  }

  private async createDecisionBundle(
    rule: DSLRule,
    input: any,
    output: any,
    knowledgeObject: KnowledgeObject
  ): Promise<any> {
    const inputHash = await this.generateHash(input);
    const outputHash = await this.generateHash(output);

    const decisionBundle = {
      id: `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executionId: `exec_${Date.now()}`,
      agentId: 'knowledge-core',
      knowledgeObjectId: knowledgeObject.id,
      timestamp: new Date().toISOString(),
      inputHash,
      outputHash,
      input,
      output,
      explainability: {
        ruleName: rule.name,
        ruleDescription: rule.description,
        knowledgeObjectId: knowledgeObject.id,
        airtableId: knowledgeObject.airtableId,
        confidence: knowledgeObject.confidence,
      },
      modelInfo: {
        type: 'DSL_RULE',
        version: '1.0',
        category: knowledgeObject.category,
      },
      compliance: {
        status: 'COMPLIANT',
        ruleId: rule.id,
        knowledgeObjectId: knowledgeObject.id,
        verified: true,
      },
      signature: {
        algorithm: 'SHA-256',
        hash: outputHash,
        timestamp: new Date().toISOString(),
      },
      tenantId: 'system',
    };

    // Store decision bundle in database
    try {
      await db.decisionBundle.create({
        data: {
          id: decisionBundle.id,
          executionId: decisionBundle.executionId,
          agentId: decisionBundle.agentId,
          knowledgeObjectId: decisionBundle.knowledgeObjectId,
          timestamp: new Date(decisionBundle.timestamp),
          inputHash: decisionBundle.inputHash,
          outputHash: decisionBundle.outputHash,
          input: decisionBundle.input,
          output: decisionBundle.output,
          explainability: decisionBundle.explainability,
          modelInfo: decisionBundle.modelInfo,
          compliance: decisionBundle.compliance,
          signature: decisionBundle.signature,
          tenantId: decisionBundle.tenantId,
        },
      });
    } catch (error) {
      console.error('Error storing decision bundle:', error);
    }

    return decisionBundle;
  }

  private async generateHash(data: any): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async regulatorQuery(query: string, filters?: RegulatorQuery['filters']): Promise<RegulatorQuery> {
    const knowledgeObjects = await this.getKnowledgeObjects(filters);
    
    // Get DSL rules for knowledge objects
    const dslRules: DSLRule[] = [];
    for (const ko of knowledgeObjects) {
      try {
        const compiled = await this.dslCompiler.compileKnowledgeObject(ko);
        if (compiled.validation.valid) {
          dslRules.push(compiled.rule);
        }
      } catch (error) {
        console.error(`Error compiling rule for ${ko.id}:`, error);
      }
    }

    // Get decision bundles (simplified - would need proper filtering)
    const decisionBundles = await db.decisionBundle.findMany({
      where: {
        knowledgeObjectId: {
          in: knowledgeObjects.map(ko => ko.id),
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit results
    });

    const regulatorQuery: RegulatorQuery = {
      id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      filters: filters || {},
      result: {
        knowledgeObjects,
        dslRules,
        decisionBundles,
        total: knowledgeObjects.length,
      },
      timestamp: new Date().toISOString(),
    };

    // Log regulator query for audit
    console.log(`Regulator query executed: ${regulatorQuery.id}`);

    return regulatorQuery;
  }

  async getKnowledgeStatistics(): Promise<{
    totalObjects: number;
    highConfidence: number;
    mediumConfidence: number;
    deployed: number;
    pendingReview: number;
    byCategory: Record<string, number>;
  }> {
    const allObjects = await this.getKnowledgeObjects();
    
    const stats = {
      totalObjects: allObjects.length,
      highConfidence: 0,
      mediumConfidence: 0,
      deployed: 0,
      pendingReview: 0,
      byCategory: {} as Record<string, number>,
    };

    for (const obj of allObjects) {
      // Count by confidence
      if (obj.confidence === 'High') stats.highConfidence++;
      else if (obj.confidence === 'Medium') stats.mediumConfidence++;
      
      // Count by status
      if (obj.status === 'deployed') stats.deployed++;
      else if (obj.status === 'pending_review') stats.pendingReview++;
      
      // Count by category
      stats.byCategory[obj.category] = (stats.byCategory[obj.category] || 0) + 1;
    }

    return stats;
  }

  async humanReviewDecision(
    knowledgeObjectId: string,
    decision: 'approve' | 'reject' | 'request_changes',
    comments?: string
  ): Promise<boolean> {
    try {
      if (decision === 'approve') {
        await this.deployKnowledgeObject(knowledgeObjectId);
        await this.createVersionRecord(
          knowledgeObjectId,
          'approved',
          [`Human review approved: ${comments || 'No comments'}`],
          'human-reviewer'
        );
      } else if (decision === 'reject') {
        // Update status to rejected (would need rejected status in enum)
        console.log(`Knowledge object ${knowledgeObjectId} rejected: ${comments}`);
      } else if (decision === 'request_changes') {
        // Update status to pending changes
        console.log(`Changes requested for ${knowledgeObjectId}: ${comments}`);
      }

      return true;
    } catch (error) {
      console.error(`Error in human review decision for ${knowledgeObjectId}:`, error);
      return false;
    }
  }

  getDSLDocumentation(): string {
    return this.dslCompiler.generateDSLDocumentation();
  }

  async shutdown(): Promise<void> {
    this.autoSync.stopAutoSync();
    console.log('AURA Knowledge Core shutdown complete');
  }

  // Public methods for auto-sync management
  getAutoSyncStatus() {
    return this.autoSync.getSyncStatus();
  }

  async startAutoSync(intervalMinutes?: number): Promise<void> {
    await this.autoSync.startAutoSync(intervalMinutes || this.config.syncInterval);
  }

  stopAutoSync(): void {
    this.autoSync.stopAutoSync();
  }
}