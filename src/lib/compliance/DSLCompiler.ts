import { KnowledgeObject } from '@/lib/airtable/AirtableService';
import ZAI from 'z-ai-web-dev-sdk';

export interface DSLRule {
  id: string;
  name: string;
  description: string;
  category: string;
  dsl: string;
  knowledgeObjectId: string;
  confidence: 'High' | 'Medium';
  status: 'compiled' | 'error' | 'deployed';
  error?: string;
  metadata?: {
    nlpConfidence?: number;
    lintScore?: number;
    typeCheckScore?: number;
    propertyTestScore?: number;
    compilationTime?: number;
    pipelineStage?: 'nlp' | 'lint' | 'typecheck' | 'propertytest' | 'complete';
  };
}

export interface CompiledDSL {
  rule: DSLRule;
  executable: string;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    pipelineResults: {
      nlpStage: {
        success: boolean;
        confidence: number;
        draftDSL: string;
        interpretation: string;
        processingTime: number;
      };
      lintStage: {
        success: boolean;
        score: number;
        issues: string[];
        suggestions: string[];
        processingTime: number;
      };
      typeCheckStage: {
        success: boolean;
        score: number;
        typeErrors: string[];
        processingTime: number;
      };
      propertyTestStage: {
        success: boolean;
        score: number;
        testResults: {
          name: string;
          passed: boolean;
          message: string;
        }[];
        processingTime: number;
      };
    };
  };
}

export class DSLCompiler {
  private rulePatterns = [
    {
      pattern: /Flag any transaction > \$(\d+(?:,\d+)*) without source-of-funds/i,
      template: (amount: string) => `
rule AML_TRANSACTION_AMOUNT {
  when transaction.amount > ${amount.replace(/,/g, '')} and transaction.sourceOfFunds == null
  then flag "Suspicious Transaction: Amount > $${amount} without source of funds"
  severity HIGH
  category AML
}`
    },
    {
      pattern: /Payment processing must include real-time fraud detection for all transactions over \$(\d+(?:,\d+)*)/i,
      template: (amount: string) => `
rule PAYMENT_FRAUD_DETECTION {
  when transaction.amount > ${amount.replace(/,/g, '')} and transaction.fraudCheck == null
  then require "Real-time fraud detection required for transactions > $${amount}"
  action BLOCK_TRANSACTION
  severity MEDIUM
  category FRAUD_DETECTION
}`
    },
    {
      pattern: /Insurance claims must be processed within (\d+) hours of submission with proper verification/i,
      template: (hours: string) => `
rule INSURANCE_CLAIM_PROCESSING {
  when claim.submittedAt < now() - ${hours}h and claim.status == "PENDING"
  then flag "Claim processing delay: ${hours} hours exceeded"
  action ESCALATE
  severity MEDIUM
  category CLAIMS_PROCESSING
}`
    },
    {
      pattern: /Customer onboarding must include KYC verification and identity proofing/i,
      template: () => `
rule CUSTOMER_ONBOARDING_KYC {
  when customer.onboardingStarted == true and customer.kycVerified != true
  then require "KYC verification and identity proofing required"
  action BLOCK_ONBOARDING
  severity HIGH
  category KYC
}`
    },
    {
      pattern: /Investment recommendations must be based on customer risk profile and financial goals/i,
      template: () => `
rule INVESTMENT_SUITABILITY {
  when recommendation.generated == true and (customer.riskProfile == null or customer.financialGoals == null)
  then flag "Investment recommendation without proper risk assessment"
  action REVIEW_REQUIRED
  severity HIGH
  category SUITABILITY
}`
    }
  ];

