import { db } from '@/lib/db';
import { KnowledgeObject, ComplianceRule, DecisionBundle } from '@prisma/client';

export interface GeneratedAsset {
  id: string;
  name: string;
  type: 'api-endpoint' | 'microservice' | 'sdk-stub';
  language: 'javascript' | 'python' | 'java' | 'yaml';
  code: string;
  config: any;
  dependencies: string[];
  endpoints: string[];
  description: string;
  regulation: string;
  category: string;
}

export interface ComplianceRuleTemplate {
  id: string;
  name: string;
  regulation: string;
  category: 'aml' | 'kyc' | 'basel' | 'gdpr' | 'esg' | 'health';
  threshold?: number;
  conditions: any[];
  actions: any[];
  metadata: any;
}

export class ComplianceAssetGenerator {
  private ruleTemplates: ComplianceRuleTemplate[] = [
    {
      id: 'aml-threshold',
      name: 'AML Transaction Threshold',
      regulation: 'BSA/AML',
      category: 'aml',
      threshold: 10000,
      conditions: [
        { field: 'transaction_amount', operator: '>', value: 10000 },
        { field: 'transaction_type', operator: 'in', value: ['wire', 'cash'] }
      ],
      actions: [
        { type: 'flag', severity: 'high' },
        { type: 'report', destination: 'fintrac' }
      ],
      metadata: {
        description: 'Flag transactions exceeding $10,000 threshold',
        jurisdiction: 'US',
        effective_date: '2024-01-01'
      }
    },
    {
      id: 'kyc-verification',
      name: 'KYC Customer Verification',
      regulation: 'FATF',
      category: 'kyc',
      conditions: [
        { field: 'customer_risk_score', operator: '>', value: 7 },
        { field: 'verification_status', operator: '!=', value: 'verified' }
      ],
      actions: [
        { type: 'require_documentation' },
        { type: 'enhanced_due_diligence' }
      ],
      metadata: {
        description: 'Enhanced KYC for high-risk customers',
        risk_level: 'high'
      }
    },
    {
      id: 'basel-liquidity',
      name: 'Basel III Liquidity Coverage Ratio',
      regulation: 'Basel III',
      category: 'basel',
      threshold: 100,
      conditions: [
        { field: 'liquidity_coverage_ratio', operator: '<', value: 100 }
      ],
      actions: [
        { type: 'alert', department: 'treasury' },
        { type: 'report', frequency: 'daily' }
      ],
      metadata: {
        description: 'Monitor Basel III LCR requirements',
        ratio_type: 'LCR',
        minimum_requirement: 100
      }
    }
  ];

  async generateFromKnowledgeObject(knowledgeObjectId: string): Promise<GeneratedAsset> {
    const knowledgeObject = await db.knowledgeObject.findUnique({
      where: { id: knowledgeObjectId },
      include: { decisionBundles: true }
    });

    if (!knowledgeObject) {
      throw new Error('Knowledge object not found');
    }

    return this.generateAsset(knowledgeObject);
  }

  async generateBatchAssets(knowledgeObjectIds: string[]): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    
    for (const id of knowledgeObjectIds) {
      try {
        const asset = await this.generateFromKnowledgeObject(id);
        assets.push(asset);
      } catch (error) {
        console.error(`Failed to generate asset for knowledge object ${id}:`, error);
      }
    }

