import ZAI from 'z-ai-web-dev-sdk';

export interface NLQuery {
  text: string;
  intent: string;
  entities: any[];
  context?: any;
}

export interface DSLCompilation {
  dsl: any;
  explanation: string;
  confidence: number;
  regulations: string[];
  parameters: any;
}

export interface QueryResult {
  answer: string;
  data: any;
  sources: string[];
  visualization?: any;
  confidence: number;
}

export class NLToDSLCompiler {
  private zai: any;
  private regulationPatterns: Map<string, any>;
  private intentClassifiers: Map<string, any>;

  constructor() {
    this.initializePatterns();
    this.initializeClassifiers();
  }

  private async initializePatterns() {
    this.regulationPatterns = new Map([
      ['basel', {
        keywords: ['basel', 'liquidity', 'capital', 'lcr', 'nsfr'],
        regulations: ['Basel III', 'Basel IV'],
        parameters: ['threshold', 'currency', 'period', 'jurisdiction']
      }],
      ['aml', {
        keywords: ['aml', 'anti-money', 'laundering', 'suspicious', 'transaction'],
        regulations: ['BSA', 'AML', 'FATF'],
        parameters: ['amount', 'threshold', 'transaction_type', 'risk_level']
      }],
      ['kyc', {
        keywords: ['kyc', 'customer', 'verification', 'identity', 'due diligence'],
        regulations: ['FATF', 'KYC', 'CDD'],
        parameters: ['customer_type', 'risk_score', 'verification_level']
      }],
      ['gdpr', {
        keywords: ['gdpr', 'privacy', 'consent', 'data', 'subject rights'],
        regulations: ['GDPR', 'CCPA', 'LGPD'],
        parameters: ['data_type', 'consent_status', 'jurisdiction']
      }],
      ['esg', {
        keywords: ['esg', 'environmental', 'social', 'governance', 'sustainability'],
        regulations: ['EU Taxonomy', 'TCFD', 'SFDR'],
        parameters: ['metric_type', 'reporting_period', 'scope']
      }]
    ]);
  }

  private async initializeClassifiers() {
    this.intentClassifiers = new Map([
      ['query', {
        patterns: ['show', 'get', 'list', 'find', 'what', 'how many'],
        action: 'retrieve'
      }],
      ['analyze', {
        patterns: ['analyze', 'compare', 'trend', 'performance', 'correlation'],
        action: 'analyze'
      }],
      ['generate', {
        patterns: ['generate', 'create', 'build', 'make', 'produce'],
        action: 'generate'
      }],
      ['validate', {
        patterns: ['validate', 'check', 'verify', 'compliance', 'adhere'],
        action: 'validate'
      }],
      ['report', {
        patterns: ['report', 'summary', 'dashboard', 'overview', 'status'],
        action: 'report'
      }]
    ]);
  }

  async initialize() {
    this.zai = await ZAI.create();
  }

