---
sidebar_position: 3
---

# Creating Compliance Rules

In this section, you'll learn how to create effective compliance rules using the GlassBox Compliance DSL. We'll cover everything from basic rule creation to advanced patterns and best practices.

## Understanding Compliance Rules

### What is a Compliance Rule?

A compliance rule is a formal statement that defines what constitutes compliance with a regulatory requirement. In GlassBox Standard, rules can be expressed in multiple formats:

1. **DSL Rules**: Human-readable domain-specific language
2. **Expression Rules**: Boolean logic expressions
3. **Decision Tables**: Tabular rule definitions
4. **Decision Trees**: Hierarchical decision logic

### Rule Components

Every compliance rule consists of:
- **Metadata**: Identifying information and context
- **Definition**: The actual rule logic
- **Parameters**: Input variables for the rule
- **References**: Links to regulatory requirements
- **Severity**: Risk level of the rule

## Basic Rule Creation

### DSL Rules (Recommended for Beginners)

DSL rules are the most user-friendly way to create compliance rules. They use natural language-like syntax.

#### Simple DSL Rule
```python
from glassbox import ComplianceRule
import uuid

rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Age Verification",
    description="Verify user is at least 18 years old",
    type="dsl",
    definition={
        "dsl": "WHEN user.registration = TRUE THEN MUST user.age >= 18",
        "parameters": {
            "user.registration": "boolean",
            "user.age": "number"
        }
    },
    severity="medium",
    category="user_verification"
)
```

#### Complex DSL Rule
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="GDPR Data Processing",
    description="Ensure lawful basis for data processing",
    type="dsl",
    definition={
        "dsl": "WHEN data.processing = TRUE THEN MUST data.lawful_basis IN [consent, contract, legal_obligation, vital_interests, public_task, legitimate_interests]",
        "parameters": {
            "data.processing": "boolean",
            "data.lawful_basis": "string"
        }
    },
    severity="high",
    category="data_protection",
    references=[
        {
            "type": "regulation",
            "id": "GDPR-Article-6",
            "title": "GDPR Article 6: Lawfulness of processing",
            "url": "https://gdpr-info.eu/art-6-gdpr/"
        }
    ]
)
```

### Expression Rules

Expression rules use boolean logic and are good for developers familiar with programming.

#### Simple Expression Rule
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Transaction Limit",
    description="Check if transaction exceeds limit",
    type="expression",
    definition={
        "expression": "transaction.amount <= 10000",
        "variables": {
            "transaction.amount": "number"
        }
    },
    severity="medium",
    category="transaction_monitoring"
)
```

#### Complex Expression Rule
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="AML Suspicious Activity",
    description="Detect suspicious transaction patterns",
    type="expression",
    definition={
        "expression": "(transaction.amount > 10000 && transaction.type == 'cash') || (transaction.frequency > 5 && transaction.time_window <= 24)",
        "variables": {
            "transaction.amount": "number",
            "transaction.type": "string",
            "transaction.frequency": "number",
            "transaction.time_window": "number"
        }
    },
    severity="high",
    category="aml_monitoring"
)
```

### Decision Table Rules

Decision tables are excellent for complex business logic with multiple conditions.

#### Simple Decision Table
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Risk Assessment",
    description="Assess transaction risk based on amount and country",
    type="decision_table",
    definition={
        "table": {
            "conditions": [
                {"field": "transaction.amount", "operator": ">", "value": 10000},
                {"field": "transaction.country", "operator": "in", "value": ["IR", "KP", "SY"]}
            ],
            "actions": [
                {"result": false, "reason": "High-risk transaction", "risk_level": "high"}
            ]
        }
    },
    severity="high",
    category="risk_assessment"
)
```

