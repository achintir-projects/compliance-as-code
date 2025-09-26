import { db } from '@/lib/db';
import { KnowledgeObject, DecisionBundle } from '@/lib/airtable/AirtableService';

export interface ModelCard {
  id: string;
  agentId: string;
  agentName: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'deprecated' | 'archived' | 'development';
  
  // Model Information
  modelDetails: {
    name: string;
    description: string;
    version: string;
    architecture: string;
    framework: string;
    trainingDate: Date;
    modelSize: string; // e.g., "1.2GB", "500MB"
    parameters: number;
    computeRequirements: {
      cpu: string;
      memory: string;
      gpu?: string;
      inferenceTime: string; // e.g., "<100ms"
    };
  };
  
  // Intended Use
  scope: {
    intendedUse: string;
    primaryUseCases: string[];
    outOfScopeUses: string[];
    targetUsers: string[];
    complianceDomains: ('AML' | 'KYC' | 'Fraud' | 'Sanctions' | 'Risk' | 'Compliance')[];
    jurisdictions: string[];
  };
  
  // Training Data
  trainingData: {
    datasets: {
      name: string;
      description: string;
      size: number; // number of records
      timePeriod: string;
      source: string;
      dataQuality: number; // 0-1 score
    }[];
    dataPreprocessing: string[];
    dataBias: {
      identifiedBiases: string[];
      mitigationStrategies: string[];
      biasMetrics: {
        metric: string;
        value: number;
        threshold: number;
        status: 'pass' | 'fail' | 'warning';
      }[];
    };
    dataPrivacy: {
      piiHandling: string;
      anonymizationTechniques: string[];
      complianceStandards: ('GDPR' | 'CCPA' | 'HIPAA' | 'SOC2')[];
    };
  };
  
  // Performance Metrics
  metrics: {
    accuracy: {
      value: number;
      threshold: number;
      testDataset: string;
      confidence: number;
    };
    precision: {
      value: number;
      threshold: number;
      testDataset: string;
      confidence: number;
    };
    recall: {
      value: number;
      threshold: number;
      testDataset: string;
      confidence: number;
    };
    f1Score: {
      value: number;
      threshold: number;
      testDataset: string;
      confidence: number;
    };
    fairness: {
      demographicParity: number;
      equalOpportunity: number;
      equalizedOdds: number;
      testDataset: string;
    };
    robustness: {
      adversarialTestScore: number;
      noiseTolerance: number;
      edgeCaseHandling: number;
    };
    customMetrics: {
      name: string;
      value: number;
      threshold: number;
      description: string;
    }[];
  };
  
  // Limitations & Risks
  limitations: {
    knownLimitations: string[];
    failureModes: string[];
    edgeCases: string[];
    ethicalConsiderations: string[];
    risks: {
      risk: string;
      likelihood: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }[];
  };
  
  // Monitoring & Drift
  monitoring: {
    driftDetection: {
      enabled: boolean;
      metrics: ('accuracy' | 'precision' | 'recall' | 'fairness' | 'data_drift')[];
      thresholds: {
        warning: number; // e.g., 0.05 (5% drift)
        critical: number; // e.g., 0.10 (10% drift)
      };
      frequency: string; // e.g., "daily", "weekly"
    };
    performanceMonitoring: {
      realtimeMetrics: string[];
      alertThresholds: {
        accuracy: number;
        latency: number; // ms
        errorRate: number; // percentage
      };
      dashboardUrl?: string;
    };
    dataDrift: {
      featureDrift: {
        feature: string;
        driftScore: number;
        threshold: number;
        status: 'normal' | 'warning' | 'critical';
      }[];
      conceptDrift: {
        metric: string;
        driftScore: number;
        threshold: number;
        status: 'normal' | 'warning' | 'critical';
      }[];
    };
  };
  
