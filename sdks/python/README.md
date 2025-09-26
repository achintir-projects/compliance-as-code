# GlassBox Python SDK

A comprehensive Python SDK for working with GlassBox DecisionBundles and Compliance DSL according to the GlassBox Standard v1.0 specification.

## Features

- **DecisionBundle Management**: Create, parse, validate, and manage GlassBox DecisionBundles
- **DSL Parser & Evaluator**: Parse and evaluate GlassBox Compliance DSL rules with full grammar support
- **Rule Engine**: Execute different types of compliance rules (DSL, expression, decision table, decision tree)
- **Evidence Management**: Create, store, and verify evidence with integrity checking
- **Audit Trail**: Comprehensive audit trail management with bundling and verification
- **Type Safety**: Full type hints and validation throughout the SDK
- **No External Dependencies**: Core functionality requires no external dependencies

## Installation

```bash
pip install glassbox-sdk
```

For development:

```bash
pip install glassbox-sdk[dev]
```

## Quick Start

### Creating a DecisionBundle

```python
from sdk import DecisionBundleBuilder

# Create a DecisionBundle
builder = DecisionBundleBuilder()
builder.set_name("GDPR Compliance Check")
builder.set_description("Verify GDPR compliance for data processing")
builder.set_jurisdiction("GDPR")
builder.set_domain("general")

# Add a DSL rule
rule = {
    "id": "rule-gdpr-001",
    "name": "Lawful Basis for Processing",
    "description": "Verify lawful basis for data processing",
    "type": "dsl",
    "definition": {
        "dsl": "WHEN processing_data THEN MUST have_lawful_basis IN ['consent', 'contract']",
        "parameters": {
            "processing_data": "boolean",
            "have_lawful_basis": "string"
        }
    }
}
builder.add_rule(rule)

# Build the bundle
bundle = builder.build()
print(f"Created bundle: {bundle.metadata['name']}")
```

### Parsing and Evaluating DSL Rules

```python
from sdk import DSLParser, DSLEvaluator

# Initialize parser and evaluator
parser = DSLParser()
evaluator = DSLEvaluator()

# Parse a DSL rule
dsl_text = "WHEN user.age >= 18 THEN MUST account.is_active = TRUE"
ast = parser.parse(dsl_text)

# Evaluate with context
context = {
    "user": {"age": 25},
    "account": {"is_active": True}
}
result = evaluator.evaluate(ast, context)

print(f"Result: {result['result']}")
print(f"Reason: {result['reason']}")
```

### Executing Rules with Rule Engine

```python
from sdk import RuleEngine, ExecutionContext

# Initialize rule engine
engine = RuleEngine()

# Create execution context
context = ExecutionContext({
    "user": {"age": 25},
    "account": {"is_active": True}
})

# Execute a DecisionBundle
results = engine.execute_bundle(bundle, context)
print(f"Overall result: {results['overall_result']}")
print(f"Rules passed: {results['rules_passed']}/{results['rules_executed']}")
```

### Managing Evidence

```python
from sdk import EvidenceManager

# Initialize evidence manager
evidence_manager = EvidenceManager()

# Create evidence
evidence = evidence_manager.create_evidence(
    "log",
    {
        "event": "user_login",
        "user_id": "user_123",
        "success": True
    },
    "auth_system"
)

# Verify integrity
verification = evidence_manager.verify_evidence_integrity(evidence['id'])
print(f"Integrity verified: {verification['valid']}")
```

### Managing Audit Trails

```python
from sdk import AuditTrail

# Initialize audit trail
audit_trail = AuditTrail()

# Create audit entry
entry = audit_trail.create_audit_entry(
    "rule_executed",
    "compliance_engine",
    {
        "rule_id": "rule-001",
        "result": True
    }
)

# Create audit bundle
bundle = audit_trail.create_audit_bundle(
    "Compliance Audit",
    "Monthly compliance audit",
    [entry['id']]
)

print(f"Created audit bundle with {bundle['entry_count']} entries")
```

## Supported Rule Types

### DSL Rules
Human-readable rules using the GlassBox Compliance DSL:

```python
dsl_rule = {
    "type": "dsl",
    "definition": {
        "dsl": "WHEN transaction.amount > 10000 AND transaction.country IN ['IR', 'KP'] THEN MUST FLAG transaction as_high_risk"
    }
}
```

### Expression Rules
Simple boolean expressions:

```python
expression_rule = {
    "type": "expression",
    "definition": {
        "expression": "customer.risk_score > 75 and customer.kyc_verified == True",
        "variables": {
            "customer.risk_score": "number",
            "customer.kyc_verified": "boolean"
        }
    }
}
```

### Decision Table Rules
Tabular decision logic:

```python
decision_table_rule = {
    "type": "decision_table",
    "definition": {
        "table": {
            "conditions": [
                {"field": "transaction.amount", "operator": ">", "value": 50000},
                {"field": "customer.risk_level", "operator": "=", "value": "high"}
            ],
            "actions": [
                {"result": False, "reason": "Manual review required"}
            ]
        }
    }
}
```

