---
sidebar_position: 2
---

# DecisionBundle Schema

The DecisionBundle schema defines the structure and validation rules for all GlassBox Standard v1.0 DecisionBundles. This document provides a comprehensive reference for the JSON schema.

## Schema Overview

The DecisionBundle schema is a JSON Schema Draft 7 compliant specification that ensures consistency and interoperability across all implementations.

### Complete Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://glassbox.ai/schemas/decisionbundle/v1.0.json",
  "title": "GlassBox DecisionBundle",
  "description": "A standardized bundle for compliance decisions, rules, and evidence",
  "type": "object",
  "required": ["version", "metadata", "rules", "decisions"],
  "properties": {
    "version": {
      "type": "string",
      "enum": ["1.0"],
      "description": "GlassBox DecisionBundle specification version"
    },
    "metadata": {
      "type": "object",
      "required": ["id", "name", "description", "created", "jurisdiction", "domain"],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Unique identifier for the DecisionBundle"
        },
        "name": {
          "type": "string",
          "description": "Human-readable name of the DecisionBundle"
        },
        "description": {
          "type": "string",
          "description": "Detailed description of the DecisionBundle purpose"
        },
        "created": {
          "type": "string",
          "format": "date-time",
          "description": "Timestamp when the DecisionBundle was created"
        },
        "modified": {
          "type": "string",
          "format": "date-time",
          "description": "Timestamp when the DecisionBundle was last modified"
        },
        "author": {
          "type": "string",
          "description": "Author or organization that created the DecisionBundle"
        },
        "jurisdiction": {
          "type": "string",
          "description": "Jurisdiction or regulatory framework"
        },
        "domain": {
          "type": "string",
          "enum": ["finance", "health", "esg", "general"],
          "description": "Business domain the DecisionBundle applies to"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Tags for categorization and search"
        },
        "signature": {
          "type": "object",
          "properties": {
            "algorithm": {
              "type": "string",
              "enum": ["ES256", "RS256", "HS256"],
              "description": "Signature algorithm used"
            },
            "publicKey": {
              "type": "string",
              "description": "Public key for verification"
            },
            "value": {
              "type": "string",
              "description": "Digital signature value"
            }
          },
          "description": "Digital signature for integrity verification"
        }
      }
    },
    "rules": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "type", "definition"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier for the rule"
          },
          "name": {
            "type": "string",
            "description": "Human-readable name of the rule"
          },
          "description": {
            "type": "string",
            "description": "Detailed description of the rule"
          },
          "type": {
            "type": "string",
            "enum": ["dsl", "expression", "decision_table", "decision_tree"],
            "description": "Type of rule definition"
          },
          "definition": {
            "type": "object",
            "description": "Rule definition content"
          },
          "severity": {
            "type": "string",
            "enum": ["low", "medium", "high", "critical"],
            "description": "Severity level of the rule"
          },
          "category": {
            "type": "string",
            "description": "Category of the rule"
          },
          "references": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": ["regulation", "standard", "policy", "guideline"]
                },
                "id": {
                  "type": "string",
                  "description": "Reference identifier"
                },
                "title": {
                  "type": "string",
                  "description": "Reference title"
                },
                "url": {
                  "type": "string",
                  "format": "uri",
                  "description": "URL to the reference document"
                }
              }
            },
            "description": "Regulatory or policy references"
          }
        }
      },
      "description": "Array of compliance rules"
    },
    "decisions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "ruleId", "input", "output", "timestamp"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier for the decision"
          },
          "ruleId": {
            "type": "string",
            "description": "Reference to the rule that was evaluated"
          },
          "input": {
            "type": "object",
            "description": "Input data used for the decision"
          },
          "output": {
            "type": "object",
            "properties": {
              "result": {
                "type": "boolean",
                "description": "Decision result (pass/fail)"
              },
              "confidence": {
                "type": "number",
                "minimum": 0,
                "maximum": 1,
                "description": "Confidence score of the decision"
              },
              "reason": {
                "type": "string",
                "description": "Explanation of the decision"
              },
              "evidence": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": ["log", "document", "metric", "user_input"]
                    },
                    "id": {
                      "type": "string",
                      "description": "Evidence identifier"
                    },
                    "content": {
                      "type": "string",
                      "description": "Evidence content or reference"
                    },
                    "timestamp": {
                      "type": "string",
                      "format": "date-time",
                      "description": "Evidence timestamp"
                    }
                  }
                },
                "description": "Supporting evidence for the decision"
              }
            },
            "description": "Decision output and metadata"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when the decision was made"
          },
          "executor": {
            "type": "string",
            "description": "System or user that executed the decision"
          },
          "context": {
            "type": "object",
            "description": "Additional context information"
          }
        }
      },
      "description": "Array of compliance decisions"
    },
    "evidence": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "content", "timestamp"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier for the evidence"
          },
          "type": {
            "type": "string",
            "enum": ["log", "document", "metric", "user_input", "system_event"],
            "description": "Type of evidence"
          },
          "content": {
            "type": "object",
            "description": "Evidence content"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "Evidence timestamp"
          },
          "source": {
            "type": "string",
            "description": "Source of the evidence"
          },
          "hash": {
            "type": "string",
            "description": "Cryptographic hash for integrity verification"
          }
        }
      },
      "description": "Array of supporting evidence"
    },
    "audit": {
      "type": "object",
      "properties": {
        "created": {
          "type": "string",
          "format": "date-time",
          "description": "Audit creation timestamp"
        },
        "modified": {
          "type": "string",
          "format": "date-time",
          "description": "Audit modification timestamp"
        },
        "version": {
          "type": "string",
          "description": "Audit version"
        },
        "checksum": {
          "type": "string",
          "description": "Checksum for the entire bundle"
        },
        "trail": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "timestamp": {
                "type": "string",
                "format": "date-time"
              },
              "action": {
                "type": "string"
              },
              "user": {
                "type": "string"
              },
              "details": {
                "type": "object"
              }
            }
          },
          "description": "Audit trail of changes"
        }
      },
      "description": "Audit information for the DecisionBundle"
    }
  }
}
```

## Detailed Field Descriptions

### Top-Level Fields

#### version
- **Type**: string
- **Required**: Yes
- **Enum**: ["1.0"]
- **Description**: The version of the DecisionBundle specification

#### metadata
- **Type**: object
- **Required**: Yes
- **Description**: Metadata about the DecisionBundle

#### rules
- **Type**: array
- **Required**: Yes
- **Description**: Array of compliance rules

#### decisions
- **Type**: array
- **Required**: Yes
- **Description**: Array of compliance decisions

#### evidence
- **Type**: array
- **Required**: No
- **Description**: Array of supporting evidence

#### audit
- **Type**: object
- **Required**: No
- **Description**: Audit information

### Metadata Fields

#### id
- **Type**: string
- **Required**: Yes
- **Format**: UUID
- **Description**: Unique identifier for the DecisionBundle

#### name
- **Type**: string
- **Required**: Yes
- **Description**: Human-readable name

#### description
- **Type**: string
- **Required**: Yes
- **Description**: Detailed description

#### created
- **Type**: string
- **Required**: Yes
- **Format**: date-time
- **Description**: Creation timestamp

#### modified
- **Type**: string
- **Required**: No
- **Format**: date-time
- **Description**: Last modification timestamp

#### author
- **Type**: string
- **Required**: No
- **Description**: Author or organization

#### jurisdiction
- **Type**: string
- **Required**: Yes
- **Description**: Regulatory framework

#### domain
- **Type**: string
- **Required**: Yes
- **Enum**: ["finance", "health", "esg", "general"]
- **Description**: Business domain

#### tags
- **Type**: array of strings
- **Required**: No
- **Description**: Categorization tags

#### signature
- **Type**: object
- **Required**: No
- **Description**: Digital signature

### Rule Fields

#### id
- **Type**: string
- **Required**: Yes
- **Description**: Unique rule identifier

#### name
- **Type**: string
- **Required**: Yes
- **Description**: Human-readable rule name

#### description
- **Type**: string
- **Required**: No
- **Description**: Detailed rule description

#### type
- **Type**: string
- **Required**: Yes
- **Enum**: ["dsl", "expression", "decision_table", "decision_tree"]
- **Description**: Rule type

#### definition
- **Type**: object
- **Required**: Yes
- **Description**: Rule definition content

#### severity
- **Type**: string
- **Required**: No
- **Enum**: ["low", "medium", "high", "critical"]
- **Description**: Severity level

#### category
- **Type**: string
- **Required**: No
- **Description**: Rule category

#### references
- **Type**: array
- **Required**: No
- **Description**: Regulatory references

### Decision Fields

#### id
- **Type**: string
- **Required**: Yes
- **Description**: Unique decision identifier

#### ruleId
- **Type**: string
- **Required**: Yes
- **Description**: Reference to evaluated rule

#### input
- **Type**: object
- **Required**: Yes
- **Description**: Input data

#### output
- **Type**: object
- **Required**: Yes
- **Description**: Decision output

#### timestamp
- **Type**: string
- **Required**: Yes
- **Format**: date-time
- **Description**: Decision timestamp

#### executor
- **Type**: string
- **Required**: No
- **Description**: Execution system/user

#### context
- **Type**: object
- **Required**: No
- **Description**: Additional context

### Evidence Fields

#### id
- **Type**: string
- **Required**: Yes
- **Description**: Unique evidence identifier

#### type
- **Type**: string
- **Required**: Yes
- **Enum**: ["log", "document", "metric", "user_input", "system_event"]
- **Description**: Evidence type

#### content
- **Type**: object
- **Required**: Yes
- **Description**: Evidence content

#### timestamp
- **Type**: string
- **Required**: Yes
- **Format**: date-time
- **Description**: Evidence timestamp

#### source
- **Type**: string
- **Required**: No
- **Description**: Evidence source

#### hash
- **Type**: string
- **Required**: No
- **Description**: Cryptographic hash

## Validation Examples

### Valid DecisionBundle
```json
{
  "version": "1.0",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "GDPR Compliance",
    "description": "GDPR compliance assessment",
    "created": "2024-01-15T10:00:00Z",
    "jurisdiction": "GDPR",
    "domain": "general"
  },
  "rules": [
    {
      "id": "rule-001",
      "name": "Consent Validation",
      "type": "dsl",
      "definition": {
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE"
      }
    }
  ],
  "decisions": [
    {
      "id": "decision-001",
      "ruleId": "rule-001",
      "input": {
        "user.consent_given": true
      },
      "output": {
        "result": true,
        "reason": "Consent is informed"
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Invalid DecisionBundle (Missing Required Fields)
```json
{
  "version": "1.0",
  "metadata": {
    "name": "Invalid Bundle",
    "description": "Missing required id field"
  },
  "rules": [],
  "decisions": []
}
```

This bundle is invalid because:
- Missing required `id` field in metadata
- Missing required `created` field in metadata
- Missing required `jurisdiction` field in metadata
- Missing required `domain` field in metadata

## Implementation Notes

### Schema Versioning
The schema includes a version field to support future evolution. All v1.0 DecisionBundles must use version "1.0".

### UUID Generation
All identifiers should be generated using UUID version 4 to ensure uniqueness across systems.

### Timestamp Format
All timestamps should follow ISO 8601 format with timezone information.

### Digital Signatures
Digital signatures should be applied to the canonical JSON representation of the bundle (excluding the signature field itself).

### Evidence Hashing
Evidence should be hashed using SHA-256 algorithm for integrity verification.

## Validation Tools

### Online Validators
- [JSON Schema Validator](https://www.jsonschemavalidator.net/)
- [JSONLint](https://jsonlint.com/)

### Command Line Tools
```bash
# Validate against schema
ajv validate -s schema.json -d bundle.json

# Check JSON syntax
jsonlint bundle.json
```

### SDK Validation
All reference SDKs include built-in validation functions:

```python
# Python SDK
from glassbox import DecisionBundle
bundle = DecisionBundle.from_file("bundle.json")
bundle.validate()
```

```javascript
// JavaScript SDK
const { DecisionBundle } = require('glassbox-sdk');
const bundle = await DecisionBundle.fromFile('bundle.json');
await bundle.validate();
```

```java
// Java SDK
import ai.glassbox.DecisionBundle;
DecisionBundle bundle = DecisionBundle.fromFile("bundle.json");
bundle.validate();
```

## Next Steps

- [View Examples](./examples.md) for practical implementations
- [Learn about Compliance DSL](../compliance-dsl/overview.md) for rule definitions
- [Download SDKs](../../developers/sdks.md) for your platform
- [Explore Tutorial](../../tutorial/intro.md) for hands-on learning