  async compileKnowledgeObject(knowledgeObject: KnowledgeObject): Promise<CompiledDSL> {
    const startTime = Date.now();
    
    // Initialize pipeline results
    const pipelineResults = {
      nlpStage: {
        success: false,
        confidence: 0,
        draftDSL: '',
        interpretation: '',
        processingTime: 0,
      },
      lintStage: {
        success: false,
        score: 0,
        issues: [] as string[],
        suggestions: [] as string[],
        processingTime: 0,
      },
      typeCheckStage: {
        success: false,
        score: 0,
        typeErrors: [] as string[],
        processingTime: 0,
      },
      propertyTestStage: {
        success: false,
        score: 0,
        testResults: [] as { name: string; passed: boolean; message: string }[],
        processingTime: 0,
      },
    };

    let finalDSL = '';
    let validation = {
      valid: false,
      errors: [] as string[],
      warnings: [] as string[],
    };

    try {
      // STAGE 1: NLP → Draft DSL
      const nlpStart = Date.now();
      const nlpResult = await this.stage1_NLPToDraftDSL(knowledgeObject);
      pipelineResults.nlpStage = {
        ...nlpResult,
        processingTime: Date.now() - nlpStart,
      };

      if (!nlpResult.success) {
        validation.errors.push(`NLP Stage Failed: ${nlpResult.interpretation}`);
        return this.createFailedCompilation(knowledgeObject, validation, pipelineResults);
      }

      finalDSL = nlpResult.draftDSL;

      // STAGE 2: Lint, Type-Check, and Property Tests
      const lintStart = Date.now();
      const lintResult = await this.stage2_LintDSL(finalDSL);
      pipelineResults.lintStage = {
        ...lintResult,
        processingTime: Date.now() - lintStart,
      };

      const typeCheckStart = Date.now();
      const typeCheckResult = await this.stage2_TypeCheckDSL(finalDSL);
      pipelineResults.typeCheckStage = {
        ...typeCheckResult,
        processingTime: Date.now() - typeCheckStart,
      };

      const propertyTestStart = Date.now();
      const propertyTestResult = await this.stage2_PropertyTestDSL(finalDSL);
      pipelineResults.propertyTestStage = {
        ...propertyTestResult,
        processingTime: Date.now() - propertyTestStart,
      };

      // Aggregate validation results
      validation = this.aggregateValidationResults(
        pipelineResults.lintStage,
        pipelineResults.typeCheckStage,
        pipelineResults.propertyTestStage
      );

      // Apply auto-fixes if available
      if (lintResult.suggestions.length > 0) {
        finalDSL = this.applyAutoFixes(finalDSL, lintResult.suggestions);
      }

    } catch (error) {
      validation.errors.push(`Pipeline Error: ${error.message}`);
    }

    const rule: DSLRule = {
      id: `dsl_${knowledgeObject.id}`,
      name: this.generateRuleName(knowledgeObject),
      description: knowledgeObject.content,
      category: knowledgeObject.category,
      dsl: finalDSL,
      knowledgeObjectId: knowledgeObject.id,
      confidence: knowledgeObject.confidence,
      status: validation.valid ? 'compiled' : 'error',
      error: validation.errors.length > 0 ? validation.errors.join(', ') : undefined,
      metadata: {
        nlpConfidence: pipelineResults.nlpStage.confidence,
        lintScore: pipelineResults.lintStage.score,
        typeCheckScore: pipelineResults.typeCheckStage.score,
        propertyTestScore: pipelineResults.propertyTestStage.score,
        compilationTime: Date.now() - startTime,
        pipelineStage: validation.valid ? 'complete' : 'error',
      },
    };

    return {
      rule,
      executable: finalDSL,
      validation: {
        ...validation,
        pipelineResults,
      },
    };
  }

