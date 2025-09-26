/**
 * GlassBox JavaScript SDK Examples
 * 
 * This script demonstrates how to use the GlassBox JavaScript SDK for creating,
 * parsing, and executing compliance rules and DecisionBundles.
 */

import {
  DecisionBundle, DecisionBundleBuilder,
  DSLParser, DSLEvaluator,
  // Note: RuleEngine, ExecutionContext, EvidenceManager, and AuditTrail would be implemented similarly
} from './index';

/**
 * Example 1: Create a basic DecisionBundle
 */
function example1BasicDecisionBundle(): void {
  console.log('=== Example 1: Basic DecisionBundle Creation ===');

  // Create a DecisionBundle using the builder
  const builder = new DecisionBundleBuilder();
  builder.setName('GDPR Compliance Check');
  builder.setDescription('Basic GDPR compliance verification');
  builder.setJurisdiction('GDPR');
  builder.setDomain('general');
  builder.setAuthor('Compliance Officer');
  builder.addTag('privacy');
  builder.addTag('gdpr');

  // Add a DSL rule
  const gdprRule = {
    id: 'rule-gdpr-001',
    name: 'Lawful Basis for Processing',
    description: 'Verify that all data processing has a lawful basis under GDPR Article 6',
    type: 'dsl',
    definition: {
      dsl: 'WHEN processing_data THEN MUST have_lawful_basis IN [\'consent\', \'contract\', \'legal_obligation\']',
      parameters: {
        processing_data: 'boolean',
        have_lawful_basis: 'string'
      }
    },
    severity: 'high',
    category: 'data_protection'
  };
  builder.addRule(gdprRule);

  // Build the DecisionBundle
  const bundle = builder.build();

  console.log(`Created DecisionBundle: ${bundle.metadata.name}`);
  console.log(`Bundle ID: ${bundle.metadata.id}`);
  console.log(`Rules count: ${bundle.rules.length}`);
  console.log('JSON representation:');
  console.log(bundle.toJSON(2));
  console.log('');
}

/**
 * Example 2: Parse and evaluate DSL rules
 */