  // Governance & Compliance
  governance: {
    approvals: {
      reviewer: string;
      role: string;
      date: Date;
      decision: 'approved' | 'rejected' | 'requires_changes';
      comments: string;
    }[];
    complianceChecks: {
      framework: string;
      status: 'pass' | 'fail' | 'warning';
      lastChecked: Date;
      evidence: string;
    }[];
    auditTrail: {
      timestamp: Date;
      action: string;
      user: string;
      details: string;
    }[];
  };
  
  // Deployment Information
  deployment: {
    environment: 'development' | 'staging' | 'production';
    endpoint?: string;
    apiVersion: string;
    scaling: {
      minInstances: number;
      maxInstances: number;
      autoScaling: boolean;
    };
    availability: {
      sla: number; // percentage
      uptime: number; // percentage
      maintenanceWindows: string[];
    };
  };
  
  // Related Artifacts
  relatedArtifacts: {
    knowledgeObjects: string[]; // KO IDs
    decisionBundles: string[]; // Bundle IDs
    trainingScripts: string[];
    evaluationReports: string[];
    documentation: string[];
  };
}

export interface ModelCardTemplate {
  id: string;
  name: string;
  description: string;
  agentType: string;
  requiredFields: string[];
  defaultMetrics: string[];
  complianceFrameworks: string[];
  createdBy: string;
  createdAt: Date;
}

export interface ModelCardComparison {
  baseline: ModelCard;
  candidate: ModelCard;
  differences: {
    field: string;
    baselineValue: any;
    candidateValue: any;
    impact: 'low' | 'medium' | 'high';
    category: 'performance' | 'safety' | 'compliance' | 'operational';
  }[];
  recommendation: 'approve' | 'reject' | 'review';
  reasoning: string;
}

