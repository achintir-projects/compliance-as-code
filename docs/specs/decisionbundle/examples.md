---
sidebar_position: 3
---

# DecisionBundle Examples

This section provides practical examples of DecisionBundles for various regulatory domains and use cases. Each example demonstrates different aspects of the DecisionBundle specification.

## Table of Contents

1. [Basic GDPR Compliance](#basic-gdpr-compliance)
2. [AML Transaction Monitoring](#aml-transaction-monitoring)
3. [Healthcare HIPAA Compliance](#healthcare-hipaa-compliance)
4. [ESG Environmental Reporting](#esg-environmental-reporting)
5. [Multi-Jurisdictional Compliance](#multi-jurisdictional-compliance)

## Basic GDPR Compliance

This example demonstrates a simple GDPR compliance DecisionBundle for data processing activities.

### Complete Example

```json
{
  "version": "1.0",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "GDPR Data Processing Compliance",
    "description": "DecisionBundle for GDPR compliance in data processing operations",
    "created": "2024-01-15T10:30:00Z",
    "modified": "2024-01-15T10:30:00Z",
    "author": "GlassBox Compliance Team",
    "jurisdiction": "GDPR",
    "domain": "general",
    "tags": ["privacy", "data_protection", "gdpr", "consent"]
  },
  "rules": [
    {
      "id": "rule-gdpr-001",
      "name": "Lawful Basis for Processing",
      "description": "Verify that all data processing has a lawful basis under GDPR Article 6",
      "type": "dsl",
      "definition": {
        "dsl": "WHEN processing_data THEN MUST have_lawful_basis IN [consent, contract, legal_obligation, vital_interests, public_task, legitimate_interests]",
        "parameters": {
          "processing_data": "boolean",
          "have_lawful_basis": "string"
        }
      },
      "severity": "high",
      "category": "data_protection",
      "references": [
        {
          "type": "regulation",
          "id": "GDPR-Article-6",
          "title": "GDPR Article 6: Lawfulness of processing",
          "url": "https://gdpr-info.eu/art-6-gdpr/"
        }
      ]
    },
    {
      "id": "rule-gdpr-002",
      "name": "Data Subject Consent",
      "description": "Verify that consent is freely given, specific, informed, and unambiguous",
      "type": "expression",
      "definition": {
        "expression": "consent_given && consent_specific && consent_informed && consent_unambiguous",
        "variables": {
          "consent_given": "boolean",
          "consent_specific": "boolean",
          "consent_informed": "boolean",
          "consent_unambiguous": "boolean"
        }
      },
      "severity": "high",
      "category": "consent",
      "references": [
        {
          "type": "regulation",
          "id": "GDPR-Article-7",
          "title": "GDPR Article 7: Conditions for consent",
          "url": "https://gdpr-info.eu/art-7-gdpr/"
        }
      ]
    }
  ],
  "decisions": [
    {
      "id": "decision-001",
      "ruleId": "rule-gdpr-001",
      "input": {
        "processing_data": true,
        "have_lawful_basis": "consent"
      },
      "output": {
        "result": true,
        "confidence": 0.95,
        "reason": "Data processing has lawful basis (consent)",
        "evidence": [
          {
            "type": "document",
            "id": "consent-form-001",
            "content": "User consent form dated 2024-01-10",
            "timestamp": "2024-01-10T14:30:00Z"
          }
        ]
      },
      "timestamp": "2024-01-15T10:35:00Z",
      "executor": "compliance-engine-v1.0",
      "context": {
        "user_id": "user-123",
        "session_id": "session-456"
      }
    }
  ],
  "evidence": [
    {
      "id": "evidence-001",
      "type": "document",
      "content": {
        "document_type": "privacy_policy",
        "version": "2.1",
        "url": "/privacy-policy-v2.1.pdf"
      },
      "timestamp": "2024-01-10T10:00:00Z",
      "source": "document-management-system",
      "hash": "sha256:abc123..."
    }
  ]
}
```

### Key Features Demonstrated

1. **Complete Metadata**: Includes all required fields plus optional tags
2. **Multiple Rule Types**: Both DSL and expression rules
3. **Regulatory References**: Links to specific GDPR articles
4. **Evidence Chain**: Supporting documentation with cryptographic hashes
5. **Context Information**: Additional context for decision execution

## AML Transaction Monitoring

This example shows a more complex DecisionBundle for Anti-Money Laundering compliance in financial transactions.

### Complete Example

```json
{
  "version": "1.0",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "AML Transaction Monitoring",
    "description": "DecisionBundle for Anti-Money Laundering compliance in financial transactions",
    "created": "2024-01-15T11:00:00Z",
    "modified": "2024-01-15T11:00:00Z",
    "author": "GlassBox Financial Compliance Team",
    "jurisdiction": "FATF",
    "domain": "finance",
    "tags": ["aml", "transaction_monitoring", "financial_crime", "compliance"]
  },
  "rules": [
    {
      "id": "rule-aml-001",
      "name": "Large Cash Transaction",
      "description": "Flag transactions exceeding $10,000 in cash",
      "type": "expression",
      "definition": {
        "expression": "transaction_type == 'cash' && amount >= 10000",
        "variables": {
          "transaction_type": "string",
          "amount": "number"
        }
      },
      "severity": "high",
      "category": "transaction_monitoring",
      "references": [
        {
          "type": "regulation",
          "id": "BSA-Section-5313",
          "title": "Bank Secrecy Act Section 5313",
          "url": "https://www.fincen.gov/statutes_regs/bsa/"
        }
      ]
    },
    {
      "id": "rule-aml-002",
      "name": "Suspicious Pattern Detection",
      "description": "Detect structuring patterns to avoid reporting thresholds",
      "type": "dsl",
      "definition": {
        "dsl": "WHEN customer_transactions THEN IF count_transactions > 5 AND total_amount > 9000 AND max_single_transaction < 10000 THEN FLAG as_structuring",
        "parameters": {
          "customer_transactions": "array",
          "count_transactions": "number",
          "total_amount": "number",
          "max_single_transaction": "number"
        }
      },
      "severity": "high",
      "category": "pattern_detection",
      "references": [
        {
          "type": "regulation",
          "id": "FATF-Recommendation-20",
          "title": "FATF Recommendation 20: Suspicious transaction reporting",
          "url": "https://www.fatf-gafi.org/publications/fatfrecommendations/documents/fatf-recommendations.html"
        }
      ]
    },
    {
      "id": "rule-aml-003",
      "name": "High-Risk Jurisdiction",
      "description": "Flag transactions with high-risk jurisdictions",
      "type": "decision_table",
      "definition": {
        "table": {
          "conditions": [
            {"field": "origin_country", "operator": "in", "value": ["IR", "KP", "SY", "CU", "RU"]},
            {"field": "destination_country", "operator": "in", "value": ["IR", "KP", "SY", "CU", "RU"]},
            {"field": "amount", "operator": ">", "value": 5000}
          ],
          "actions": [
            {"result": false, "reason": "Transaction involves high-risk jurisdiction", "risk_score": 0.8}
          ]
        }
      },
      "severity": "medium",
      "category": "geographic_risk",
      "references": [
        {
          "type": "standard",
          "id": "FATF-High-Risk-Countries",
          "title": "FATF High-Risk Jurisdictions List",
          "url": "https://www.fatf-gafi.org/publications/high-risk-and-other-monitored-jurisdictions/"
        }
      ]
    }
  ],
  "decisions": [
    {
      "id": "decision-aml-001",
      "ruleId": "rule-aml-001",
      "input": {
        "transaction_type": "cash",
        "amount": 15000
      },
      "output": {
        "result": false,
        "confidence": 1.0,
        "reason": "Large cash transaction exceeding $10,000 threshold",
        "evidence": [
          {
            "type": "log",
            "id": "transaction-log-001",
            "content": "Cash transaction of $15,000 detected",
            "timestamp": "2024-01-15T11:05:00Z"
          }
        ]
      },
      "timestamp": "2024-01-15T11:05:00Z",
      "executor": "aml-monitoring-v2.1",
      "context": {
        "transaction_id": "txn-789",
        "customer_id": "cust-456"
      }
    },
    {
      "id": "decision-aml-002",
      "ruleId": "rule-aml-002",
      "input": {
        "customer_transactions": [
          {"amount": 2000, "timestamp": "2024-01-15T10:00:00Z"},
          {"amount": 2500, "timestamp": "2024-01-15T10:15:00Z"},
          {"amount": 1800, "timestamp": "2024-01-15T10:30:00Z"},
          {"amount": 2200, "timestamp": "2024-01-15T10:45:00Z"},
          {"amount": 1500, "timestamp": "2024-01-15T11:00:00Z"},
          {"amount": 1000, "timestamp": "2024-01-15T11:15:00Z"}
        ],
        "count_transactions": 6,
        "total_amount": 11000,
        "max_single_transaction": 2500
      },
      "output": {
        "result": false,
        "confidence": 0.9,
        "reason": "Potential structuring pattern detected - multiple transactions just below reporting threshold",
        "evidence": [
          {
            "type": "metric",
            "id": "pattern-analysis-001",
            "content": "6 transactions totaling $11,000 with max single transaction $2,500",
            "timestamp": "2024-01-15T11:20:00Z"
          }
        ]
      },
      "timestamp": "2024-01-15T11:20:00Z",
      "executor": "aml-monitoring-v2.1",
      "context": {
        "customer_id": "cust-789",
        "analysis_window": "PT1H15M"
      }
    }
  ],
  "evidence": [
    {
      "id": "evidence-aml-001",
      "type": "log",
      "content": {
        "event": "large_cash_transaction",
        "transaction_id": "txn-789",
        "amount": 15000,
        "currency": "USD",
        "customer_id": "cust-456"
      },
      "timestamp": "2024-01-15T11:05:00Z",
      "source": "transaction-system",
      "hash": "sha256:ghi789..."
    },
    {
      "id": "evidence-aml-002",
      "type": "metric",
      "content": {
        "analysis_type": "pattern_detection",
        "customer_id": "cust-789",
        "transaction_count": 6,
        "total_amount": 11000,
        "time_window": "1 hour 15 minutes",
        "structuring_score": 0.9
      },
      "timestamp": "2024-01-15T11:20:00Z",
      "source": "aml-analytics-engine",
      "hash": "sha256:jkl012..."
    }
  ],
  "audit": {
    "created": "2024-01-15T11:00:00Z",
    "modified": "2024-01-15T11:20:00Z",
    "version": "1.0",
    "checksum": "sha256:mno345...",
    "trail": [
      {
        "timestamp": "2024-01-15T11:00:00Z",
        "action": "bundle_created",
        "user": "aml-analyst",
        "details": {
          "reason": "AML compliance monitoring setup"
        }
      },
      {
        "timestamp": "2024-01-15T11:05:00Z",
        "action": "decision_added",
        "user": "aml-monitoring-v2.1",
        "details": {
          "decision_id": "decision-aml-001",
          "rule_id": "rule-aml-001"
        }
      },
      {
        "timestamp": "2024-01-15T11:20:00Z",
        "action": "decision_added",
        "user": "aml-monitoring-v2.1",
        "details": {
          "decision_id": "decision-aml-002",
          "rule_id": "rule-aml-002"
        }
      }
    ]
  }
}
```

### Key Features Demonstrated

1. **Complex Rule Types**: Expression, DSL, and decision table rules
2. **Pattern Detection**: Advanced analytics for suspicious behavior
3. **Audit Trail**: Complete history of bundle modifications
4. **Multiple Evidence Types**: Logs and metrics with cryptographic verification
5. **Risk Scoring**: Quantitative risk assessment in decision outputs

## Healthcare HIPAA Compliance

This example demonstrates healthcare compliance with HIPAA Privacy and Security Rules.

### Complete Example

```json
{
  "version": "1.0",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "HIPAA Privacy and Security Compliance",
    "description": "DecisionBundle for HIPAA compliance in healthcare operations",
    "created": "2024-01-15T12:00:00Z",
    "modified": "2024-01-15T12:00:00Z",
    "author": "GlassBox Healthcare Compliance Team",
    "jurisdiction": "HIPAA",
    "domain": "health",
    "tags": ["hipaa", "privacy", "security", "healthcare", "phi"]
  },
  "rules": [
    {
      "id": "rule-hipaa-001",
      "name": "PHI Access Control",
      "description": "Verify that PHI access is properly authorized and logged",
      "type": "dsl",
      "definition": {
        "dsl": "WHEN phi.access_requested THEN MUST user.authorized = TRUE AND user.role_has_access = TRUE AND access.logged = TRUE AND minimum_necessary = TRUE",
        "parameters": {
          "phi.access_requested": "boolean",
          "user.authorized": "boolean",
          "user.role_has_access": "boolean",
          "access.logged": "boolean",
          "minimum_necessary": "boolean"
        }
      },
      "severity": "high",
      "category": "access_control",
      "references": [
        {
          "type": "regulation",
          "id": "HIPAA-164.312",
          "title": "HIPAA Security Rule - Technical Safeguards",
          "url": "https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html"
        }
      ]
    },
    {
      "id": "rule-hipaa-002",
      "name": "Breach Notification",
      "description": "Ensure breach notification requirements are met",
      "type": "expression",
      "definition": {
        "expression": "breach_detected == false || (breach_assessment_completed == true && affected_individuals_notified_within_60_days == true && hhs_notified_when_required == true)",
        "variables": {
          "breach_detected": "boolean",
          "breach_assessment_completed": "boolean",
          "affected_individuals_notified_within_60_days": "boolean",
          "hhs_notified_when_required": "boolean"
        }
      },
      "severity": "critical",
      "category": "breach_notification",
      "references": [
        {
          "type": "regulation",
          "id": "HIPAA-Breach-Notification",
          "title": "HIPAA Breach Notification Rule",
          "url": "https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html"
        }
      ]
    }
  ],
  "decisions": [
    {
      "id": "decision-hipaa-001",
      "ruleId": "rule-hipaa-001",
      "input": {
        "phi.access_requested": true,
        "user.authorized": true,
        "user.role_has_access": true,
        "access.logged": true,
        "minimum_necessary": true
      },
      "output": {
        "result": true,
        "confidence": 1.0,
        "reason": "PHI access properly authorized and logged",
        "evidence": [
          {
            "type": "log",
            "id": "access-log-001",
            "content": "PHI access granted to Dr. Smith for patient record #12345",
            "timestamp": "2024-01-15T12:05:00Z"
          }
        ]
      },
      "timestamp": "2024-01-15T12:05:00Z",
      "executor": "hipaa-compliance-engine-v1.0",
      "context": {
        "patient_id": "patient-12345",
        "user_id": "user-drsmith",
        "access_type": "view"
      }
    }
  ],
  "evidence": [
    {
      "id": "evidence-hipaa-001",
      "type": "document",
      "content": {
        "document_type": "hipaa_policy",
        "version": "3.0",
        "title": "HIPAA Privacy and Security Policies",
        "url": "/policies/hipaa-v3.0.pdf"
      },
      "timestamp": "2024-01-10T09:00:00Z",
      "source": "policy-management-system",
      "hash": "sha256:pqr678..."
    },
    {
      "id": "evidence-hipaa-002",
      "type": "log",
      "content": {
        "event": "phi_access",
        "user_id": "user-drsmith",
        "patient_id": "patient-12345",
        "access_type": "view",
        "timestamp": "2024-01-15T12:05:00Z",
        "authorization_level": "physician"
      },
      "timestamp": "2024-01-15T12:05:00Z",
      "source": "ehr-system",
      "hash": "sha256:stu901..."
    }
  ]
}
```

### Key Features Demonstrated

1. **Healthcare-Specific Rules**: PHI access control and breach notification
2. **Critical Severity**: High-risk healthcare compliance requirements
3. **Patient Context**: Detailed context including patient and user information
4. **Policy References**: Links to specific HIPAA regulatory sections
5. **System Integration**: Evidence from EHR and policy management systems

## ESG Environmental Reporting

This example shows ESG compliance for environmental reporting requirements.

### Complete Example

```json
{
  "version": "1.0",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "ESG Environmental Reporting",
    "description": "DecisionBundle for ESG environmental compliance and reporting",
    "created": "2024-01-15T13:00:00Z",
    "modified": "2024-01-15T13:00:00Z",
    "author": "GlassBox ESG Compliance Team",
    "jurisdiction": "EU-Taxonomy",
    "domain": "esg",
    "tags": ["esg", "environmental", "sustainability", "reporting", "eu-taxonomy"]
  },
  "rules": [
    {
      "id": "rule-esg-001",
      "name": "Carbon Emissions Reporting",
      "description": "Verify that all carbon emissions are properly reported",
      "type": "dsl",
      "definition": {
        "dsl": "WHEN reporting.quarterly = TRUE THEN MUST emissions.scope1_reported = TRUE AND emissions.scope2_reported = TRUE AND emissions.scope3_reported = TRUE AND reporting.verified = TRUE",
        "parameters": {
          "reporting.quarterly": "boolean",
          "emissions.scope1_reported": "boolean",
          "emissions.scope2_reported": "boolean",
          "emissions.scope3_reported": "boolean",
          "reporting.verified": "boolean"
        }
      },
      "severity": "medium",
      "category": "environmental_reporting",
      "references": [
        {
          "type": "standard",
          "id": "EU-Taxonomy-Climate",
          "title": "EU Taxonomy Climate Delegated Act",
          "url": "https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/sustainable-finance/eu-taxonomy-sustainable-finance_en"
        }
      ]
    },
    {
      "id": "rule-esg-002",
      "name": "Sustainable Investment Screening",
      "description": "Screen investments for sustainability criteria",
      "type": "decision_table",
      "definition": {
        "table": {
          "conditions": [
            {"field": "investment.esg_rating", "operator": ">=", "value": 7},
            {"field": "investment.carbon_footprint_calculated", "operator": "=", "value": true},
            {"field": "investment.impact_reported", "operator": "=", "value": true},
            {"field": "investment.controversial_activities", "operator": "=", "value": false}
          ],
          "actions": [
            {"result": true, "reason": "Investment meets sustainability criteria", "esg_score": 8.5}
          ]
        }
      },
      "severity": "low",
      "category": "investment_screening",
      "references": [
        {
          "type": "standard",
          "id": "SFDR",
          "title": "Sustainable Finance Disclosure Regulation",
          "url": "https://finance.ec.europa.eu/sustainable-finance/sustainable-finance-disclosure-regulation_en"
        }
      ]
    }
  ],
  "decisions": [
    {
      "id": "decision-esg-001",
      "ruleId": "rule-esg-001",
      "input": {
        "reporting.quarterly": true,
        "emissions.scope1_reported": true,
        "emissions.scope2_reported": true,
        "emissions.scope3_reported": true,
        "reporting.verified": true
      },
      "output": {
        "result": true,
        "confidence": 0.95,
        "reason": "All carbon emissions properly reported and verified",
        "evidence": [
          {
            "type": "document",
            "id": "emissions-report-2024-Q1",
            "content": "Q1 2024 Carbon Emissions Report",
            "timestamp": "2024-01-15T13:05:00Z"
          }
        ]
      },
      "timestamp": "2024-01-15T13:05:00Z",
      "executor": "esg-compliance-engine-v1.0",
      "context": {
        "reporting_period": "2024-Q1",
        "verification_body": "third-party-auditor"
      }
    }
  ],
  "evidence": [
    {
      "id": "evidence-esg-001",
      "type": "document",
      "content": {
        "document_type": "emissions_report",
        "period": "2024-Q1",
        "scope1_emissions": 1250.5,
        "scope2_emissions": 890.2,
        "scope3_emissions": 2340.8,
        "total_emissions": 4481.5,
        "unit": "tons_CO2e",
        "verification_status": "verified"
      },
      "timestamp": "2024-01-15T13:00:00Z",
      "source": "esg-reporting-system",
      "hash": "sha256:vwx234..."
    },
    {
      "id": "evidence-esg-002",
      "type": "metric",
      "content": {
        "metric_type": "esg_rating",
        "overall_score": 8.5,
        "environmental_score": 9.0,
        "social_score": 8.0,
        "governance_score": 8.5,
        "rating_agency": "sustainable-ratings-agency",
        "rating_date": "2024-01-10T00:00:00Z"
      },
      "timestamp": "2024-01-10T00:00:00Z",
      "source": "esg-rating-platform",
      "hash": "sha256:yza567..."
    }
  ]
}
```

### Key Features Demonstrated

1. **ESG-Specific Metrics**: Carbon emissions and sustainability scoring
2. **Quantitative Data**: Numerical measurements and ratings
3. **Third-Party Verification**: Evidence from external rating agencies
4. **Regulatory Frameworks**: EU Taxonomy and SFDR compliance
5. **Comprehensive Reporting**: Multi-scope emissions reporting

## Multi-Jurisdictional Compliance

This example demonstrates handling compliance across multiple regulatory frameworks.

### Complete Example

```json
{
  "version": "1.0",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "name": "Multi-Jurisdictional Data Privacy Compliance",
    "description": "DecisionBundle for compliance across GDPR, CCPA, and LGPD",
    "created": "2024-01-15T14:00:00Z",
    "modified": "2024-01-15T14:00:00Z",
    "author": "GlassBox Global Compliance Team",
    "jurisdiction": ["GDPR", "CCPA", "LGPD"],
    "domain": "general",
    "tags": ["multi-jurisdictional", "privacy", "gdpr", "ccpa", "lgpd", "global"]
  },
  "rules": [
    {
      "id": "rule-multi-001",
      "name": "Cross-Border Data Transfer",
      "description": "Ensure compliance with cross-border data transfer requirements",
      "type": "dsl",
      "definition": {
        "dsl": "WHEN data.transferred_international = TRUE THEN MUST (gdpr.applies = TRUE AND (destination.adequacy_decision = TRUE OR safeguards.in_place = TRUE)) AND (ccpa.applies = TRUE AND consumer.consent_obtained = TRUE) AND (lgpd.applies = TRUE AND anpd.authorization = TRUE)",
        "parameters": {
          "data.transferred_international": "boolean",
          "gdpr.applies": "boolean",
          "destination.adequacy_decision": "boolean",
          "safeguards.in_place": "boolean",
          "ccpa.applies": "boolean",
          "consumer.consent_obtained": "boolean",
          "lgpd.applies": "boolean",
          "anpd.authorization": "boolean"
        }
      },
      "severity": "high",
      "category": "data_transfer",
      "references": [
        {
          "type": "regulation",
          "id": "GDPR-Chapter-V",
          "title": "GDPR Chapter V: Transfers of personal data to third countries",
          "url": "https://gdpr-info.eu/chapter-5/"
        },
        {
          "type": "regulation",
          "id": "CCPA-1798.140",
          "title": "CCPA Section 1798.140: Definitions",
          "url": "https://oag.ca.gov/privacy/ccpa"
        },
        {
          "type": "regulation",
          "id": "LGPD-Article-33",
          "title": "LGPD Article 33: International data transfer",
          "url": "https://www.in.gov.br/en/web/guest/artigo/-/asset_publisher/2qj8BwGX5T4Q/content/id/71553981"
        }
      ]
    }
  ],
  "decisions": [
    {
      "id": "decision-multi-001",
      "ruleId": "rule-multi-001",
      "input": {
        "data.transferred_international": true,
        "gdpr.applies": true,
        "destination.adequacy_decision": true,
        "safeguards.in_place": true,
        "ccpa.applies": true,
        "consumer.consent_obtained": true,
        "lgpd.applies": false,
        "anpd.authorization": false
      },
      "output": {
        "result": true,
        "confidence": 0.9,
        "reason": "Cross-border data transfer compliant with applicable regulations (GDPR and CCPA)",
        "evidence": [
          {
            "type": "document",
            "id": "dta-agreement",
            "content": "Data Transfer Agreement with EU adequacy decision",
            "timestamp": "2024-01-15T14:05:00Z"
          }
        ]
      },
      "timestamp": "2024-01-15T14:05:00Z",
      "executor": "multi-jurisdictional-engine-v1.0",
      "context": {
        "destination_country": "United States",
        "data_types": ["personal_data", "sensitive_data"],
        "applicable_regulations": ["GDPR", "CCPA"]
      }
    }
  ],
  "evidence": [
    {
      "id": "evidence-multi-001",
      "type": "document",
      "content": {
        "document_type": "adequacy_decision",
        "jurisdiction": "EU",
        "destination_country": "United States",
        "decision_date": "2023-07-10T00:00:00Z",
        "decision_reference": "EU-US DPF Adequacy Decision"
      },
      "timestamp": "2023-07-10T00:00:00Z",
      "source": "european-commission",
      "hash": "sha256:bcd345..."
    },
    {
      "id": "evidence-multi-002",
      "type": "user_input",
      "content": {
        "consent_type": "international_data_transfer",
        "user_id": "user-67890",
        "consent_given": true,
        "consent_date": "2024-01-10T15:30:00Z",
        "withdrawal_right": true
      },
      "timestamp": "2024-01-10T15:30:00Z",
      "source": "consent-management-system",
      "hash": "sha256:def678..."
    }
  ]
}
```

### Key Features Demonstrated

1. **Multiple Jurisdictions**: Handling GDPR, CCPA, and LGPD simultaneously
2. **Conditional Logic**: Complex rules with multiple regulatory conditions
3. **Jurisdiction-Specific Evidence**: Different evidence types for different regulations
4. **Global Context**: International data transfer scenarios
5. **Regulatory Mapping**: Clear mapping between requirements and evidence

## Best Practices for Creating DecisionBundles

### 1. Use Clear, Descriptive Names
```json
{
  "name": "GDPR Data Processing Compliance",
  "description": "Comprehensive assessment of GDPR compliance for data processing activities"
}
```

### 2. Include Complete Metadata
```json
{
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created": "2024-01-15T10:00:00Z",
    "jurisdiction": "GDPR",
    "domain": "general",
    "tags": ["privacy", "gdpr", "compliance"]
  }
}
```

### 3. Link to Regulatory References
```json
{
  "references": [
    {
      "type": "regulation",
      "id": "GDPR-Article-6",
      "title": "GDPR Article 6: Lawfulness of processing",
      "url": "https://gdpr-info.eu/art-6-gdpr/"
    }
  ]
}
```

### 4. Provide Detailed Evidence
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

### 5. Include Context Information
```json
{
  "context": {
    "user_id": "user-123",
    "session_id": "session-456",
    "transaction_id": "txn-789"
  }
}
```

## Next Steps

- [Download the Schema](./schema.md) for reference
- [Try the SDKs](../../developers/sdks.md) to create your own bundles
- [Explore the Tutorial](../../tutorial/intro.md) for hands-on learning
- [Join the Community](https://github.com/glassbox-ai/glassbox-standard) to share your examples

These examples demonstrate the flexibility and power of the DecisionBundle specification across various regulatory domains. Use them as starting points for your own compliance implementations.