#### Complex Decision Table
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="KYC Customer Risk",
    description="Determine customer risk level based on multiple factors",
    type="decision_table",
    definition={
        "table": {
            "conditions": [
                {"field": "customer.type", "operator": "=", "value": "business"},
                {"field": "customer.country", "operator": "in", "value": ["US", "CA", "UK", "AU"]},
                {"field": "customer.annual_revenue", "operator": ">", "value": 1000000},
                {"field": "customer.pep_status", "operator": "=", "value": false}
            ],
            "actions": [
                {"result": true, "risk_level": "low", "monitoring_level": "standard"},
                {"result": false, "risk_level": "medium", "monitoring_level": "enhanced"}
            ]
        }
    },
    severity="medium",
    category="kyc_compliance"
)
```

## Advanced Rule Patterns

### Temporal Rules

Temporal rules deal with time-based conditions.

#### Time-Based Conditions
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Consent Expiry",
    description="Check if consent has expired",
    type="dsl",
    definition={
        "dsl": "WHEN consent.given = TRUE THEN MUST consent.expiry_date AFTER current_date",
        "parameters": {
            "consent.given": "boolean",
            "consent.expiry_date": "datetime",
            "current_date": "datetime"
        }
    },
    severity="high",
    category="consent_management"
)
```

#### Duration-Based Conditions
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Session Timeout",
    description="Check if user session has timed out",
    type="dsl",
    definition={
        "dsl": "WHEN session.active = TRUE THEN MUST session.last_activity WITHIN 30 MINUTES",
        "parameters": {
            "session.active": "boolean",
            "session.last_activity": "datetime"
        }
    },
    severity="medium",
    category="security"
)
```

### Pattern Matching Rules

Pattern matching rules use regular expressions and string matching.

#### Regular Expression Matching
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Email Validation",
    description="Validate email format for official communications",
    type="dsl",
    definition={
        "dsl": "WHEN communication.official = TRUE THEN MUST communication.email MATCHES '.*@.*\\.(gov|edu|org)'",
        "parameters": {
            "communication.official": "boolean",
            "communication.email": "string"
        }
    },
    severity="medium",
    category="communication"
)
```

#### String Containment
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Document Classification",
    description="Classify documents based on content",
    type="dsl",
    definition={
        "dsl": "WHEN document.processed = TRUE THEN MUST document.content CONTAINS 'confidential' OR document.content CONTAINS 'sensitive'",
        "parameters": {
            "document.processed": "boolean",
            "document.content": "string"
        }
    },
    severity="high",
    category="document_management"
)
```

### Complex Conditional Logic

#### Nested Conditions
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Complex AML Rule",
    description="Complex AML pattern detection",
    type="dsl",
    definition={
        "dsl": "WHEN (transaction.amount > 10000 AND transaction.type = 'cash') OR (customer.risk_score > 75 AND customer.new_customer = TRUE) THEN MUST transaction.reviewed = TRUE AND transaction.approved_by_compliance = TRUE",
        "parameters": {
            "transaction.amount": "number",
            "transaction.type": "string",
            "transaction.reviewed": "boolean",
            "transaction.approved_by_compliance": "boolean",
            "customer.risk_score": "number",
            "customer.new_customer": "boolean"
        }
    },
    severity="high",
    category="aml_monitoring"
)
```

#### Multi-Step Logic
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Multi-Step Compliance",
    description="Multi-step compliance validation",
    type="dsl",
    definition={
        "dsl": "WHEN user.registration = TRUE THEN MUST user.age >= 18 AND user.identity_verified = TRUE AND user.consent_given = TRUE",
        "parameters": {
            "user.registration": "boolean",
            "user.age": "number",
            "user.identity_verified": "boolean",
            "user.consent_given": "boolean"
        }
    },
    severity="high",
    category="user_onboarding"
)
```

## Domain-Specific Examples

### Financial Services Rules

#### AML Transaction Monitoring
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Large Cash Transaction",
    description="Flag transactions exceeding $10,000 in cash",
    type="dsl",
    definition={
        "dsl": "WHEN transaction.type = 'cash' AND transaction.amount >= 10000 THEN MUST transaction.flagged_as_suspicious = TRUE AND transaction.reported_to_fincen = TRUE",
        "parameters": {
            "transaction.type": "string",
            "transaction.amount": "number",
            "transaction.flagged_as_suspicious": "boolean",
            "transaction.reported_to_fincen": "boolean"
        }
    },
    severity="high",
    category="aml_monitoring",
    references=[
        {
            "type": "regulation",
            "id": "BSA-Section-5313",
            "title": "Bank Secrecy Act Section 5313",
            "url": "https://www.fincen.gov/statutes_regs/bsa/"
        }
    ]
)
```