export class ModelCardSystem {
  private modelCards: Map<string, ModelCard> = new Map();
  private templates: Map<string, ModelCardTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  async createModelCard(agentId: string, options: {
    agentName: string;
    version: string;
    templateId?: string;
    initialData?: Partial<ModelCard>;
  }): Promise<ModelCard> {
    const { agentName, version, templateId, initialData } = options;
    
    const template = templateId ? this.templates.get(templateId) : undefined;
    
    const modelCard: ModelCard = {
      id: `mc_${agentId}_${version.replace(/\./g, '_')}`,
      agentId,
      agentName,
      version,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'development',
      
      modelDetails: {
        name: `${agentName} v${version}`,
        description: initialData?.modelDetails?.description || `Compliance agent for ${agentName}`,
        version,
        architecture: initialData?.modelDetails?.architecture || 'Transformer-based',
        framework: initialData?.modelDetails?.framework || 'PyTorch',
        trainingDate: initialData?.modelDetails?.trainingDate || new Date(),
        modelSize: initialData?.modelDetails?.modelSize || 'Unknown',
        parameters: initialData?.modelDetails?.parameters || 0,
        computeRequirements: {
          cpu: initialData?.modelDetails?.computeRequirements?.cpu || '2 cores',
          memory: initialData?.modelDetails?.computeRequirements?.memory || '4GB',
          gpu: initialData?.modelDetails?.computeRequirements?.gpu,
          inferenceTime: initialData?.modelDetails?.computeRequirements?.inferenceTime || '<100ms'
        }
      },
      
      scope: {
        intendedUse: initialData?.scope?.intendedUse || `Automated compliance checking for ${agentName}`,
        primaryUseCases: initialData?.scope?.primaryUseCases || [
          'Real-time transaction monitoring',
          'Compliance rule validation',
          'Risk assessment'
        ],
        outOfScopeUses: initialData?.scope?.outOfScopeUses || [
          'Legal advice',
          'Financial planning',
          'Customer service'
        ],
        targetUsers: initialData?.scope?.targetUsers || [
          'Compliance officers',
          'Risk managers',
          'Auditors'
        ],
        complianceDomains: initialData?.scope?.complianceDomains || ['AML', 'KYC', 'Fraud'],
        jurisdictions: initialData?.scope?.jurisdictions || ['US', 'EU', 'UK']
      },
      
      trainingData: {
        datasets: initialData?.trainingData?.datasets || [],
        dataPreprocessing: initialData?.trainingData?.dataPreprocessing || [
          'Data cleaning',
          'Normalization',
          'Feature engineering'
        ],
        dataBias: {
          identifiedBiases: initialData?.trainingData?.dataBias?.identifiedBiases || [],
          mitigationStrategies: initialData?.trainingData?.dataBias?.mitigationStrategies || [],
          biasMetrics: initialData?.trainingData?.dataBias?.biasMetrics || []
        },
        dataPrivacy: {
          piiHandling: initialData?.trainingData?.dataPrivacy?.piiHandling || 'PII removed or anonymized',
          anonymizationTechniques: initialData?.trainingData?.dataPrivacy?.anonymizationTechniques || [
            'Tokenization',
            'Generalization'
          ],
          complianceStandards: initialData?.trainingData?.dataPrivacy?.complianceStandards || ['GDPR', 'CCPA']
        }
      },
      
      metrics: {
        accuracy: {
          value: initialData?.metrics?.accuracy?.value || 0,
          threshold: initialData?.metrics?.accuracy?.threshold || 0.95,
          testDataset: initialData?.metrics?.accuracy?.testDataset || 'validation_set',
          confidence: initialData?.metrics?.accuracy?.confidence || 0.95
        },
        precision: {
          value: initialData?.metrics?.precision?.value || 0,
          threshold: initialData?.metrics?.precision?.threshold || 0.90,
          testDataset: initialData?.metrics?.precision?.testDataset || 'validation_set',
          confidence: initialData?.metrics?.precision?.confidence || 0.95
        },
        recall: {
          value: initialData?.metrics?.recall?.value || 0,
          threshold: initialData?.metrics?.recall?.threshold || 0.90,
          testDataset: initialData?.metrics?.recall?.testDataset || 'validation_set',
          confidence: initialData?.metrics?.recall?.confidence || 0.95
        },
        f1Score: {
          value: initialData?.metrics?.f1Score?.value || 0,
          threshold: initialData?.metrics?.f1Score?.threshold || 0.90,
          testDataset: initialData?.metrics?.f1Score?.testDataset || 'validation_set',
          confidence: initialData?.metrics?.f1Score?.confidence || 0.95
        },
        fairness: {
          demographicParity: initialData?.metrics?.fairness?.demographicParity || 0,
          equalOpportunity: initialData?.metrics?.fairness?.equalOpportunity || 0,
          equalizedOdds: initialData?.metrics?.fairness?.equalizedOdds || 0,
          testDataset: initialData?.metrics?.fairness?.testDataset || 'fairness_test_set'
        },
        robustness: {
          adversarialTestScore: initialData?.metrics?.robustness?.adversarialTestScore || 0,
          noiseTolerance: initialData?.metrics?.robustness?.noiseTolerance || 0,
          edgeCaseHandling: initialData?.metrics?.robustness?.edgeCaseHandling || 0
        },
        customMetrics: initialData?.metrics?.customMetrics || []
      },
      
      limitations: {
        knownLimitations: initialData?.limitations?.knownLimitations || [
          'Limited to structured data inputs',
          'Requires clear regulatory text',
          'May not handle edge cases perfectly'
        ],
        failureModes: initialData?.limitations?.failureModes || [
          'Ambiguous regulatory language',
          'Missing context in input data',
          'Novel compliance scenarios'
        ],
        edgeCases: initialData?.limitations?.edgeCases || [
          'Cross-jurisdictional conflicts',
          'Emerging regulatory changes',
          'Complex multi-party transactions'
        ],
        ethicalConsiderations: initialData?.limitations?.ethicalConsiderations || [
          'Potential for false positives',
          'Need for human oversight',
          'Transparency in decision making'
        ],
        risks: initialData?.limitations?.risks || []
      },
      
      monitoring: {
        driftDetection: {
          enabled: initialData?.monitoring?.driftDetection?.enabled || true,
          metrics: initialData?.monitoring?.driftDetection?.metrics || ['accuracy', 'precision', 'recall'],
          thresholds: {
            warning: initialData?.monitoring?.driftDetection?.thresholds?.warning || 0.05,
            critical: initialData?.monitoring?.driftDetection?.thresholds?.critical || 0.10
          },
          frequency: initialData?.monitoring?.driftDetection?.frequency || 'daily'
        },
        performanceMonitoring: {
          realtimeMetrics: initialData?.monitoring?.performanceMonitoring?.realtimeMetrics || [
            'inference_time',
            'error_rate',
            'throughput'
          ],
          alertThresholds: {
            accuracy: initialData?.monitoring?.performanceMonitoring?.alertThresholds?.accuracy || 0.85,
            latency: initialData?.monitoring?.performanceMonitoring?.alertThresholds?.latency || 1000,
            errorRate: initialData?.monitoring?.performanceMonitoring?.alertThresholds?.errorRate || 5
          },
          dashboardUrl: initialData?.monitoring?.performanceMonitoring?.dashboardUrl
        },
        dataDrift: {
          featureDrift: initialData?.monitoring?.dataDrift?.featureDrift || [],
          conceptDrift: initialData?.monitoring?.dataDrift?.conceptDrift || []
        }
      },
      
      governance: {
        approvals: initialData?.governance?.approvals || [],
        complianceChecks: initialData?.governance?.complianceChecks || [],
        auditTrail: initialData?.governance?.auditTrail || []
      },
      
      deployment: {
        environment: initialData?.deployment?.environment || 'development',
        endpoint: initialData?.deployment?.endpoint,
        apiVersion: initialData?.deployment?.apiVersion || 'v1',
        scaling: {
          minInstances: initialData?.deployment?.scaling?.minInstances || 1,
          maxInstances: initialData?.deployment?.scaling?.maxInstances || 3,
          autoScaling: initialData?.deployment?.scaling?.autoScaling || true
        },
        availability: {
          sla: initialData?.deployment?.availability?.sla || 99.9,
          uptime: initialData?.deployment?.availability?.uptime || 99.95,
          maintenanceWindows: initialData?.deployment?.availability?.maintenanceWindows || [
            'Saturday 02:00-04:00 UTC'
          ]
        }
      },
      
      relatedArtifacts: {
        knowledgeObjects: initialData?.relatedArtifacts?.knowledgeObjects || [],
        decisionBundles: initialData?.relatedArtifacts?.decisionBundles || [],
        trainingScripts: initialData?.relatedArtifacts?.trainingScripts || [],
        evaluationReports: initialData?.relatedArtifacts?.evaluationReports || [],
        documentation: initialData?.relatedArtifacts?.documentation || []
      }
    };

    this.modelCards.set(modelCard.id, modelCard);
    return modelCard;
  }