  async parseQuery(text: string): Promise<NLQuery> {
    // Use ZAI to parse the natural language query
    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a compliance query parser. Extract the intent and entities from natural language queries about financial regulations.
          
          Return a JSON object with:
          - intent: The main intent (query, analyze, generate, validate, report)
          - entities: Array of extracted entities with type and value
          - context: Additional context information
          
          Example: "Show Basel III liquidity checks for Germany last quarter"
          {
            "intent": "query",
            "entities": [
              {"type": "regulation", "value": "Basel III"},
              {"type": "metric", "value": "liquidity"},
              {"type": "jurisdiction", "value": "Germany"},
              {"type": "period", "value": "last quarter"}
            ]
          }`
        },
        {
          role: 'user',
          content: text
        }
      ]
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('Failed to parse query');
    }

    try {
      const parsed = JSON.parse(result);
      return {
        text,
        intent: parsed.intent,
        entities: parsed.entities || [],
        context: parsed.context
      };
    } catch (error) {
      throw new Error('Failed to parse query result');
    }
  }

  async compileToDSL(query: NLQuery): Promise<DSLCompilation> {
    const { intent, entities, context } = query;
    
    // Identify regulation and parameters
    const regulation = this.identifyRegulation(entities);
    const parameters = this.extractParameters(entities);
    
    // Generate DSL based on intent and regulation
    let dsl: any;
    let explanation = '';
    let confidence = 0.8;

    switch (intent) {
      case 'query':
        dsl = this.generateQueryDSL(regulation, parameters);
        explanation = `Generated query DSL for ${regulation.name} with parameters: ${JSON.stringify(parameters)}`;
        break;
      
      case 'analyze':
        dsl = this.generateAnalysisDSL(regulation, parameters);
        explanation = `Generated analysis DSL for ${regulation.name} metrics`;
        confidence = 0.75;
        break;
      
      case 'validate':
        dsl = this.generateValidationDSL(regulation, parameters);
        explanation = `Generated validation DSL for ${regulation.name} compliance`;
        break;
      
      case 'generate':
        dsl = this.generateReportDSL(regulation, parameters);
        explanation = `Generated report DSL for ${regulation.name} reporting`;
        break;
      
      default:
        dsl = this.generateGenericDSL(regulation, parameters);
        explanation = `Generated generic DSL for ${regulation.name}`;
        confidence = 0.6;
    }

    return {
      dsl,
      explanation,
      confidence,
      regulations: regulation.regulations,
      parameters
    };
  }

  private identifyRegulation(entities: any[]) {
    const regulationEntity = entities.find(e => e.type === 'regulation');
    const metricEntity = entities.find(e => e.type === 'metric');
    
    for (const [key, pattern] of this.regulationPatterns) {
      if (regulationEntity?.value?.toLowerCase().includes(key) ||
          metricEntity?.value?.toLowerCase().includes(key) ||
          entities.some(e => pattern.keywords.includes(e.value?.toLowerCase()))) {
        return {
          name: key.toUpperCase(),
          ...pattern
        };
      }
    }
    
    return {
      name: 'GENERAL',
      keywords: [],
      regulations: ['General Compliance'],
      parameters: []
    };
  }

  private extractParameters(entities: any[]) {
    const parameters: any = {};
    
    entities.forEach(entity => {
      switch (entity.type) {
        case 'jurisdiction':
          parameters.jurisdiction = entity.value;
          break;
        case 'period':
          parameters.period = this.parsePeriod(entity.value);
          break;
        case 'threshold':
          parameters.threshold = parseFloat(entity.value);
          break;
        case 'currency':
          parameters.currency = entity.value;
          break;
        case 'metric':
          parameters.metric = entity.value;
          break;
        default:
          parameters[entity.type] = entity.value;
      }
    });
    
    return parameters;
  }

  private parsePeriod(period: string) {
    const now = new Date();
    const lower = period.toLowerCase();
    
    if (lower.includes('last quarter')) {
      const quarter = Math.floor(now.getMonth() / 3);
      const startQuarter = quarter === 0 ? 4 : quarter;
      const year = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      return {
        start: new Date(year, (startQuarter - 1) * 3, 1),
        end: new Date(year, startQuarter * 3, 0),
        type: 'quarter'
      };
    }
    
    if (lower.includes('last month')) {
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
        type: 'month'
      };
    }
    
    if (lower.includes('last year')) {
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear() - 1, 11, 31),
        type: 'year'
      };
    }
    
    return {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: now,
      type: 'custom'
    };
  }

  private generateQueryDSL(regulation: any, parameters: any) {
    return {
      type: 'query',
      regulation: regulation.name,
      operation: 'retrieve',
      filters: {
        jurisdiction: parameters.jurisdiction,
        period: parameters.period,
        metric: parameters.metric
      },
      output: {
        format: 'json',
        fields: ['value', 'timestamp', 'compliance_status']
      }
    };
  }

  private generateAnalysisDSL(regulation: any, parameters: any) {
    return {
      type: 'analysis',
      regulation: regulation.name,
      operation: 'analyze',
      metrics: [parameters.metric || 'default'],
      timeframe: parameters.period,
      aggregations: ['avg', 'min', 'max', 'trend'],
      output: {
        format: 'chart',
        visualization: 'line'
      }
    };
  }

  private generateValidationDSL(regulation: any, parameters: any) {
    return {
      type: 'validation',
      regulation: regulation.name,
      operation: 'validate',
      rules: [
        {
          type: 'threshold',
          field: parameters.metric || 'value',
          operator: '>=',
          value: parameters.threshold || 0
        }
      ],
      output: {
        format: 'report',
        include_evidence: true
      }
    };
  }

  private generateReportDSL(regulation: any, parameters: any) {
    return {
      type: 'report',
      regulation: regulation.name,
      operation: 'generate',
      template: 'compliance_summary',
      parameters: {
        period: parameters.period,
        jurisdiction: parameters.jurisdiction,
        metrics: [parameters.metric]
      },
      output: {
        format: 'pdf',
        include_charts: true
      }
    };
  }

  private generateGenericDSL(regulation: any, parameters: any) {
    return {
      type: 'generic',
      regulation: regulation.name,
      operation: 'process',
      parameters,
      output: {
        format: 'json'
      }
    };
  }

  async executeQuery(dsl: any): Promise<QueryResult> {
    // Execute the compiled DSL against the compliance database
    try {
      // This would integrate with the actual compliance engine
      const mockData = this.generateMockData(dsl);
      
      return {
        answer: this.generateAnswer(dsl, mockData),
        data: mockData,
        sources: [dsl.regulation],
        confidence: 0.9,
        visualization: this.generateVisualization(dsl, mockData)
      };
    } catch (error) {
      return {
        answer: `Error executing query: ${error.message}`,
        data: null,
        sources: [],
        confidence: 0
      };
    }
  }

  private generateMockData(dsl: any) {
    // Generate realistic mock data based on DSL parameters
    const baseValue = Math.random() * 100 + 50;
    const dataPoints = 30;
    
    return Array.from({ length: dataPoints }, (_, i) => ({
      timestamp: new Date(Date.now() - (dataPoints - i) * 24 * 60 * 60 * 1000).toISOString(),
      value: baseValue + (Math.random() - 0.5) * 20,
      compliance_status: Math.random() > 0.1 ? 'compliant' : 'non_compliant',
      jurisdiction: dsl.filters?.jurisdiction || 'Global'
    }));
  }

  private generateAnswer(dsl: any, data: any) {
    switch (dsl.type) {
      case 'query':
        const avgValue = data.reduce((sum: number, d: any) => sum + d.value, 0) / data.length;
        return `Based on the data, the average ${dsl.filters?.metric || 'value'} for ${dsl.regulation} is ${avgValue.toFixed(2)} over the selected period.`;
      
      case 'analysis':
        const trend = data[data.length - 1].value > data[0].value ? 'increasing' : 'decreasing';
        return `Analysis shows a ${trend} trend in ${dsl.metrics?.[0] || 'compliance metrics'} over the specified timeframe.`;
      
      case 'validation':
        const compliant = data.filter((d: any) => d.compliance_status === 'compliant').length;
        const complianceRate = (compliant / data.length) * 100;
        return `Validation complete: ${complianceRate.toFixed(1)}% compliance rate for ${dsl.regulation} requirements.`;
      
      default:
        return `Processed ${dsl.regulation} query successfully. Found ${data.length} data points.`;
    }
  }

  private generateVisualization(dsl: any, data: any) {
    if (dsl.output?.visualization === 'line') {
      return {
        type: 'line',
        data: data.map((d: any) => ({
          x: d.timestamp,
          y: d.value
        })),
        options: {
          title: `${dsl.regulation} ${dsl.filters?.metric || 'Metrics'} Over Time`,
          xAxis: 'Date',
          yAxis: 'Value'
        }
      };
    }
    
    return null;
  }

  async processNaturalLanguageQuery(text: string): Promise<QueryResult> {
    try {
      // Parse the natural language query
      const query = await this.parseQuery(text);
      
      // Compile to DSL
      const compilation = await this.compileToDSL(query);
      
      // Execute the DSL
      const result = await this.executeQuery(compilation.dsl);
      
      return {
        ...result,
        answer: `${compilation.explanation}\n\n${result.answer}`,
        confidence: Math.min(result.confidence, compilation.confidence)
      };
    } catch (error) {
      return {
        answer: `I'm sorry, I couldn't process your query. Please try rephrasing it or be more specific about the regulation and metrics you're interested in.`,
        data: null,
        sources: [],
        confidence: 0
      };
    }
  }
}