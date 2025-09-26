# Finance Quick Start Guide

This guide demonstrates how to use GlassBox AI Standard for financial compliance scenarios, including AML (Anti-Money Laundering) and KYC (Know Your Customer) compliance.

## Prerequisites

- Python 3.8+ or Node.js 18+ or Java 11+
- GlassBox AI Standard SDK installed

## Installation

### Python
```bash
pip install glassbox-standard
```

### JavaScript
```bash
npm install @glassbox/standard
```

### Java
```xml
<dependency>
    <groupId>ai.glassbox</groupId>
    <artifactId>glassbox-standard</artifactId>
    <version>1.0.0</version>
</dependency>
```

## AML Compliance Example

### Scenario: Transaction Monitoring

Monitor financial transactions for suspicious activity using GlassBox AI Standard.

#### Python Implementation

```python
from glassbox import GlassBox
import json

# Initialize GlassBox
gb = GlassBox()

# Create AML decision bundle
aml_bundle = {
    "version": "1.0.0",
    "jurisdiction": "US",
    "rules": [
        {
            "id": "large_cash_transaction",
            "type": "expression",
            "description": "Flag large cash transactions",
            "condition": "transaction.amount > 10000 && transaction.type == 'cash'",
            "consequence": {
                "action": "flag",
                "severity": "high",
                "reason": "Large cash transaction exceeds threshold"
            }
        },
        {
            "id": "rapid_transactions",
            "type": "expression",
            "description": "Flag rapid successive transactions",
            "condition": "transaction.count_24h > 10 && transaction.total_amount_24h > 50000",
            "consequence": {
                "action": "flag",
                "severity": "medium",
                "reason": "Rapid successive transactions detected"
            }
        },
        {
            "id": "high_risk_country",
            "type": "expression",
            "description": "Flag transactions with high-risk countries",
            "condition": "transaction.destination_country in ['IR', 'KP', 'SY', 'CU']",
            "consequence": {
                "action": "block",
                "severity": "high",
                "reason": "Transaction to high-risk country"
            }
        }
    ]
}

# Load the bundle
bundle = gb.load_bundle(aml_bundle)

# Evaluate a transaction
transaction = {
    "amount": 15000,
    "type": "cash",
    "destination_country": "US",
    "count_24h": 2,
    "total_amount_24h": 20000
}

result = bundle.evaluate(transaction)
print(f"Transaction result: {result}")
```

For the complete implementation examples in JavaScript and Java, and additional scenarios including KYC compliance, please refer to the full documentation.

## Running the Examples

### Python
```bash
python aml_example.py
python kyc_example.py
```

### JavaScript
```bash
node aml_example.js
node kyc_example.js
```

### Java
```bash
javac AMLComplianceExample.java
java AMLComplianceExample
```

## Expected Output

The examples will output compliance decisions based on the input data. For the AML example with a $15,000 cash transaction, you should see a flag indicating the transaction exceeds the threshold.

## Next Steps

1. **Customize Rules**: Modify the rules to match your specific compliance requirements
2. **Add More Scenarios**: Implement additional compliance scenarios like sanctions screening
3. **Integration**: Integrate with your existing financial systems
4. **Monitoring**: Set up monitoring and alerting for compliance events
5. **Audit Trail**: Implement audit trail logging for compliance reporting

## Best Practices

1. **Rule Management**: Keep rules simple and focused on specific compliance requirements
2. **Testing**: Thoroughly test rules with various input scenarios
3. **Performance**: Monitor rule evaluation performance, especially for high-volume transactions
4. **Updates**: Regularly update rules to reflect changing regulations
5. **Documentation**: Document all rules and their business rationale

For more advanced examples and integration patterns, see the [full documentation](../docs/).