  async updateModelCard(id: string, updates: Partial<ModelCard>): Promise<ModelCard> {
    const modelCard = this.modelCards.get(id);
    if (!modelCard) {
      throw new Error(`Model card ${id} not found`);
    }

    const updatedCard = {
      ...modelCard,
      ...updates,
      updatedAt: new Date()
    };

    this.modelCards.set(id, updatedCard);
    return updatedCard;
  }

  async updateMetrics(id: string, metrics: Partial<ModelCard['metrics']>): Promise<ModelCard> {
    const modelCard = this.modelCards.get(id);
    if (!modelCard) {
      throw new Error(`Model card ${id} not found`);
    }

    const updatedMetrics = {
      ...modelCard.metrics,
      ...metrics
    };

    return this.updateModelCard(id, { metrics: updatedMetrics });
  }

  async updateDriftDetection(id: string, driftData: {
    featureDrift?: ModelCard['monitoring']['dataDrift']['featureDrift'];
    conceptDrift?: ModelCard['monitoring']['dataDrift']['conceptDrift'];
  }): Promise<ModelCard> {
    const modelCard = this.modelCards.get(id);
    if (!modelCard) {
      throw new Error(`Model card ${id} not found`);
    }

    const updatedMonitoring = {
      ...modelCard.monitoring,
      dataDrift: {
        ...modelCard.monitoring.dataDrift,
        ...driftData
      }
    };

    return this.updateModelCard(id, { monitoring: updatedMonitoring });
  }