    return assets;
  }

  private generateAsset(knowledgeObject: any): GeneratedAsset {
    const ruleType = this.categorizeRule(knowledgeObject);
    const template = this.ruleTemplates.find(t => t.category === ruleType);

    return {
      id: `asset_${knowledgeObject.id}`,
      name: knowledgeObject.name,
      type: 'api-endpoint',
      language: 'javascript',
      code: this.generateCode(knowledgeObject, template),
      config: this.generateConfig(knowledgeObject, template),
      dependencies: this.getDependencies(ruleType),
      endpoints: this.generateEndpoints(knowledgeObject),
      description: knowledgeObject.description || `Auto-generated compliance rule for ${knowledgeObject.name}`,
      regulation: knowledgeObject.regulation || 'Unknown',
      category: ruleType
    };
  }

  private categorizeRule(knowledgeObject: any): string {
    const content = (knowledgeObject.content || '').toLowerCase();
    const name = (knowledgeObject.name || '').toLowerCase();

    if (content.includes('aml') || content.includes('anti-money') || name.includes('aml')) {
      return 'aml';
    }
    if (content.includes('kyc') || content.includes('know your') || name.includes('kyc')) {
      return 'kyc';
    }
    if (content.includes('basel') || content.includes('liquidity') || name.includes('basel')) {
      return 'basel';
    }
    if (content.includes('gdpr') || content.includes('privacy') || name.includes('gdpr')) {
      return 'gdpr';
    }
    if (content.includes('esg') || content.includes('climate') || content.includes('sustainability')) {
      return 'esg';
    }
    if (content.includes('hipaa') || content.includes('health') || name.includes('health')) {
      return 'health';
    }
    return 'general';
  }

  private generateCode(knowledgeObject: any, template?: ComplianceRuleTemplate): string {
    const ruleType = this.categorizeRule(knowledgeObject);
    
    switch (ruleType) {
      case 'aml':
        return this.generateAMLCode(knowledgeObject, template);
      case 'kyc':
        return this.generateKYCCode(knowledgeObject, template);
      case 'basel':
        return this.generateBaselCode(knowledgeObject, template);
      default:
        return this.generateGenericCode(knowledgeObject, template);
    }
  }

  private generateAMLCode(knowledgeObject: any, template?: ComplianceRuleTemplate): string {
    const threshold = template?.threshold || 10000;
    
    return `
// Auto-generated AML Compliance Rule
// Source: ${knowledgeObject.name}
// Regulation: ${knowledgeObject.regulation || 'BSA/AML'}

export class AMLComplianceRule {
  constructor(config = {}) {
    this.threshold = config.threshold || ${threshold};
    this.reportDestinations = config.reportDestinations || ['fintrac'];
  }

  async evaluateTransaction(transaction) {
    const violations = [];
    
    // Check transaction threshold
    if (transaction.amount > this.threshold) {
      violations.push({
        type: 'threshold_exceeded',
        amount: transaction.amount,
        threshold: this.threshold,
        severity: 'high'
      });
    }

    // Check transaction patterns
    if (this.isSuspiciousPattern(transaction)) {
      violations.push({
        type: 'suspicious_pattern',
        pattern: 'structured_transactions',
        severity: 'medium'
      });
    }

    return {
      ruleId: '${knowledgeObject.id}',
      timestamp: new Date().toISOString(),
      transactionId: transaction.id,
      violations,
      action: violations.length > 0 ? 'flag_and_report' : 'pass'
    };
  }

  isSuspiciousPattern(transaction) {
    // Implement suspicious pattern detection
    return transaction.type === 'cash' && transaction.amount > 5000;
  }

  async generateReport(violations) {
    return {
      reportId: \`aml_\${Date.now()}\`,
      generatedAt: new Date().toISOString(),
      violations,
      destinations: this.reportDestinations
    };
  }
}

// Export for microservice deployment
export default AMLComplianceRule;
`;
  }

  private generateKYCCode(knowledgeObject: any, template?: ComplianceRuleTemplate): string {
    return `
// Auto-generated KYC Compliance Rule
// Source: ${knowledgeObject.name}
// Regulation: ${knowledgeObject.regulation || 'FATF'}

export class KYCComplianceRule {
  constructor(config = {}) {
    this.riskThreshold = config.riskThreshold || 7;
    this.requiredDocuments = config.requiredDocuments || ['passport', 'proof_of_address'];
  }

  async evaluateCustomer(customer) {
    const requirements = [];
    
    // Risk assessment
    if (customer.riskScore > this.riskThreshold) {
      requirements.push({
        type: 'enhanced_due_diligence',
        reason: 'high_risk_score',
        riskScore: customer.riskScore
      });
    }

    // Document verification
    const missingDocs = this.requiredDocuments.filter(doc => 
      !customer.documents?.some(d => d.type === doc && d.verified)
    );

    if (missingDocs.length > 0) {
      requirements.push({
        type: 'missing_documents',
        documents: missingDocs,
        severity: 'high'
      });
    }

    return {
      ruleId: '${knowledgeObject.id}',
      customerId: customer.id,
      requirements,
      status: requirements.length > 0 ? 'action_required' : 'verified',
      nextReviewDate: this.calculateNextReview(customer)
    };
  }

  calculateNextReview(customer) {
    const baseDate = new Date();
    const months = customer.riskScore > 7 ? 6 : 12;
    baseDate.setMonth(baseDate.getMonth() + months);
    return baseDate.toISOString();
  }
}

export default KYCComplianceRule;
`;
  }

  private generateBaselCode(knowledgeObject: any, template?: ComplianceRuleTemplate): string {
    return `
// Auto-generated Basel III Compliance Rule
// Source: ${knowledgeObject.name}
// Regulation: ${knowledgeObject.regulation || 'Basel III'}

export class BaselComplianceRule {
  constructor(config = {}) {
    this.lcrThreshold = config.lcrThreshold || 100;
    this.nsfThreshold = config.nsfThreshold || 100;
  }

  async evaluateLiquidityPosition(position) {
    const metrics = {};
    const violations = [];

    // Liquidity Coverage Ratio
    const lcr = (position.highQualityLiquidAssets / position.netCashOutflows) * 100;
    metrics.lcr = lcr;

    if (lcr < this.lcrThreshold) {
      violations.push({
        type: 'lcr_breach',
        current: lcr,
        threshold: this.lcrThreshold,
        severity: 'critical'
      });
    }

    // Net Stable Funding Ratio
    const nsfr = (position.availableStableFunding / position.requiredStableFunding) * 100;
    metrics.nsfr = nsfr;

    if (nsfr < this.nsfThreshold) {
      violations.push({
        type: 'nsfr_breach',
        current: nsfr,
        threshold: this.nsfThreshold,
        severity: 'high'
      });
    }

    return {
      ruleId: '${knowledgeObject.id}',
      timestamp: new Date().toISOString(),
      positionId: position.id,
      metrics,
      violations,
      status: violations.length > 0 ? 'breach' : 'compliant'
    };
  }

  generateReport(metrics, violations) {
    return {
      reportId: \`basel_\${Date.now()}\`,
      generatedAt: new Date().toISOString(),
      metrics,
      violations,
      summary: {
        totalViolations: violations.length,
        criticalViolations: violations.filter(v => v.severity === 'critical').length
      }
    };
  }
}

export default BaselComplianceRule;
`;
  }

  private generateGenericCode(knowledgeObject: any, template?: ComplianceRuleTemplate): string {
    return `
// Auto-generated Compliance Rule
// Source: ${knowledgeObject.name}
// Regulation: ${knowledgeObject.regulation || 'General'}

export class GenericComplianceRule {
  constructor(config = {}) {
    this.config = { ...config };
  }

  async evaluate(data) {
    // Generic rule evaluation logic
    const conditions = this.parseConditions(knowledgeObject.content);
    const results = [];

    for (const condition of conditions) {
      const result = this.evaluateCondition(data, condition);
      results.push(result);
    }

    return {
      ruleId: '${knowledgeObject.id}',
      timestamp: new Date().toISOString(),
      results,
      overall: results.every(r => r.passed) ? 'pass' : 'fail'
    };
  }

  parseConditions(content) {
    // Parse conditions from knowledge object content
    return [];
  }

  evaluateCondition(data, condition) {
    // Evaluate individual condition
    return { passed: true, condition };
  }
}

export default GenericComplianceRule;
`;
  }

  private generateConfig(knowledgeObject: any, template?: ComplianceRuleTemplate): any {
    return {
      ruleId: knowledgeObject.id,
      name: knowledgeObject.name,
      version: '1.0.0',
      regulation: knowledgeObject.regulation || 'Unknown',
      category: this.categorizeRule(knowledgeObject),
      enabled: true,
      schedule: template?.metadata?.schedule || 'realtime',
      thresholds: template?.threshold ? { default: template.threshold } : {},
      actions: template?.actions || [],
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'glassbox-ai',
        template: template?.id || 'custom'
      }
    };
  }

  private getDependencies(ruleType: string): string[] {
    const dependencies = {
      aml: ['lodash', 'moment'],
      kyc: ['validator', 'bcrypt'],
      basel: ['big.js', 'financial'],
      gdpr: ['crypto-js', 'uuid'],
      esg: ['axios', 'cheerio'],
      health: ['hl7', 'fhir'],
      general: ['lodash']
    };

    return dependencies[ruleType] || [];
  }

  private generateEndpoints(knowledgeObject: any): string[] {
    const ruleType = this.categorizeRule(knowledgeObject);
    const baseEndpoint = `/api/compliance/${ruleType}/${knowledgeObject.id}`;
    
    return [
      `${baseEndpoint}/evaluate`,
      `${baseEndpoint}/config`,
      `${baseEndpoint}/status`,
      `${baseEndpoint}/reports`
    ];
  }

  async generateMicroservicePackage(asset: GeneratedAsset): Promise<string> {
    const packageJson = {
      name: `glassbox-${asset.category}-${asset.id}`,
      version: '1.0.0',
      description: asset.description,
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        test: 'jest',
        deploy: 'serverless deploy'
      },
      dependencies: {
        ...asset.dependencies.reduce((acc, dep) => ({ ...acc, [dep]: 'latest' }), {}),
        express: 'latest',
        cors: 'latest',
        helmet: 'latest'
      },
      keywords: ['compliance', 'glassbox', asset.category, 'regulatory'],
      author: 'Glassbox AI',
      license: 'MIT'
    };

    return JSON.stringify(packageJson, null, 2);
  }

  async generateSDKStub(asset: GeneratedAsset, language: string): Promise<string> {
    switch (language) {
      case 'python':
        return this.generatePythonSDK(asset);
      case 'java':
        return this.generateJavaSDK(asset);
      case 'javascript':
      default:
        return this.generateJavaScriptSDK(asset);
    }
  }

  private generateJavaScriptSDK(asset: GeneratedAsset): string {
    return `
// Glassbox AI Compliance SDK - JavaScript
// Auto-generated for: ${asset.name}

class GlassboxComplianceSDK {
  constructor(apiKey, baseURL = 'https://api.glassbox.ai') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.endpoints = {
      evaluate: '${asset.endpoints[0]}',
      config: '${asset.endpoints[1]}',
      status: '${asset.endpoints[2]}',
      reports: '${asset.endpoints[3]}'
    };
  }

  async evaluate(data) {
    const response = await fetch(\`\${this.baseURL}\${this.endpoints.evaluate}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${this.apiKey}\`
      },
      body: JSON.stringify(data)
    });

    return response.json();
  }

  async getConfig() {
    const response = await fetch(\`\${this.baseURL}\${this.endpoints.config}\`, {
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`
      }
    });

    return response.json();
  }

  async getStatus() {
    const response = await fetch(\`\${this.baseURL}\${this.endpoints.status}\`, {
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`
      }
    });

    return response.json();
  }
}

