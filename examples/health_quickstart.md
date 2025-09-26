# Healthcare Quick Start Guide

This guide demonstrates how to use GlassBox AI Standard for healthcare compliance scenarios, including HIPAA (Health Insurance Portability and Accountability Act) compliance.

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

## HIPAA Privacy Rule Example

### Scenario: Protected Health Information (PHI) Access Control

Control access to patient health information based on user roles and consent.

#### Python Implementation

```python
from glassbox import GlassBox
from datetime import datetime, timedelta

# Initialize GlassBox
gb = GlassBox()

# Create HIPAA decision bundle
hipaa_bundle = {
    "version": "1.0.0",
    "jurisdiction": "US",
    "rules": [
        {
            "id": "phi_access_control",
            "type": "decision_tree",
            "description": "Control access to Protected Health Information",
            "tree": {
                "root": {
                    "condition": "user.role",
                    "branches": {
                        "doctor": {
                            "condition": "access.purpose",
                            "branches": {
                                "treatment": {"result": "allow"},
                                "payment": {"result": "allow"},
                                "operations": {"result": "allow"},
                                "default": {"result": "deny", "reason": "Unauthorized access purpose"}
                            }
                        },
                        "nurse": {
                            "condition": "access.purpose",
                            "branches": {
                                "treatment": {"result": "allow"},
                                "default": {"result": "deny", "reason": "Nurses can only access for treatment"}
                            }
                        },
                        "admin": {
                            "condition": "access.purpose",
                            "branches": {
                                "payment": {"result": "allow"},
                                "operations": {"result": "allow"},
                                "default": {"result": "deny", "reason": "Admins can only access for payment or operations"}
                            }
                        },
                        "patient": {
                            "condition": "access.record_owner",
                            "branches": {
                                "true": {"result": "allow"},
                                "false": {"result": "deny", "reason": "Patients can only access their own records"}
                            }
                        },
                        "default": {"result": "deny", "reason": "Unauthorized user role"}
                    }
                }
            }
        }
    ]
}

# Load the bundle
bundle = gb.load_bundle(hipaa_bundle)

# Evaluate access request
access_request = {
    "user": {
        "role": "doctor",
        "department": "cardiology"
    },
    "access": {
        "purpose": "treatment",
        "requires_consent": False,
        "emergency": False
    },
    "patient": {
        "consent_given": True,
        "consent_expiry": (datetime.now() + timedelta(days=365)).isoformat()
    },
    "record": {
        "type": "clinical",
        "age_years": 2,
        "sensitive": False
    },
    "current_date": datetime.now().isoformat()
}

result = bundle.evaluate(access_request)
print(f"Access decision: {result}")
```

For the complete implementation examples in JavaScript and Java, and additional scenarios including clinical research compliance, please refer to the full documentation.

## Running the Examples

### Python
```bash
python hipaa_example.py
python research_example.py
```

### JavaScript
```bash
node hipaa_example.js
node research_example.js
```

### Java
```bash
javac HIPAAComplianceExample.java
java HIPAAComplianceExample
```

## Expected Output

For the HIPAA example with a doctor accessing records for treatment purposes, you should see an "allow" decision indicating the access is permitted.

## Next Steps

1. **Customize Rules**: Adapt the rules to your specific healthcare compliance requirements
2. **Add More Scenarios**: Implement additional healthcare compliance scenarios like billing compliance
3. **Integration**: Integrate with Electronic Health Record (EHR) systems
4. **Audit Trail**: Implement comprehensive audit logging for compliance reporting
5. **Training**: Train healthcare staff on compliance procedures

## Best Practices

1. **Privacy by Design**: Build privacy considerations into all healthcare applications
2. **Minimum Necessary**: Only access the minimum necessary PHI required for the purpose
3. **Regular Training**: Provide regular HIPAA training to all staff
4. **Audit Logs**: Maintain detailed audit logs of all PHI access
5. **Business Associate Agreements**: Ensure proper agreements with all third-party vendors

For more advanced examples and integration patterns, see the [full documentation](../docs/).