function example2DSLParsingAndEvaluation(): void {
  console.log('=== Example 2: DSL Parsing and Evaluation ===');

  // Initialize parser and evaluator
  const parser = new DSLParser();
  const evaluator = new DSLEvaluator();

  // Example DSL rules
  const dslRules = [
    'WHEN user.age >= 18 THEN MUST account.is_active = TRUE',
    'WHEN transaction.amount > 10000 AND transaction.country IN [\'IR\', \'KP\'] THEN MUST FLAG transaction as_high_risk',
    'WHEN consent.given BEFORE 2024-01-01T00:00:00Z THEN MUST consent.expires AFTER 2024-12-31T23:59:59Z',
    'WHEN email MATCHES \'.*@bank\\.com\' THEN MUST user.is_verified = TRUE'
  ];

  // Test context data
  const testContexts = [
    {
      user: { age: 25, is_verified: false },
      account: { is_active: true },
      processing_data: true
    },
    {
      transaction: { amount: 15000, country: 'IR' },
      processing_data: true
    },
    {
      consent: {
        given: '2023-12-01T10:00:00Z',
        expires: '2025-01-01T00:00:00Z'
      },
      processing_data: true
    },
    {
      email: 'customer@bank.com',
      user: { is_verified: false },
      processing_data: true
    }
  ];

  // Parse and evaluate each rule
  for (let i = 0; i < dslRules.length; i++) {
    const dslRule = dslRules[i];
    console.log(`\nRule ${i + 1}: ${dslRule}`);

    try {
      // Parse the DSL
      const ast = parser.parse(dslRule);
      console.log(`Parsed successfully: ${ast.type}`);

      // Evaluate with context
      const context = testContexts[i];
      const result = evaluator.evaluate(ast, context);

      console.log(`Result: ${result.result}`);
      console.log(`Reason: ${result.reason}`);

    } catch (error) {
      console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('');
}

/**
 * Example 3: Complex DSL parsing with temporal conditions
 */
function example3ComplexDSL(): void {
  console.log('=== Example 3: Complex DSL with Temporal Conditions ===');

  const parser = new DSLParser();
  const evaluator = new DSLEvaluator();

  // Complex DSL rule with temporal conditions
  const complexDSL = 'WHEN session.last_activity WITHIN 30 MINUTES THEN MUST session.is_active = TRUE';
  
  console.log(`Complex DSL: ${complexDSL}`);

  try {
    const ast = parser.parse(complexDSL);
    console.log('AST structure:', JSON.stringify(ast, null, 2));

    // Test with recent activity
    const recentContext = {
      session: {
        last_activity: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        is_active: true
      }
    };

    const recentResult = evaluator.evaluate(ast, recentContext);
    console.log('Recent activity result:', recentResult);

    // Test with old activity
    const oldContext = {
      session: {
        last_activity: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        is_active: false
      }
    };

    const oldResult = evaluator.evaluate(ast, oldContext);
    console.log('Old activity result:', oldResult);

  } catch (error) {
    console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('');
}

/**
 * Example 4: DecisionBundle with multiple rule types
 */
function example4MultipleRuleTypes(): void {
  console.log('=== Example 4: DecisionBundle with Multiple Rule Types ===');

  // Create a DecisionBundle with different rule types
  const builder = new DecisionBundleBuilder();
  builder.setName('Multi-Type Compliance Check');
  builder.setDescription('Bundle with DSL and expression rules');
  builder.setJurisdiction('AML');
  builder.setDomain('finance');

  // Add DSL rule
  const dslRule = {
    id: 'rule-aml-001',
    name: 'Large Transaction Alert',
    description: 'Alert on large transactions from high-risk countries',
    type: 'dsl',
    definition: {
      dsl: 'WHEN transaction.amount > 10000 AND transaction.country IN [\'IR\', \'KP\', \'SY\'] THEN MUST FLAG transaction as_suspicious',
      parameters: {
        'transaction.amount': 'number',
        'transaction.country': 'string'
      }
    },
    severity: 'high',
    category: 'transaction_monitoring'
  };
  builder.addRule(dslRule);

  // Add expression rule (would need RuleEngine to execute)
  const expressionRule = {
    id: 'rule-aml-002',
    name: 'Customer Risk Score',
    description: 'Calculate customer risk score based on factors',
    type: 'expression',
    definition: {
      expression: 'customer.risk_score > 75 and customer.kyc_verified == True',
      variables: {
        'customer.risk_score': 'number',
        'customer.kyc_verified': 'boolean'
      }
    },
    severity: 'medium',
    category: 'risk_assessment'
  };
  builder.addRule(expressionRule);

  // Build the bundle
  const bundle = builder.build();

  console.log(`Created bundle: ${bundle.metadata.name}`);
  console.log(`Total rules: ${bundle.rules.length}`);
  
  // Parse and evaluate the DSL rule
  const parser = new DSLParser();
  const evaluator = new DSLEvaluator();

  const dslRuleData = bundle.rules.find(r => r.type === 'dsl');
  if (dslRuleData) {
    const ast = parser.parse(dslRuleData.definition.dsl);
    
    const testContext = {
      transaction: {
        amount: 15000,
        country: 'IR',
        currency: 'USD'
      }
    };

    const result = evaluator.evaluate(ast, testContext);
    console.log(`DSL rule evaluation result: ${result.result}`);
    console.log(`Reason: ${result.reason}`);
  }

  console.log('');
}

/**
 * Example 5: Error handling
 */
function example5ErrorHandling(): void {
  console.log('=== Example 5: Error Handling ===');

  const parser = new DSLParser();

  // Test invalid DSL
  const invalidDSLs = [
    '', // Empty
    'INVALID SYNTAX', // Invalid syntax
    'WHEN condition THEN', // Incomplete rule
    'WHEN user.age >= 18 THEN MUST', // Missing consequence
  ];

  invalidDSLs.forEach((dsl, index) => {
    console.log(`\nTesting invalid DSL ${index + 1}: "${dsl}"`);
    try {
      const ast = parser.parse(dsl);
      console.log('Unexpected success:', ast);
    } catch (error) {
      console.log('Expected error:', error instanceof Error ? error.message : String(error));
    }
  });

  console.log('');
}

/**
 * Example 6: Working with existing DecisionBundles
 */
function example6ExistingBundle(): void {
  console.log('=== Example 6: Working with Existing DecisionBundles ===');

  // Create a sample DecisionBundle JSON
  const bundleJSON = `{
    "version": "1.0",
    "metadata": {
      "id": "test-bundle-123",
      "name": "Test Compliance Bundle",
      "description": "A test bundle for demonstration",
      "created": "${new Date().toISOString()}",
      "jurisdiction": "TEST",
      "domain": "general",
      "author": "Test Author"
    },
    "rules": [
      {
        "id": "rule-test-001",
        "name": "Test Rule",
        "description": "A test DSL rule",
        "type": "dsl",
        "definition": {
          "dsl": "WHEN user.active THEN MUST user.verified = TRUE",
          "parameters": {
            "user.active": "boolean",
            "user.verified": "boolean"
          }
        },
        "severity": "medium",
        "category": "user_management"
      }
    ],
    "decisions": [],
    "evidence": []
  }`;

  try {
    // Load from JSON
    const bundle = DecisionBundle.fromJSON(bundleJSON);
    
    console.log(`Loaded bundle: ${bundle.metadata.name}`);
    console.log(`Bundle ID: ${bundle.metadata.id}`);
    console.log(`Rules: ${bundle.rules.length}`);
    
    // Get rule by ID
    const rule = bundle.getRuleById('rule-test-001');
    if (rule) {
      console.log(`Found rule: ${rule.name}`);
      
      // Parse and evaluate the rule
      const parser = new DSLParser();
      const evaluator = new DSLEvaluator();
      
      const ast = parser.parse(rule.definition.dsl);
      
      const testContext = {
        user: {
          active: true,
          verified: true
        }
      };
      
      const result = evaluator.evaluate(ast, testContext);
      console.log(`Rule evaluation result: ${result.result}`);
      console.log(`Reason: ${result.reason}`);
    }

    // Convert back to JSON
    const newJSON = bundle.toJSON(2);
    console.log('Successfully converted back to JSON');

  } catch (error) {
    console.log('Error working with bundle:', error instanceof Error ? error.message : String(error));
  }

  console.log('');
}

/**
 * Main function to run all examples
 */
function main(): void {
  console.log('GlassBox JavaScript SDK Examples');
  console.log('='.repeat(50));

  try {
    example1BasicDecisionBundle();
    example2DSLParsingAndEvaluation();
    example3ComplexDSL();
    example4MultipleRuleTypes();
    example5ErrorHandling();
    example6ExistingBundle();

    console.log('All examples completed successfully!');
    
  } catch (error) {
    console.log('Error running examples:', error instanceof Error ? error.message : String(error));
  }
}

// Run the examples if this file is executed directly
if (require.main === module) {
  main();
}

// Export examples for use in other modules
export {
  example1BasicDecisionBundle,
  example2DSLParsingAndEvaluation,
  example3ComplexDSL,
  example4MultipleRuleTypes,
  example5ErrorHandling,
  example6ExistingBundle
};