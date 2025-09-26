---
sidebar_position: 1
---

# DecisionBundle Overview

The **DecisionBundle** is the core data structure of GlassBox Standard v1.0. It provides a standardized format for packaging compliance decisions, rules, and supporting evidence in a single, verifiable bundle.

## What is a DecisionBundle?

A DecisionBundle is a JSON document that contains:

- **Metadata**: Regulatory context, timestamps, and digital signatures
- **Rules**: Compliance rules in various formats (DSL, expressions, decision tables)
- **Decisions**: Results of rule evaluations with supporting evidence
- **Evidence**: Supporting documentation and audit trails
- **Audit**: Complete audit trail with tamper detection

## Key Features

### 📋 Structured Format
- Standardized JSON schema for interoperability
- Support for multiple rule types and formats
- Extensible metadata for regulatory context

### 🔒 Security & Integrity
- Digital signatures for bundle verification
- Cryptographic hashing for evidence integrity
- Tamper-evident audit trails

### 🌐 Interoperability
- Cross-platform compatibility
- Support for multiple regulatory frameworks
- Easy integration with existing systems

### 📊 Comprehensive Tracking
- Complete decision history
- Evidence chain of custody
- Regulatory reference tracking

## Use Cases

### 1. Regulatory Reporting
```json
{
  "metadata": {
    "jurisdiction": "GDPR",
    "domain": "general",
    "author": "Compliance Officer"
  },
  "decisions": [
    {
      "ruleId": "gdpr-consent-001",
      "output": {
        "result": true,
        "reason": "Valid consent obtained"
      }
    }
  ]
}
```

### 2. Audit Evidence
```json
{
  "evidence": [
    {
      "type": "document",
      "content": {
        "document_type": "privacy_policy",
        "version": "2.1"
      },
      "hash": "sha256:abc123..."
    }
  ]
}
```

### 3. Cross-Border Compliance
```json
{
  "metadata": {
    "jurisdiction": ["GDPR", "CCPA"],
    "domain": "international"
  },
  "rules": [
    {
      "references": [
        {
          "type": "regulation",
          "id": "GDPR-Article-6",
          "url": "https://gdpr-info.eu/art-6-gdpr/"
        }
      ]
    }
  ]
}
```

## Benefits

### For Regulators
- **Standardized Format**: Consistent data structure for all submissions
- **Automated Validation**: Schema validation ensures data quality
- **Audit Trail**: Complete history of compliance decisions
- **Evidence Verification**: Cryptographic verification of evidence

### For Organizations
- **Streamlined Reporting**: Single format for multiple regulators
- **Audit Readiness**: Complete documentation always available
- **Cost Reduction**: Reduced manual compliance work
- **Risk Management**: Better visibility into compliance status

### For Developers
- **Clear Specification**: Well-defined JSON schema
- **Multiple SDKs**: Reference implementations available
- **Extensible Design**: Easy to add new features
- **Testing Support**: Comprehensive test scenarios

## Architecture

### Core Components

```
DecisionBundle
├── metadata           // Regulatory context and signatures
├── rules             // Compliance rules and definitions
├── decisions         // Rule evaluation results
├── evidence          // Supporting documentation
└── audit             // Complete audit trail
```

### Rule Types

1. **DSL Rules**: Human-readable domain-specific language
2. **Expression Rules**: Boolean logic expressions
3. **Decision Tables**: Tabular rule definitions
4. **Decision Trees**: Hierarchical decision logic

### Evidence Types

1. **Documents**: Policy documents, contracts, agreements
2. **Logs**: System logs, audit trails, access records
3. **Metrics**: Performance metrics, compliance scores
4. **User Input**: Forms, consent records, acknowledgments

## Getting Started

### 1. Understanding the Schema
The DecisionBundle schema defines the structure and validation rules for all bundles. See the [Schema Documentation](./schema.md) for complete details.

### 2. Creating Your First Bundle
```json
{
  "version": "1.0",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Compliance Bundle",
    "jurisdiction": "GDPR",
    "domain": "general"
  },
  "rules": [],
  "decisions": []
}
```

### 3. Adding Rules
```json
{
  "rules": [
    {
      "id": "rule-001",
      "name": "Consent Validation",
      "type": "dsl",
      "definition": {
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE"
      }
    }
  ]
}
```

### 4. Adding Decisions
```json
{
  "decisions": [
    {
      "id": "decision-001",
      "ruleId": "rule-001",
      "input": {
        "user.consent_given": true
      },
      "output": {
        "result": true,
        "reason": "Consent is properly informed"
      }
    }
  ]
}
```

## Best Practices

### 1. Use Unique Identifiers
Always use UUIDs for bundle, rule, and decision identifiers to ensure uniqueness across systems.

### 2. Include Complete Metadata
Provide comprehensive metadata to ensure proper regulatory context and traceability.

### 3. Sign Your Bundles
Use digital signatures to verify bundle integrity and authenticity.

### 4. Maintain Evidence Chain
Include all supporting evidence with cryptographic hashes for verification.

### 5. Document Regulatory References
Include references to specific regulations, standards, or policies that rules implement.

## Validation

### Schema Validation
All DecisionBundles must validate against the official JSON schema. Use the provided validation tools to ensure compliance.

### Digital Signature Verification
Verify digital signatures to ensure bundle integrity and authenticity.

### Evidence Hash Verification
Verify cryptographic hashes of evidence to ensure data integrity.

## Tools and Resources

### Reference Implementations
- [Python SDK](../../developers/sdks.md#python-sdk)
- [JavaScript SDK](../../developers/sdks.md#javascript-sdk)
- [Java SDK](../../developers/sdks.md#java-sdk)

### Validation Tools
- [JSON Schema Validator](https://json-schema-validator.com)
- [Digital Signature Verifier](../../developers/integration.md#signature-verification)
- [Evidence Hash Calculator](../../developers/integration.md#hash-calculation)

### Examples
- [GDPR Compliance Example](../../examples/gdpr.md)
- [AML Compliance Example](../../examples/aml.md)
- [Healthcare Compliance Example](../../examples/healthcare.md)

## Next Steps

1. **Read the Schema**: Understand the complete [DecisionBundle Schema](./schema.md)
2. **Review Examples**: See [real-world examples](./examples.md) for inspiration
3. **Try the SDKs**: Download [reference implementations](../../developers/sdks.md) for your platform
4. **Join the Community**: Contribute to the [GitHub repository](https://github.com/glassbox-ai/glassbox-standard)

---

**The DecisionBundle is the foundation of modern regulatory compliance.**