#### KYC Customer Verification
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="KYC Verification",
    description="Verify customer identity for KYC compliance",
    type="dsl",
    definition={
        "dsl": "WHEN customer.onboarding = TRUE THEN MUST customer.identity_verified = TRUE AND customer.risk_assessment_completed = TRUE AND customer.documents_collected = TRUE",
        "parameters": {
            "customer.onboarding": "boolean",
            "customer.identity_verified": "boolean",
            "customer.risk_assessment_completed": "boolean",
            "customer.documents_collected": "boolean"
        }
    },
    severity="high",
    category="kyc_compliance"
)
```

### Healthcare Rules

#### HIPAA Privacy Rule
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="PHI Access Control",
    description="Control access to Protected Health Information",
    type="dsl",
    definition={
        "dsl": "WHEN phi.access_requested = TRUE THEN MUST user.authorized = TRUE AND user.role_has_access = TRUE AND access.logged = TRUE AND minimum_necessary = TRUE",
        "parameters": {
            "phi.access_requested": "boolean",
            "user.authorized": "boolean",
            "user.role_has_access": "boolean",
            "access.logged": "boolean",
            "minimum_necessary": "boolean"
        }
    },
    severity="high",
    category="hipaa_privacy",
    references=[
        {
            "type": "regulation",
            "id": "HIPAA-164.312",
            "title": "HIPAA Security Rule - Technical Safeguards",
            "url": "https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html"
        }
    ]
)
```

#### Clinical Trial Compliance
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Clinical Trial Consent",
    description="Ensure proper informed consent for clinical trials",
    type="dsl",
    definition={
        "dsl": "WHEN trial.subject_enrolled = TRUE THEN MUST consent.informed = TRUE AND consent.document_signed = TRUE AND consent.witnessed = TRUE AND consent.process_documented = TRUE",
        "parameters": {
            "trial.subject_enrolled": "boolean",
            "consent.informed": "boolean",
            "consent.document_signed": "boolean",
            "consent.witnessed": "boolean",
            "consent.process_documented": "boolean"
        }
    },
    severity="critical",
    category="clinical_research"
)
```

### Data Privacy Rules

#### GDPR Consent Management
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="GDPR Consent Validity",
    description="Validate GDPR consent requirements",
    type="dsl",
    definition={
        "dsl": "WHEN data.processing = TRUE AND data.lawful_basis = 'consent' THEN MUST consent.freely_given = TRUE AND consent.specific = TRUE AND consent.informed = TRUE AND consent.unambiguous = TRUE AND consent.demonstrable = TRUE",
        "parameters": {
            "data.processing": "boolean",
            "data.lawful_basis": "string",
            "consent.freely_given": "boolean",
            "consent.specific": "boolean",
            "consent.informed": "boolean",
            "consent.unambiguous": "boolean",
            "consent.demonstrable": "boolean"
        }
    },
    severity="high",
    category="gdpr_compliance",
    references=[
        {
            "type": "regulation",
            "id": "GDPR-Article-7",
            "title": "GDPR Article 7: Conditions for consent",
            "url": "https://gdpr-info.eu/art-7-gdpr/"
        }
    ]
)
```

#### Data Subject Rights
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Data Subject Access",
    description="Ensure timely response to data subject access requests",
    type="dsl",
    definition={
        "dsl": "WHEN subject.access_request = TRUE THEN MUST response.provided WITHIN 30 DAYS AND response.includes_all_data = TRUE AND response.in_machine_readable_format = TRUE",
        "parameters": {
            "subject.access_request": "boolean",
            "response.provided": "boolean",
            "response.includes_all_data": "boolean",
            "response.in_machine_readable_format": "boolean"
        }
    },
    severity="high",
    category="data_subject_rights"
)
```

### ESG Rules

#### Environmental Reporting
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Carbon Emissions Reporting",
    description="Ensure comprehensive carbon emissions reporting",
    type="dsl",
    definition={
        "dsl": "WHEN reporting.quarterly = TRUE THEN MUST emissions.scope1_reported = TRUE AND emissions.scope2_reported = TRUE AND emissions.scope3_reported = TRUE AND reporting.verified = TRUE",
        "parameters": {
            "reporting.quarterly": "boolean",
            "emissions.scope1_reported": "boolean",
            "emissions.scope2_reported": "boolean",
            "emissions.scope3_reported": "boolean",
            "reporting.verified": "boolean"
        }
    },
    severity="medium",
    category="environmental_reporting",
    references=[
        {
            "type": "standard",
            "id": "EU-Taxonomy-Climate",
            "title": "EU Taxonomy Climate Delegated Act",
            "url": "https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/sustainable-finance/eu-taxonomy-sustainable-finance_en"
        }
    ]
)
```