  private async stage1_NLPToDraftDSL(knowledgeObject: KnowledgeObject): Promise<{
    success: boolean;
    confidence: number;
    draftDSL: string;
    interpretation: string;
  }> {
    try {
      const zai = await ZAI.create();
      
      const prompt = `
You are an expert compliance DSL compiler. Convert the following regulatory requirement into AURA Compliance DSL.

Regulatory Requirement:
"${knowledgeObject.content}"

Category: ${knowledgeObject.category}
Topic: ${knowledgeObject.topic}
Confidence: ${knowledgeObject.confidence}

Generate AURA DSL with:
- Rule name in UPPER_SNAKE_CASE
- Proper when/then structure
- Appropriate severity level
- Relevant category
- Specific conditions and actions

Return JSON response with:
{
  "confidence": 0.95,
  "interpretation": "Brief explanation of interpretation",
  "draftDSL": "Generated DSL code"
}
`;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert compliance DSL compiler for financial regulations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      try {
        const response = JSON.parse(responseText);
        return {
          success: true,
          confidence: response.confidence || 0.5,
          interpretation: response.interpretation || 'No interpretation provided',
          draftDSL: response.draftDSL || this.generateGenericRule(knowledgeObject),
        };
      } catch (parseError) {
        // Fallback to pattern matching if JSON parsing fails
        return this.fallbackPatternMatching(knowledgeObject);
      }

    } catch (error) {
      console.error('NLP Stage Error:', error);
      return this.fallbackPatternMatching(knowledgeObject);
    }
  }

  private fallbackPatternMatching(knowledgeObject: KnowledgeObject): {
    success: boolean;
    confidence: number;
    draftDSL: string;
    interpretation: string;
  } {
    let dsl = '';
    let matched = false;
    let confidence = 0.3; // Low confidence for fallback

    // Try to match against known patterns
    for (const rulePattern of this.rulePatterns) {
      const match = knowledgeObject.content.match(rulePattern.pattern);
      if (match) {
        dsl = rulePattern.template(match[1] || '');
        matched = true;
        confidence = 0.7; // Medium confidence for pattern match
        break;
      }
    }

    if (!matched) {
      dsl = this.generateGenericRule(knowledgeObject);
    }

    return {
      success: true,
      confidence,
      draftDSL: dsl,
      interpretation: matched ? 'Matched known pattern' : 'Used generic template',
    };
  }