### Decision Tree Rules
Hierarchical decision logic:

```python
decision_tree_rule = {
    "type": "decision_tree",
    "definition": {
        "tree": {
            "condition": {"field": "user.age", "operator": ">=", "value": 18},
            "true_branch": {
                "condition": {"field": "account.verified", "operator": "=", "value": True},
                "true_branch": {"result": True, "reason": "Adult verified user"},
                "false_branch": {"result": False, "reason": "Adult unverified user"}
            },
            "false_branch": {"result": False, "reason": "Minor user"}
        }
    }
}
```

## DSL Grammar Reference

The GlassBox Compliance DSL supports:

### Conditions
- Simple conditions: `WHEN variable operator value`
- List conditions: `WHEN variable IN [value1, value2]`
- Pattern conditions: `WHEN variable MATCHES pattern`
- Temporal conditions: `WHEN variable BEFORE datetime`
- Compound conditions: `WHEN condition1 AND condition2`

### Consequences
- Constraints: `THEN MUST variable operator value`
- Requirements: `THEN REQUIRE variable`
- Boolean expressions: `THEN variable1 AND variable2`

### Actions
- `FLAG variable`
- `ALERT variable`
- `BLOCK variable`
- `ALLOW variable`
- `LOG variable`
- `NOTIFY variable`

### Operators
- Comparison: `=`, `!=`, `>`, `>=`, `<`, `<=`, `LIKE`
- Logical: `AND`, `OR`, `NOT`
- Membership: `IN`, `NOT IN`, `CONTAINS`, `MATCHES`
- Temporal: `BEFORE`, `AFTER`, `WITHIN`, `EXPIRES`

## Examples

See the `examples.py` file for comprehensive examples covering:
- Basic DecisionBundle creation
- DSL parsing and evaluation
- Rule engine execution
- Evidence management
- Audit trail management
- Complete compliance workflows

## API Reference

### Core Classes

#### DecisionBundle
Main class for working with DecisionBundles.

```python
bundle = DecisionBundle(bundle_data)
bundle.metadata  # Get metadata
bundle.rules     # Get rules
bundle.decisions # Get decisions
bundle.to_json() # Export to JSON
```

#### DecisionBundleBuilder
Builder pattern for creating DecisionBundles.

```python
builder = DecisionBundleBuilder()
builder.set_name("Name").set_description("Description")
builder.add_rule(rule).add_decision(decision)
bundle = builder.build()
```

#### DSLParser
Parser for GlassBox Compliance DSL.

```python
parser = DSLParser()
ast = parser.parse("WHEN condition THEN consequence")
```

#### DSLEvaluator
Evaluator for parsed DSL ASTs.

```python
evaluator = DSLEvaluator()
result = evaluator.evaluate(ast, context)
```

#### RuleEngine
Engine for executing compliance rules.

```python
engine = RuleEngine()
results = engine.execute_bundle(bundle, context)
```

#### ExecutionContext
Context for rule execution.

```python
context = ExecutionContext(data, variables)
context.execution_id  # Unique execution ID
context.timestamp     # Execution timestamp
context.results       # Execution results
```

#### EvidenceManager
Manager for evidence handling.

```python
manager = EvidenceManager()
evidence = manager.create_evidence("log", content, "source")
verification = manager.verify_evidence_integrity(evidence_id)
```

#### AuditTrail
Manager for audit trail handling.

```python
audit = AuditTrail()
entry = audit.create_audit_entry("action", "user", details)
bundle = audit.create_audit_bundle("Name", "Description", [entry_id])
```

## Error Handling

The SDK provides specific exception types:

```python
from sdk.exceptions import (
    GlassBoxException,
    DSLParserException,
    RuleExecutionException,
    ValidationException,
    EvidenceException,
    AuditException
)

try:
    ast = parser.parse(invalid_dsl)
except DSLParserException as e:
    print(f"DSL parsing error: {e}")
```

## Performance Considerations

- **Caching**: The RuleEngine includes built-in caching for rule execution results
- **Indexing**: EvidenceManager and AuditTrail use indexing for efficient queries
- **Memory**: For large-scale deployments, consider using persistent storage backends

## Security Features

- **Integrity Verification**: Automatic hash calculation and verification for evidence and audit entries
- **Immutable Audit Trails**: Audit entries cannot be modified once created
- **Secure Storage**: Evidence and audit data can be stored with encryption
- **Access Control**: Supports integration with external access control systems

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: https://glassbox-sdk-python.readthedocs.io/
- Issues: https://github.com/glassbox-ai/glassbox-sdk-python/issues
- Email: compliance@glassbox.ai

## Changelog

### v1.0.0
- Initial release
- Full DecisionBundle support
- Complete DSL parser and evaluator
- Rule engine with multiple rule types
- Evidence management with integrity verification
- Audit trail management with bundling
- Comprehensive error handling
- Full type hints and documentation