#### Supply Chain Due Diligence
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Supply Chain Compliance",
    description="Ensure supply chain due diligence requirements",
    type="dsl",
    definition={
        "dsl": "WHEN supplier.onboarded = TRUE THEN MUST supplier.human_rights_audit = TRUE AND supplier.environmental_compliance = TRUE AND supplier.anti_corruption_policy = TRUE AND supplier.risk_assessment = TRUE",
        "parameters": {
            "supplier.onboarded": "boolean",
            "supplier.human_rights_audit": "boolean",
            "supplier.environmental_compliance": "boolean",
            "supplier.anti_corruption_policy": "boolean",
            "supplier.risk_assessment": "boolean"
        }
    },
    severity="medium",
    category="supply_chain"
)
```

## Best Practices for Rule Creation

### 1. Rule Design Principles

#### Keep Rules Simple and Focused
```python
# Good - Single responsibility
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Consent Validation",
    type="dsl",
    definition={
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE"
    }
)

# Avoid - Multiple responsibilities
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Consent and Age Validation",
    type="dsl",
    definition={
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE AND user.age >= 18"
    }
)
```

#### Use Clear and Descriptive Names
```python
# Good - Clear and descriptive
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="GDPR Article 6 Lawful Basis Verification",
    description="Verify that data processing has a lawful basis under GDPR Article 6"
)

# Avoid - Vague and unclear
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Data Processing Rule",
    description="Check data processing"
)
```

#### Include Comprehensive Documentation
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="AML Large Transaction Reporting",
    description="Flag transactions exceeding $10,000 in cash for suspicious activity reporting",
    type="dsl",
    definition={
        "dsl": "WHEN transaction.type = 'cash' AND transaction.amount >= 10000 THEN MUST transaction.flagged_as_suspicious = TRUE"
    },
    # Include regulatory references
    references=[
        {
            "type": "regulation",
            "id": "BSA-Section-5313",
            "title": "Bank Secrecy Act Section 5313",
            "url": "https://www.fincen.gov/statutes_regs/bsa/"
        }
    ],
    # Include severity and category
    severity="high",
    category="aml_monitoring"
)
```

### 2. Parameter Management

#### Use Consistent Parameter Naming
```python
# Good - Consistent naming
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="User Verification",
    type="dsl",
    definition={
        "dsl": "WHEN user.registration = TRUE THEN MUST user.age_verified = TRUE AND user.identity_verified = TRUE",
        "parameters": {
            "user.registration": "boolean",
            "user.age_verified": "boolean",
            "user.identity_verified": "boolean"
        }
    }
)

# Avoid - Inconsistent naming
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="User Verification",
    type="dsl",
    definition={
        "dsl": "WHEN user.registration = TRUE THEN MUST age_verified = TRUE AND identity_check = TRUE",
        "parameters": {
            "user.registration": "boolean",
            "age_verified": "boolean",
            "identity_check": "boolean"
        }
    }
)
```

#### Define Clear Data Types
```python
# Good - Clear data types
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Transaction Validation",
    type="dsl",
    definition={
        "dsl": "WHEN transaction.processed = TRUE THEN MUST transaction.amount > 0 AND transaction.currency IN ['USD', 'EUR', 'GBP']",
        "parameters": {
            "transaction.processed": "boolean",
            "transaction.amount": "number",
            "transaction.currency": "string"
        }
    }
)

# Avoid - Ambiguous data types
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Transaction Validation",
    type="dsl",
    definition={
        "dsl": "WHEN transaction.processed = TRUE THEN MUST transaction.amount > 0 AND transaction.currency IN ['USD', 'EUR', 'GBP']",
        "parameters": {
            "transaction.processed": "any",
            "transaction.amount": "any",
            "transaction.currency": "any"
        }
    }
)
```