module.exports = GlassboxComplianceSDK;
`;
  }

  private generatePythonSDK(asset: GeneratedAsset): string {
    return `
# Glassbox AI Compliance SDK - Python
# Auto-generated for: ${asset.name}

import requests
import json

class GlassboxComplianceSDK:
    def __init__(self, api_key, base_url='https://api.glassbox.ai'):
        self.api_key = api_key
        self.base_url = base_url
        self.endpoints = {
            'evaluate': '${asset.endpoints[0]}',
            'config': '${asset.endpoints[1]}',
            'status': '${asset.endpoints[2]}',
            'reports': '${asset.endpoints[3]}'
        }
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def evaluate(self, data):
        response = requests.post(
            f'{self.base_url}{self.endpoints["evaluate"]}',
            headers=self.headers,
            json=data
        )
        return response.json()

    def get_config(self):
        response = requests.get(
            f'{self.base_url}{self.endpoints["config"]}',
            headers=self.headers
        )
        return response.json()

    def get_status(self):
        response = requests.get(
            f'{self.base_url}{self.endpoints["status"]}',
            headers=self.headers
        )
        return response.json()
`;
  }

  private generateJavaSDK(asset: GeneratedAsset): string {
    return `
// Glassbox AI Compliance SDK - Java
// Auto-generated for: ${asset.name}

package com.glassbox.ai.sdk;

import java.net.http.*;
import java.net.URI;
import java.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;

public class GlassboxComplianceSDK {
    private String apiKey;
    private String baseURL;
    private HttpClient client;
    private ObjectMapper mapper;
    private Map<String, String> endpoints;

    public GlassboxComplianceSDK(String apiKey) {
        this(apiKey, "https://api.glassbox.ai");
    }

    public GlassboxComplianceSDK(String apiKey, String baseURL) {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.client = HttpClient.newHttpClient();
        this.mapper = new ObjectMapper();
        
        this.endpoints = Map.of(
            "evaluate", "${asset.endpoints[0]}",
            "config", "${asset.endpoints[1]}",
            "status", "${asset.endpoints[2]}",
            "reports", "${asset.endpoints[3]}"
        );
    }

    public Map<String, Object> evaluate(Map<String, Object> data) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseURL + endpoints.get("evaluate")))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(data)))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), Map.class);
    }

    public Map<String, Object> getConfig() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseURL + endpoints.get("config")))
            .header("Authorization", "Bearer " + apiKey)
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), Map.class);
    }
}
`;
  }
}