  async checkDriftThresholds(id: string): Promise<{
    status: 'normal' | 'warning' | 'critical';
    alerts: string[];
    recommendations: string[];
  }> {
    const modelCard = this.modelCards.get(id);
    if (!modelCard) {
      throw new Error(`Model card ${id} not found`);
    }

    const alerts: string[] = [];
    const recommendations: string[] = [];
    let status: 'normal' | 'warning' | 'critical' = 'normal';

    // Check feature drift
    for (const feature of modelCard.monitoring.dataDrift.featureDrift) {
      if (feature.driftScore > modelCard.monitoring.driftDetection.thresholds.critical) {
        status = 'critical';
        alerts.push(`Critical feature drift detected in ${feature.feature}: ${feature.driftScore.toFixed(3)}`);
        recommendations.push(`Investigate data changes for feature: ${feature.feature}`);
      } else if (feature.driftScore > modelCard.monitoring.driftDetection.thresholds.warning) {
        if (status === 'normal') status = 'warning';
        alerts.push(`Warning: Feature drift in ${feature.feature}: ${feature.driftScore.toFixed(3)}`);
        recommendations.push(`Monitor feature: ${feature.feature}`);
      }
    }

    // Check concept drift
    for (const concept of modelCard.monitoring.dataDrift.conceptDrift) {
      if (concept.driftScore > modelCard.monitoring.driftDetection.thresholds.critical) {
        status = 'critical';
        alerts.push(`Critical concept drift detected in ${concept.metric}: ${concept.driftScore.toFixed(3)}`);
        recommendations.push(`Retrain model due to concept drift in: ${concept.metric}`);
      } else if (concept.driftScore > modelCard.monitoring.driftDetection.thresholds.warning) {
        if (status === 'normal') status = 'warning';
        alerts.push(`Warning: Concept drift in ${concept.metric}: ${concept.driftScore.toFixed(3)}`);
        recommendations.push(`Monitor concept drift for: ${concept.metric}`);
      }
    }

    // Check performance metrics
    const currentMetrics = modelCard.metrics;
    if (currentMetrics.accuracy.value < currentMetrics.accuracy.threshold * 0.9) {
      status = 'critical';
      alerts.push('Critical: Accuracy below 90% of threshold');
      recommendations.push('Immediate model retraining required');
    } else if (currentMetrics.accuracy.value < currentMetrics.accuracy.threshold * 0.95) {
      if (status === 'normal') status = 'warning';
      alerts.push('Warning: Accuracy below 95% of threshold');
      recommendations.push('Schedule model retraining');
    }

    return { status, alerts, recommendations };
  }

  async compareModelCards(baselineId: string, candidateId: string): Promise<ModelCardComparison> {
    const baseline = this.modelCards.get(baselineId);
    const candidate = this.modelCards.get(candidateId);
    
    if (!baseline || !candidate) {
      throw new Error('One or both model cards not found');
    }

    const differences = this.extractDifferences(baseline, candidate);
    const recommendation = this.generateComparisonRecommendation(differences);
    const reasoning = this.generateComparisonReasoning(differences, recommendation);

    return {
      baseline,
      candidate,
      differences,
      recommendation,
      reasoning
    };
  }

