import { DSLRule } from '@/lib/compliance/DSLCompiler';
import ZAI from 'z-ai-web-dev-sdk';

export interface Counterexample {
  id: string;
  ruleId: string;
  scenario: string;
  input: any;
  expectedOutput: {
    triggered: boolean;
    actions: string[];
    severity?: string;
    category?: string;
  };
  actualOutput?: {
    triggered: boolean;
    actions: string[];
    output: any;
  };
  passed: boolean;
  description: string;
  category: 'edge_case' | 'boundary' | 'negative' | 'regression' | 'performance';
  confidence: number;
  metadata?: {
    generatedBy: 'ai' | 'human' | 'hybrid';
    generationTime: number;
    complexity: 'low' | 'medium' | 'high';
    relatedRules?: string[];
  };
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  rules: DSLRule[];
  counterexamples: Counterexample[];
  coverage: {
    rules: number;
    scenarios: number;
    edgeCases: number;
    boundaryConditions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface RegressionReport {
  testSuiteId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  regressions: {
    ruleId: string;
    ruleName: string;
    failureCount: number;
    scenarios: string[];
  }[];
  newFailures: {
    ruleId: string;
    ruleName: string;
    scenarios: string[];
  }[];
  performance: {
    generationTime: number;
    executionTime: number;
    memoryUsage: number;
  };
  recommendations: string[];
}

export class CounterexampleGenerator {
  private testSuites: Map<string, TestSuite> = new Map();
  private baselineResults: Map<string, any> = new Map();

  async generateCounterexamples(rule: DSLRule, options: {
    count?: number;
    categories?: ('edge_case' | 'boundary' | 'negative' | 'regression' | 'performance')[];
    complexity?: 'low' | 'medium' | 'high';
  } = {}): Promise<Counterexample[]> {
    const {
      count = 10,
      categories = ['edge_case', 'boundary', 'negative'],
      complexity = 'medium'
    } = options;

    try {
      const zai = await ZAI.create();
      
      const prompt = `
You are an expert compliance testing engineer. Generate counterexamples for the following AURA DSL rule to test edge cases, boundary conditions, and potential failures.

Rule:
Name: ${rule.name}
DSL: ${rule.dsl}
Category: ${rule.category}
Description: ${rule.description}

Generate ${count} counterexamples with the following categories: ${categories.join(', ')}
Complexity level: ${complexity}

For each counterexample, provide:
1. A realistic scenario description
2. Input data that could trigger unexpected behavior
3. Expected output (what should happen)
4. Category and confidence level

Focus on:
- Edge cases that might not be covered by normal testing
- Boundary conditions around thresholds
- Negative scenarios that should NOT trigger the rule
- Data variations that could cause false positives/negatives
- Performance edge cases

Return JSON response with array of counterexamples:
{
  "counterexamples": [
    {
      "scenario": "Brief scenario description",
      "input": { /* test input data */ },
      "expectedOutput": {
        "triggered": true/false,
        "actions": ["expected actions"],
        "severity": "expected severity",
        "category": "expected category"
      },
      "category": "edge_case|boundary|negative|regression|performance",
      "confidence": 0.95,
      "description": "Why this is a good test case"
    }
  ]
}
`;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert compliance testing engineer specializing in financial regulation DSL testing.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      try {
        const response = JSON.parse(responseText);
        const counterexamples = response.counterexamples.map((ce: any, index: number) => ({
          id: `ce_${rule.id}_${index}`,
          ruleId: rule.id,
          scenario: ce.scenario,
          input: ce.input,
          expectedOutput: ce.expectedOutput,
          passed: false, // Will be set during testing
          description: ce.description,
          category: ce.category,
          confidence: ce.confidence || 0.8,
          metadata: {
            generatedBy: 'ai',
            generationTime: Date.now(),
            complexity,
            relatedRules: [rule.id]
          }
        }));

        return counterexamples;
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return this.generateFallbackCounterexamples(rule, count, categories);
      }

    } catch (error) {
      console.error('AI generation failed:', error);
      return this.generateFallbackCounterexamples(rule, count, categories);
    }
  }

  private generateFallbackCounterexamples(
    rule: DSLRule, 
    count: number, 
    categories: string[]
  ): Counterexample[] {
    const counterexamples: Counterexample[] = [];
    
    // Generate pattern-based counterexamples based on rule content
    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      counterexamples.push(this.createPatternBasedCounterexample(rule, category, i));
    }
    
    return counterexamples;
  }

  private createPatternBasedCounterexample(
    rule: DSLRule, 
    category: string, 
    index: number
  ): Counterexample {
    const baseInput = this.getBaseInputForRule(rule);
    
    switch (category) {
      case 'edge_case':
        return {
          id: `ce_${rule.id}_${index}`,
          ruleId: rule.id,
          scenario: `Edge case: ${rule.name} with unusual data patterns`,
          input: this.createEdgeCaseInput(baseInput),
          expectedOutput: {
            triggered: false,
            actions: [],
            severity: 'LOW',
            category: rule.category
          },
          passed: false,
          description: 'Tests unusual data patterns that might cause false positives',
          category: 'edge_case',
          confidence: 0.7,
          metadata: {
            generatedBy: 'hybrid',
            generationTime: Date.now(),
            complexity: 'medium',
            relatedRules: [rule.id]
          }
        };

      case 'boundary':
        return {
          id: `ce_${rule.id}_${index}`,
          ruleId: rule.id,
          scenario: `Boundary condition: ${rule.name} at threshold limits`,
          input: this.createBoundaryInput(baseInput),
          expectedOutput: {
            triggered: true,
            actions: ['flag "Boundary condition test"'],
            severity: 'MEDIUM',
            category: rule.category
          },
          passed: false,
          description: 'Tests behavior at exact threshold boundaries',
          category: 'boundary',
          confidence: 0.8,
          metadata: {
            generatedBy: 'hybrid',
            generationTime: Date.now(),
            complexity: 'medium',
            relatedRules: [rule.id]
          }
        };

      case 'negative':
        return {
          id: `ce_${rule.id}_${index}`,
          ruleId: rule.id,
          scenario: `Negative test: ${rule.name} should not trigger`,
          input: this.createNegativeInput(baseInput),
          expectedOutput: {
            triggered: false,
            actions: [],
            severity: 'LOW',
            category: rule.category
          },
          passed: false,
          description: 'Tests scenarios that should NOT trigger the rule',
          category: 'negative',
          confidence: 0.9,
          metadata: {
            generatedBy: 'hybrid',
            generationTime: Date.now(),
            complexity: 'low',
            relatedRules: [rule.id]
          }
        };

      default:
        return {
          id: `ce_${rule.id}_${index}`,
          ruleId: rule.id,
          scenario: `General test: ${rule.name}`,
          input: baseInput,
          expectedOutput: {
            triggered: true,
            actions: ['flag "General test"'],
            severity: 'MEDIUM',
            category: rule.category
          },
          passed: false,
          description: 'General test case',
          category: 'regression',
          confidence: 0.6,
          metadata: {
            generatedBy: 'hybrid',
            generationTime: Date.now(),
            complexity: 'low',
            relatedRules: [rule.id]
          }
        };
    }
  }

  private getBaseInputForRule(rule: DSLRule): any {
    // Create base input based on rule category and content
    if (rule.category === 'AML' || rule.dsl.includes('transaction')) {
      return {
        transaction: {
          amount: 1000,
          currency: 'USD',
          sourceOfFunds: 'salary',
          timestamp: new Date().toISOString()
        },
        customer: {
          id: 'cust_123',
          riskLevel: 'medium'
        }
      };
    }
    
    if (rule.category === 'KYC' || rule.dsl.includes('customer')) {
      return {
        customer: {
          id: 'cust_123',
          kycVerified: false,
          onboardingStarted: true,
          riskProfile: 'medium'
        }
      };
    }
    
    if (rule.category === 'CLAIMS_PROCESSING' || rule.dsl.includes('claim')) {
      return {
        claim: {
          id: 'claim_123',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          status: 'PENDING',
          amount: 5000
        }
      };
    }
    
    // Default generic input
    return {
      context: {
        timestamp: new Date().toISOString(),
        userId: 'user_123'
      }
    };
  }

  private createEdgeCaseInput(baseInput: any): any {
    const input = JSON.parse(JSON.stringify(baseInput));
    
    // Add edge case modifications
    if (input.transaction) {
      input.transaction.amount = Number.MAX_SAFE_INTEGER;
      input.transaction.currency = 'XXX'; // Invalid currency
      input.transaction.sourceOfFunds = null;
    }
    
    if (input.customer) {
      input.customer.id = '';
      input.customer.riskLevel = 'unknown';
    }
    
    if (input.claim) {
      input.claim.amount = 0;
      input.claim.status = 'UNKNOWN';
    }
    
    return input;
  }

  private createBoundaryInput(baseInput: any): any {
    const input = JSON.parse(JSON.stringify(baseInput));
    
    // Find threshold in rule and create boundary conditions
    const amountMatch = rule.dsl.match(/transaction\.amount\s*>\s*(\d+)/);
    if (amountMatch && input.transaction) {
      const threshold = parseInt(amountMatch[1]);
      input.transaction.amount = threshold + 1; // Just above threshold
    }
    
    const timeMatch = rule.dsl.match(/now\(\)\s*-\s*(\d+)h/);
    if (timeMatch && input.claim) {
      const hours = parseInt(timeMatch[1]);
      input.claim.submittedAt = new Date(Date.now() - (hours + 1) * 60 * 60 * 1000).toISOString();
    }
    
    return input;
  }

  private createNegativeInput(baseInput: any): any {
    const input = JSON.parse(JSON.stringify(baseInput));
    
    // Create input that should NOT trigger the rule
    if (input.transaction) {
      input.transaction.amount = 100; // Small amount
      input.transaction.sourceOfFunds = 'verified_salary';
    }
    
    if (input.customer) {
      input.customer.kycVerified = true;
      input.customer.onboardingStarted = false;
    }
    
    if (input.claim) {
      input.claim.submittedAt = new Date().toISOString(); // Recent
      input.claim.status = 'APPROVED';
    }
    
    return input;
  }

  async createTestSuite(
    name: string,
    rules: DSLRule[],
    options: {
      description?: string;
      generateCounterexamples?: boolean;
      counterexampleCount?: number;
    } = {}
  ): Promise<TestSuite> {
    const {
      description = `Test suite for ${rules.length} compliance rules`,
      generateCounterexamples = true,
      counterexampleCount = 5
    } = options;

    const testSuite: TestSuite = {
      id: `suite_${Date.now()}`,
      name,
      description,
      rules,
      counterexamples: [],
      coverage: {
        rules: rules.length,
        scenarios: 0,
        edgeCases: 0,
        boundaryConditions: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (generateCounterexamples) {
      for (const rule of rules) {
        const counterexamples = await this.generateCounterexamples(rule, {
          count: counterexampleCount,
          categories: ['edge_case', 'boundary', 'negative']
        });
        
        testSuite.counterexamples.push(...counterexamples);
        testSuite.coverage.scenarios += counterexamples.length;
        testSuite.coverage.edgeCases += counterexamples.filter(ce => ce.category === 'edge_case').length;
        testSuite.coverage.boundaryConditions += counterexamples.filter(ce => ce.category === 'boundary').length;
      }
    }

    this.testSuites.set(testSuite.id, testSuite);
    return testSuite;
  }

  async runRegressionTest(
    testSuiteId: string,
    executeRule: (rule: DSLRule, input: any) => Promise<{
      triggered: boolean;
      actions: string[];
      output: any;
    }>
  ): Promise<RegressionReport> {
    const testSuite = this.testSuites.get(testSuiteId);
    if (!testSuite) {
      throw new Error(`Test suite ${testSuiteId} not found`);
    }

    const startTime = Date.now();
    let passedTests = 0;
    let failedTests = 0;
    const regressions: any[] = [];
    const newFailures: any[] = [];

    // Run all counterexamples
    for (const counterexample of testSuite.counterexamples) {
      try {
        const rule = testSuite.rules.find(r => r.id === counterexample.ruleId);
        if (!rule) continue;

        const actualOutput = await executeRule(rule, counterexample.input);
        counterexample.actualOutput = actualOutput;

        // Check if test passed
        const passed = this.validateCounterexampleResult(counterexample, actualOutput);
        counterexample.passed = passed;

        if (passed) {
          passedTests++;
        } else {
          failedTests++;
          
          // Check if this is a regression (previously passed)
          const previousResult = this.baselineResults.get(counterexample.id);
          if (previousResult && previousResult.passed) {
            regressions.push({
              ruleId: rule.id,
              ruleName: rule.name,
              failureCount: 1,
              scenarios: [counterexample.scenario]
            });
          } else {
            newFailures.push({
              ruleId: rule.id,
              ruleName: rule.name,
              scenarios: [counterexample.scenario]
            });
          }
        }

        // Store result for future regression detection
        this.baselineResults.set(counterexample.id, {
          passed,
          actualOutput,
          timestamp: Date.now()
        });

      } catch (error) {
        console.error(`Error testing counterexample ${counterexample.id}:`, error);
        failedTests++;
        counterexample.passed = false;
      }
    }

    testSuite.updatedAt = new Date();

    const report: RegressionReport = {
      testSuiteId,
      totalTests: testSuite.counterexamples.length,
      passedTests,
      failedTests,
      regressions,
      newFailures,
      performance: {
        generationTime: 0, // Would be tracked during generation
        executionTime: Date.now() - startTime,
        memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed : 0
      },
      recommendations: this.generateRecommendations(regressions, newFailures, testSuite)
    };

    return report;
  }

  private validateCounterexampleResult(
    counterexample: Counterexample,
    actualOutput: any
  ): boolean {
    const expected = counterexample.expectedOutput;
    
    // Check triggered status
    if (expected.triggered !== actualOutput.triggered) {
      return false;
    }
    
    // Check actions (if expected)
    if (expected.actions && expected.actions.length > 0) {
      const expectedActions = new Set(expected.actions);
      const actualActions = new Set(actualOutput.actions);
      
      // Check if all expected actions are present
      for (const action of expectedActions) {
        if (!actualActions.has(action)) {
          return false;
        }
      }
    }
    
    return true;
  }

  private generateRecommendations(
    regressions: any[],
    newFailures: any[],
    testSuite: TestSuite
  ): string[] {
    const recommendations: string[] = [];
    
    if (regressions.length > 0) {
      recommendations.push(
        `${regressions.length} regression(s) detected. Consider reviewing recent changes to affected rules.`
      );
      recommendations.push(
        'Implement additional unit tests for the failing scenarios to prevent future regressions.'
      );
    }
    
    if (newFailures.length > 0) {
      recommendations.push(
        `${newFailures.length} new failure(s) detected. These may indicate gaps in test coverage.`
      );
      recommendations.push(
        'Review the failing scenarios to determine if they represent legitimate issues or test cases that need adjustment.'
      );
    }
    
    const passRate = (testSuite.counterexamples.filter(ce => ce.passed).length / testSuite.counterexamples.length) * 100;
    if (passRate < 80) {
      recommendations.push(
        `Low pass rate (${passRate.toFixed(1)}%). Consider reviewing rule logic and test scenarios.`
      );
    }
    
    if (testSuite.coverage.edgeCases < testSuite.coverage.scenarios * 0.3) {
      recommendations.push(
        'Consider generating more edge case scenarios to improve test coverage.'
      );
    }
    
    return recommendations;
  }

  getTestSuite(id: string): TestSuite | undefined {
    return this.testSuites.get(id);
  }

  getAllTestSuites(): TestSuite[] {
    return Array.from(this.testSuites.values());
  }

  deleteTestSuite(id: string): boolean {
    return this.testSuites.delete(id);
  }

  exportTestSuite(id: string): string {
    const testSuite = this.testSuites.get(id);
    if (!testSuite) {
      throw new Error(`Test suite ${id} not found`);
    }
    
    return JSON.stringify(testSuite, null, 2);
  }

  importTestSuite(jsonData: string): TestSuite {
    const testSuite = JSON.parse(jsonData);
    testSuite.id = `suite_${Date.now()}`; // Generate new ID
    testSuite.createdAt = new Date();
    testSuite.updatedAt = new Date();
    
    this.testSuites.set(testSuite.id, testSuite);
    return testSuite;
  }
}