### 3. Error Handling and Validation

#### Include Input Validation
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Input Validation",
    type="dsl",
    definition={
        "dsl": "WHEN input.received = TRUE THEN MUST input.valid = TRUE AND input.complete = TRUE",
        "parameters": {
            "input.received": "boolean",
            "input.valid": "boolean",
            "input.complete": "boolean"
        }
    }
)
```

#### Handle Edge Cases
```python
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Edge Case Handling",
    type="dsl",
    definition={
        "dsl": "WHEN user.active = TRUE THEN MUST (user.last_login NOT NULL OR user.new_user = TRUE)",
        "parameters": {
            "user.active": "boolean",
            "user.last_login": "datetime",
            "user.new_user": "boolean"
        }
    }
)
```

### 4. Performance Optimization

#### Use Efficient Operators
```python
# Good - Efficient operators
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Efficient Country Check",
    type="dsl",
    definition={
        "dsl": "WHEN transaction.processed = TRUE THEN MUST transaction.country IN ['US', 'CA', 'UK', 'AU']",
        "parameters": {
            "transaction.processed": "boolean",
            "transaction.country": "string"
        }
    }
)

# Avoid - Inefficient operators
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Inefficient Country Check",
    type="dsl",
    definition={
        "dsl": "WHEN transaction.processed = TRUE THEN MUST transaction.country = 'US' OR transaction.country = 'CA' OR transaction.country = 'UK' OR transaction.country = 'AU'",
        "parameters": {
            "transaction.processed": "boolean",
            "transaction.country": "string"
        }
    }
)
```

#### Avoid Redundant Conditions
```python
# Good - No redundancy
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Non-Redundant Check",
    type="dsl",
    definition={
        "dsl": "WHEN user.registered = TRUE THEN MUST user.email_verified = TRUE AND user.phone_verified = TRUE",
        "parameters": {
            "user.registered": "boolean",
            "user.email_verified": "boolean",
            "user.phone_verified": "boolean"
        }
    }
)

# Avoid - Redundant conditions
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Redundant Check",
    type="dsl",
    definition={
        "dsl": "WHEN user.registered = TRUE AND user.registered = TRUE THEN MUST user.email_verified = TRUE AND user.email_verified = TRUE",
        "parameters": {
            "user.registered": "boolean",
            "user.email_verified": "boolean"
        }
    }
)
```

## Testing and Validation

### Unit Testing Rules

```python
import unittest
from glassbox import ComplianceRule, ComplianceDecision

class TestComplianceRules(unittest.TestCase):
    def setUp(self):
        self.rule = ComplianceRule(
            id="test-rule-001",
            name="Test Rule",
            type="dsl",
            definition={
                "dsl": "WHEN user.age >= 18 THEN MUST user.consent_given = TRUE",
                "parameters": {
                    "user.age": "number",
                    "user.consent_given": "boolean"
                }
            }
        )
    
    def test_valid_scenario(self):
        decision = ComplianceDecision(
            id="test-decision-001",
            ruleId=self.rule.id,
            input={"user.age": 25, "user.consent_given": True},
            output={"result": True, "reason": "User is adult and consent given"}
        )
        self.assertTrue(decision.output["result"])
    
    def test_invalid_scenario(self):
        decision = ComplianceDecision(
            id="test-decision-002",
            ruleId=self.rule.id,
            input={"user.age": 25, "user.consent_given": False},
            output={"result": False, "reason": "User is adult but no consent given"}
        )
        self.assertFalse(decision.output["result"])
    
    def test_rule_not_applicable(self):
        decision = ComplianceDecision(
            id="test-decision-003",
            ruleId=self.rule.id,
            input={"user.age": 16, "user.consent_given": False},
            output={"result": True, "reason": "Rule not applicable to minors"}
        )
        self.assertTrue(decision.output["result"])  # Rule doesn't apply

if __name__ == '__main__':
    unittest.main()
```

### Integration Testing

```python
from glassbox import DecisionBundle