  private extractDifferences(baseline: ModelCard, candidate: ModelCard) {
    const differences = [];
    
    // Compare metrics
    const metricsFields = ['accuracy', 'precision', 'recall', 'f1Score'];
    for (const field of metricsFields) {
      const baselineValue = baseline.metrics[field].value;
      const candidateValue = candidate.metrics[field].value;
      const threshold = baseline.metrics[field].threshold;
      
      if (Math.abs(baselineValue - candidateValue) > threshold * 0.05) {
        differences.push({
          field: `metrics.${field}`,
          baselineValue,
          candidateValue,
          impact: Math.abs(baselineValue - candidateValue) > threshold * 0.1 ? 'high' : 'medium',
          category: 'performance'
        });
      }
    }

    // Compare drift thresholds
    if (baseline.monitoring.driftDetection.thresholds.warning !== candidate.monitoring.driftDetection.thresholds.warning) {
      differences.push({
        field: 'monitoring.driftDetection.thresholds.warning',
        baselineValue: baseline.monitoring.driftDetection.thresholds.warning,
        candidateValue: candidate.monitoring.driftDetection.thresholds.warning,
        impact: 'medium',
        category: 'operational'
      });
    }

    // Compare compute requirements
    if (baseline.modelDetails.computeRequirements.memory !== candidate.modelDetails.computeRequirements.memory) {
      differences.push({
        field: 'modelDetails.computeRequirements.memory',
        baselineValue: baseline.modelDetails.computeRequirements.memory,
        candidateValue: candidate.modelDetails.computeRequirements.memory,
        impact: 'medium',
        category: 'operational'
      });
    }

    return differences;
  }

  private generateComparisonRecommendation(differences: any[]): 'approve' | 'reject' | 'review' {
    const highImpactDifferences = differences.filter(d => d.impact === 'high' && d.category === 'performance');
    const criticalComplianceIssues = differences.filter(d => d.category === 'compliance' && d.impact === 'high');
    
    if (criticalComplianceIssues.length > 0) {
      return 'reject';
    }
    
    if (highImpactDifferences.length > 2) {
      return 'review';
    }
    
    return 'approve';
  }

  private generateComparisonReasoning(differences: any[], recommendation: string): string {
    if (recommendation === 'reject') {
      return 'Critical compliance or performance issues detected. Model deployment not recommended.';
    }
    
    if (recommendation === 'review') {
      return 'Multiple high-impact differences detected. Manual review required before approval.';
    }
    
    return 'Model comparison shows acceptable differences within tolerance thresholds.';
  }

  getModelCard(id: string): ModelCard | undefined {
    return this.modelCards.get(id);
  }

  getAllModelCards(): ModelCard[] {
    return Array.from(this.modelCards.values());
  }

  getModelCardsByAgent(agentId: string): ModelCard[] {
    return Array.from(this.modelCards.values()).filter(mc => mc.agentId === agentId);
  }

  async deleteModelCard(id: string): Promise<boolean> {
    return this.modelCards.delete(id);
  }

  async approveModelCard(id: string, reviewer: string, role: string, comments: string): Promise<ModelCard> {
    const modelCard = this.modelCards.get(id);
    if (!modelCard) {
      throw new Error(`Model card ${id} not found`);
    }

    const approval = {
      reviewer,
      role,
      date: new Date(),
      decision: 'approved' as const,
      comments
    };

    const updatedCard = {
      ...modelCard,
      status: 'active' as const,
      governance: {
        ...modelCard.governance,
        approvals: [...modelCard.governance.approvals, approval],
        auditTrail: [
          ...modelCard.governance.auditTrail,
          {
            timestamp: new Date(),
            action: 'approved',
            user: reviewer,
            details: `Model card approved by ${reviewer} (${role})`
          }
        ]
      },
      updatedAt: new Date()
    };

    this.modelCards.set(id, updatedCard);
    return updatedCard;
  }

  exportModelCard(id: string, format: 'json' | 'markdown' = 'json'): string {
    const modelCard = this.modelCards.get(id);
    if (!modelCard) {
      throw new Error(`Model card ${id} not found`);
    }

    if (format === 'json') {
      return JSON.stringify(modelCard, null, 2);
    }

    return this.generateMarkdownReport(modelCard);
  }