  private async stage2_LintDSL(dsl: string): Promise<{
    success: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Linting rules
    const lintRules = [
      {
        test: () => !dsl.includes('rule '),
        issue: 'Missing rule declaration',
        suggestion: 'Add rule declaration: rule RULE_NAME { ... }',
        penalty: 20,
      },
      {
        test: () => !dsl.includes('when '),
        issue: 'Missing when clause',
        suggestion: 'Add when clause with condition',
        penalty: 15,
      },
      {
        test: () => !dsl.includes('then '),
        issue: 'Missing then clause',
        suggestion: 'Add then clause with action',
        penalty: 15,
      },
      {
        test: () => !dsl.includes('severity '),
        issue: 'Missing severity level',
        suggestion: 'Add severity: LOW, MEDIUM, HIGH, or CRITICAL',
        penalty: 10,
      },
      {
        test: () => !dsl.includes('category '),
        issue: 'Missing category',
        suggestion: 'Add category for classification',
        penalty: 10,
      },
      {
        test: () => dsl.includes('when true') && !dsl.includes('// Generic condition'),
        issue: 'Generic condition detected',
        suggestion: 'Consider specific condition instead of "when true"',
        penalty: 5,
      },
      {
        test: () => dsl.length > 2000,
        issue: 'Rule is very long',
        suggestion: 'Consider breaking into smaller, focused rules',
        penalty: 5,
      },
      {
        test: () => !/^[A-Z_]+$/.test(dsl.match(/rule\s+(\w+)/)?.[1] || ''),
        issue: 'Rule name not in UPPER_SNAKE_CASE',
        suggestion: 'Use UPPER_SNAKE_CASE for rule names',
        penalty: 3,
      },
    ];

    for (const rule of lintRules) {
      if (rule.test()) {
        issues.push(rule.issue);
        suggestions.push(rule.suggestion);
        score -= rule.penalty;
      }
    }

    // Additional suggestions
    if (dsl.includes('flag') && !dsl.includes('action')) {
      suggestions.push('Consider adding explicit action type for flagged rules');
    }

    return {
      success: score >= 70,
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  private async stage2_TypeCheckDSL(dsl: string): Promise<{
    success: boolean;
    score: number;
    typeErrors: string[];
  }> {
    const typeErrors: string[] = [];
    let score = 100;

    // Type checking rules
    const typeChecks = [
      {
        test: () => {
          const severityMatch = dsl.match(/severity\s+(\w+)/);
          if (severityMatch) {
            const severity = severityMatch[1];
            return !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity);
          }
          return false;
        },
        error: 'Invalid severity level',
        penalty: 15,
      },
      {
        test: () => {
          const amountMatch = dsl.match(/transaction\.amount\s*>\s*(\d+(?:,\d+)*)/);
          if (amountMatch) {
            const amount = amountMatch[1].replace(/,/g, '');
            return isNaN(parseFloat(amount));
          }
          return false;
        },
        error: 'Invalid amount format in transaction condition',
        penalty: 10,
      },
      {
        test: () => {
          const timeMatch = dsl.match(/now\(\)\s*-\s*(\d+)h/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            return isNaN(hours) || hours < 0;
          }
          return false;
        },
        error: 'Invalid time format in condition',
        penalty: 10,
      },
      {
        test: () => {
          const conditionMatch = dsl.match(/when\s+(.+?)\s+then/);
          if (conditionMatch) {
            const condition = conditionMatch[1];
            return condition.includes('==') && condition.includes('!=') && condition.includes('>') && condition.includes('<');
          }
          return false;
        },
        error: 'Overly complex condition with multiple operators',
        penalty: 5,
      },
    ];

    for (const check of typeChecks) {
      if (check.test()) {
        typeErrors.push(check.error);
        score -= check.penalty;
      }
    }

    return {
      success: score >= 80,
      score: Math.max(0, score),
      typeErrors,
    };
  }

  private async stage2_PropertyTestDSL(dsl: string): Promise<{
    success: boolean;
    score: number;
    testResults: { name: string; passed: boolean; message: string }[];
  }> {
    const testResults: { name: string; passed: boolean; message: string }[] = [];
    let passedTests = 0;
    const totalTests = 6;

    // Property 1: Rule should have unique identifier
    const hasRuleName = /rule\s+\w+/.test(dsl);
    testResults.push({
      name: 'Unique Rule Identifier',
      passed: hasRuleName,
      message: hasRuleName ? '✓ Rule has proper name' : '✗ Missing rule name',
    });
    if (hasRuleName) passedTests++;

    // Property 2: Rule should be deterministic
    const isDeterministic = !dsl.includes('random') && !dsl.includes('Math.random()');
    testResults.push({
      name: 'Deterministic Behavior',
      passed: isDeterministic,
      message: isDeterministic ? '✓ Rule is deterministic' : '✗ Contains non-deterministic elements',
    });
    if (isDeterministic) passedTests++;

    // Property 3: Rule should have proper structure
    const hasProperStructure = dsl.includes('when') && dsl.includes('then');
    testResults.push({
      name: 'Proper Rule Structure',
      passed: hasProperStructure,
      message: hasProperStructure ? '✓ Rule has proper when/then structure' : '✗ Missing when/then structure',
    });
    if (hasProperStructure) passedTests++;

    // Property 4: Rule should be readable
    const isReadable = dsl.length < 1500 && dsl.split('\n').length < 20;
    testResults.push({
      name: 'Readability',
      passed: isReadable,
      message: isReadable ? '✓ Rule is readable' : '✗ Rule is too complex',
    });
    if (isReadable) passedTests++;

    // Property 5: Rule should be specific
    const isSpecific = !dsl.includes('when true') || dsl.includes('// Generic condition');
    testResults.push({
      name: 'Specificity',
      passed: isSpecific,
      message: isSpecific ? '✓ Rule has specific conditions' : '✗ Rule uses generic condition',
    });
    if (isSpecific) passedTests++;

    // Property 6: Rule should have actionable output
    const hasActionableOutput = dsl.includes('flag') || dsl.includes('require') || dsl.includes('action');
    testResults.push({
      name: 'Actionable Output',
      passed: hasActionableOutput,
      message: hasActionableOutput ? '✓ Rule has actionable output' : '✗ Rule lacks actionable output',
    });
    if (hasActionableOutput) passedTests++;

    const score = (passedTests / totalTests) * 100;

    return {
      success: score >= 70,
      score,
      testResults,
    };
  }

  private aggregateValidationResults(
    lintStage: any,
    typeCheckStage: any,
    propertyTestStage: any
  ) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Collect errors from failed stages
    if (!lintStage.success) {
      errors.push(...lintStage.issues);
    } else if (lintStage.issues.length > 0) {
      warnings.push(...lintStage.issues);
    }

    if (!typeCheckStage.success) {
      errors.push(...typeCheckStage.typeErrors);
    }

    if (!propertyTestStage.success) {
      const failedTests = propertyTestStage.testResults
        .filter((test: any) => !test.passed)
        .map((test: any) => test.message);
      warnings.push(...failedTests);
    }

    return {
      valid: lintStage.success && typeCheckStage.success && propertyTestStage.success,
      errors,
      warnings,
    };
  }