def test_integration():
    # Create multiple rules
    rules = [
        ComplianceRule(
            id="rule-001",
            name="Age Check",
            type="dsl",
            definition={
                "dsl": "WHEN user.registration = TRUE THEN MUST user.age >= 18",
                "parameters": {"user.registration": "boolean", "user.age": "number"}
            }
        ),
        ComplianceRule(
            id="rule-002",
            name="Consent Check",
            type="dsl",
            definition={
                "dsl": "WHEN user.data_processing = TRUE THEN MUST user.consent_given = TRUE",
                "parameters": {"user.data_processing": "boolean", "user.consent_given": "boolean"}
            }
        )
    ]
    
    # Create DecisionBundle
    bundle = DecisionBundle(
        version="1.0",
        metadata={
            "id": "integration-test-bundle",
            "name": "Integration Test Bundle",
            "jurisdiction": "GDPR",
            "domain": "general"
        },
        rules=rules,
        decisions=[]
    )
    
    # Validate bundle
    self.assertTrue(bundle.validate())
    
    # Test rule execution
    for rule in rules:
        print(f"Testing rule: {rule.name}")
        # Add test logic here
```

## Common Pitfalls and Solutions

### 1. Complex Rules
**Problem**: Rules become too complex and difficult to maintain
**Solution**: Break down complex rules into smaller, focused rules

```python
# Instead of one complex rule
complex_rule = ComplianceRule(
    id="complex-rule",
    name="Complex Validation",
    type="dsl",
    definition={
        "dsl": "WHEN user.registration = TRUE THEN MUST user.age >= 18 AND user.email_verified = TRUE AND user.phone_verified = TRUE AND user.consent_given = TRUE AND user.identity_verified = TRUE"
    }
)

# Create multiple focused rules
age_rule = ComplianceRule(
    id="age-rule",
    name="Age Validation",
    type="dsl",
    definition={
        "dsl": "WHEN user.registration = TRUE THEN MUST user.age >= 18"
    }
)

email_rule = ComplianceRule(
    id="email-rule",
    name="Email Verification",
    type="dsl",
    definition={
        "dsl": "WHEN user.registration = TRUE THEN MUST user.email_verified = TRUE"
    }
)
```

### 2. Ambiguous Conditions
**Problem**: Rule conditions are ambiguous or unclear
**Solution**: Use clear, specific conditions with proper data types

```python
# Ambiguous
ambiguous_rule = ComplianceRule(
    id="ambiguous-rule",
    name="User Check",
    type="dsl",
    definition={
        "dsl": "WHEN user.ok = TRUE THEN MUST user.data = TRUE"
    }
)

# Clear and specific
clear_rule = ComplianceRule(
    id="clear-rule",
    name="User Verification",
    type="dsl",
    definition={
        "dsl": "WHEN user.verified = TRUE THEN MUST user.data_complete = TRUE",
        "parameters": {
            "user.verified": "boolean",
            "user.data_complete": "boolean"
        }
    }
)
```

### 3. Missing Error Handling
**Problem**: Rules don't handle edge cases or invalid inputs
**Solution**: Include comprehensive error handling and validation

```python
# Without error handling
rule_without_error_handling = ComplianceRule(
    id="no-error-handling",
    name="Simple Check",
    type="dsl",
    definition={
        "dsl": "WHEN user.active = TRUE THEN MUST user.last_login NOT NULL"
    }
)

# With error handling
rule_with_error_handling = ComplianceRule(
    id="with-error-handling",
    name="Robust Check",
    type="dsl",
    definition={
        "dsl": "WHEN user.active = TRUE THEN MUST (user.last_login NOT NULL OR user.new_user = TRUE)",
        "parameters": {
            "user.active": "boolean",
            "user.last_login": "datetime",
            "user.new_user": "boolean"
        }
    }
)
```

## Next Steps

Now that you understand how to create compliance rules, you're ready to:

1. **Practice with Examples**: Try creating rules for your specific domain
2. **Learn About DecisionBundles**: [Go to Working with DecisionBundles](working-with-bundles.md)
3. **Explore Advanced Topics**: [Learn about Advanced Topics](advanced-topics.md)
4. **Test Your Knowledge**: Try the exercises in the next section

---

**Creating effective compliance rules is the foundation of any successful compliance system. Master these patterns and you'll be well on your way to becoming a GlassBox Standard expert!**