  private generateMarkdownReport(modelCard: ModelCard): string {
    return `# Model Card: ${modelCard.modelDetails.name}

## Overview
- **Agent ID**: ${modelCard.agentId}
- **Version**: ${modelCard.version}
- **Status**: ${modelCard.status}
- **Created**: ${modelCard.createdAt.toISOString()}
- **Updated**: ${modelCard.updatedAt.toISOString()}

## Model Details
- **Architecture**: ${modelCard.modelDetails.architecture}
- **Framework**: ${modelCard.modelDetails.framework}
- **Training Date**: ${modelCard.modelDetails.trainingDate.toISOString()}
- **Model Size**: ${modelCard.modelDetails.modelSize}
- **Parameters**: ${modelCard.modelDetails.parameters.toLocaleString()}

## Intended Use
${modelCard.scope.intendedUse}

### Primary Use Cases
${modelCard.scope.primaryUseCases.map(uc => `- ${uc}`).join('\n')}

### Out of Scope Uses
${modelCard.scope.outOfScopeUses.map(use => `- ${use}`).join('\n')}

## Performance Metrics
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Accuracy | ${(modelCard.metrics.accuracy.value * 100).toFixed(1)}% | ${(modelCard.metrics.accuracy.threshold * 100).toFixed(1)}% | ${modelCard.metrics.accuracy.value >= modelCard.metrics.accuracy.threshold ? '✓' : '✗'} |
| Precision | ${(modelCard.metrics.precision.value * 100).toFixed(1)}% | ${(modelCard.metrics.precision.threshold * 100).toFixed(1)}% | ${modelCard.metrics.precision.value >= modelCard.metrics.precision.threshold ? '✓' : '✗'} |
| Recall | ${(modelCard.metrics.recall.value * 100).toFixed(1)}% | ${(modelCard.metrics.recall.threshold * 100).toFixed(1)}% | ${modelCard.metrics.recall.value >= modelCard.metrics.recall.threshold ? '✓' : '✗'} |
| F1 Score | ${(modelCard.metrics.f1Score.value * 100).toFixed(1)}% | ${(modelCard.metrics.f1Score.threshold * 100).toFixed(1)}% | ${modelCard.metrics.f1Score.value >= modelCard.metrics.f1Score.threshold ? '✓' : '✗'} |

## Monitoring & Drift Detection
- **Drift Detection**: ${modelCard.monitoring.driftDetection.enabled ? 'Enabled' : 'Disabled'}
- **Warning Threshold**: ${(modelCard.monitoring.driftDetection.thresholds.warning * 100).toFixed(1)}%
- **Critical Threshold**: ${(modelCard.monitoring.driftDetection.thresholds.critical * 100).toFixed(1)}%
- **Monitoring Frequency**: ${modelCard.monitoring.driftDetection.frequency}

## Limitations
${modelCard.limitations.knownLimitations.map(limitation => `- ${limitation}`).join('\n')}

## Known Risks
${modelCard.limitations.risks.map(risk => `- **${risk.risk}** (Likelihood: ${risk.likelihood}, Impact: ${risk.impact}): ${risk.mitigation}`).join('\n')}

## Governance
### Approvals
${modelCard.governance.approvals.map(approval => 
  `- ${approval.reviewer} (${approval.role}) - ${approval.decision} on ${approval.date.toISOString()}`
).join('\n')}

### Compliance Checks
${modelCard.governance.complianceChecks.map(check => 
  `- **${check.framework}**: ${check.status} (Last checked: ${check.lastChecked.toISOString()})`
).join('\n')}
`;
  }

  private initializeDefaultTemplates(): void {
    // Create default templates for different agent types
    const complianceTemplate: ModelCardTemplate = {
      id: 'compliance_agent_template',
      name: 'Compliance Agent Template',
      description: 'Template for compliance-focused AI agents',
      agentType: 'compliance',
      requiredFields: [
        'modelDetails.name',
        'modelDetails.description',
        'scope.intendedUse',
        'metrics.accuracy',
        'metrics.precision',
        'metrics.recall'
      ],
      defaultMetrics: ['accuracy', 'precision', 'recall', 'f1Score', 'fairness'],
      complianceFrameworks: ['SOC2', 'ISO27001', 'GDPR'],
      createdBy: 'system',
      createdAt: new Date()
    };

    this.templates.set(complianceTemplate.id, complianceTemplate);
  }
}