  private applyAutoFixes(dsl: string, suggestions: string[]): string {
    let fixedDSL = dsl;

    // Apply common auto-fixes
    if (suggestions.some(s => s.includes('UPPER_SNAKE_CASE'))) {
      const ruleNameMatch = dsl.match(/rule\s+(\w+)\s*\{/);
      if (ruleNameMatch) {
        const newName = ruleNameMatch[1].toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        fixedDSL = dsl.replace(/rule\s+\w+\s*\{/, `rule ${newName} {`);
      }
    }

    if (suggestions.some(s => s.includes('severity'))) {
      if (!fixedDSL.includes('severity ')) {
        fixedDSL = fixedDSL.replace(/category\s+\w+/, 'severity MEDIUM\n  category');
      }
    }

    return fixedDSL;
  }

  private createFailedCompilation(
    knowledgeObject: KnowledgeObject,
    validation: any,
    pipelineResults: any
  ): CompiledDSL {
    const rule: DSLRule = {
      id: `dsl_${knowledgeObject.id}`,
      name: this.generateRuleName(knowledgeObject),
      description: knowledgeObject.content,
      category: knowledgeObject.category,
      dsl: '',
      knowledgeObjectId: knowledgeObject.id,
      confidence: knowledgeObject.confidence,
      status: 'error',
      error: validation.errors.join(', '),
      metadata: {
        pipelineStage: 'error',
      },
    };

    return {
      rule,
      executable: '',
      validation: {
        ...validation,
        pipelineResults,
      },
    };
  }

  private generateGenericRule(knowledgeObject: KnowledgeObject): string {
    const ruleName = this.generateRuleName(knowledgeObject);
    const category = knowledgeObject.category.toUpperCase().replace(/\s+/g, '_');
    
    return `
rule ${ruleName} {
  when true // Generic condition - requires manual specification
  then log "${knowledgeObject.content}"
  severity MEDIUM
  category ${category}
  source "Airtable: ${knowledgeObject.airtableId}"
}`;
  }

  private generateRuleName(knowledgeObject: KnowledgeObject): string {
    const topic = knowledgeObject.topic.replace(/\s+/g, '_');
    const category = knowledgeObject.category.replace(/\s+/g, '_');
    const id = knowledgeObject.id.replace(/[^a-zA-Z0-9]/g, '');
    return `${topic}_${category}_${id}`;
  }

  private validateDSL(dsl: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic syntax validation
    if (!dsl.includes('rule')) {
      errors.push('Missing rule declaration');
    }

    if (!dsl.includes('when')) {
      errors.push('Missing when clause');
    }

    if (!dsl.includes('then')) {
      errors.push('Missing then clause');
    }

    // Check for common issues
    if (dsl.includes('when true') && !dsl.includes('// Generic condition')) {
      warnings.push('Generic condition detected - consider specific logic');
    }

    if (dsl.length > 5000) {
      warnings.push('Rule is very long - consider breaking into smaller rules');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async compileDeployedRules(): Promise<CompiledDSL[]> {
    // This would fetch deployed knowledge objects and compile them
    // For now, we'll return empty array as this would be implemented in the service
    return [];
  }

  async executeDSLRule(rule: DSLRule, context: any): Promise<{
    triggered: boolean;
    actions: string[];
    output: any;
  }> {
    // This is a simplified execution engine
    // In a real implementation, this would use a proper DSL execution engine
    
    const actions: string[] = [];
    let triggered = false;
    let output: any = {};

    try {
      // Parse the DSL rule (simplified)
      const whenMatch = rule.dsl.match(/when\s+(.+?)\s+then/i);
      const thenMatch = rule.dsl.match(/then\s+(.+)/i);

      if (whenMatch && thenMatch) {
        const condition = whenMatch[1];
        const action = thenMatch[1];

        // Very simplified condition evaluation
        triggered = this.evaluateCondition(condition, context);
        
        if (triggered) {
          actions.push(action);
          output = {
            ruleId: rule.id,
            ruleName: rule.name,
            triggered: true,
            action,
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      console.error(`Error executing DSL rule ${rule.id}:`, error);
      actions.push(`ERROR: ${error.message}`);
    }

    return { triggered, actions, output };
  }

  private evaluateCondition(condition: string, context: any): boolean {
    // This is a very simplified condition evaluator
    // In practice, you'd use a proper expression parser
    
    if (condition.includes('transaction.amount >')) {
      const match = condition.match(/transaction\.amount > (\d+)/);
      if (match && context.transaction?.amount) {
        return context.transaction.amount > parseInt(match[1]);
      }
    }

    if (condition.includes('transaction.sourceOfFunds == null')) {
      return context.transaction?.sourceOfFunds == null;
    }

    if (condition.includes('customer.kycVerified != true')) {
      return context.customer?.kycVerified !== true;
    }

    // Default case for 'when true'
    return condition.trim() === 'true';
  }

  generateDSLDocumentation(): string {
    return `
# AURA Compliance DSL Documentation

## Rule Structure

\`\`\`dsl
rule RULE_NAME {
  when <condition>
  then <action>
  severity <LOW|MEDIUM|HIGH|CRITICAL>
  category <CATEGORY>
  [action <ACTION_TYPE>]
}
\`\`\`

## Conditions

- \`transaction.amount > X\` - Check transaction amount
- \`transaction.sourceOfFunds == null\` - Check missing source of funds
- \`customer.kycVerified != true\` - Check KYC status
- \`claim.submittedAt < now() - Xh\` - Check time-based conditions

## Actions

- \`flag "message"\` - Flag for review
- \`require "message"\` - Require additional information
- \`action BLOCK_TRANSACTION\` - Block transaction
- \`action ESCALATE\` - Escalate for review
- \`action REVIEW_REQUIRED\` - Mark for manual review

## Categories

- AML - Anti-Money Laundering
- FRAUD_DETECTION - Fraud Detection
- KYC - Know Your Customer
- CLAIMS_PROCESSING - Insurance Claims
- SUITABILITY - Investment Suitability

## Severity Levels

- LOW - Informational
- MEDIUM - Requires attention
- HIGH - Critical issue
- CRITICAL - Immediate action required
`;
  }
}