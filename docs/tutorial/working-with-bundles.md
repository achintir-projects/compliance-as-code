---
sidebar_position: 4
---

# Working with DecisionBundles

In this section, you'll learn how to create, manage, and work with DecisionBundles - the core data structure of GlassBox Standard. DecisionBundles package compliance rules, decisions, and evidence into a single, verifiable unit.

## Understanding DecisionBundles

### What is a DecisionBundle?

A DecisionBundle is a JSON document that serves as a container for:
- **Metadata**: Information about the bundle (jurisdiction, domain, author)
- **Rules**: Compliance rules in various formats
- **Decisions**: Results of rule evaluations
- **Evidence**: Supporting documentation and audit trails
- **Audit**: Complete audit trail of all activities

### DecisionBundle Structure

```json
{
  "version": "1.0",
  "metadata": {
    "id": "unique-identifier",
    "name": "Bundle Name",
    "description": "Bundle Description",
    "created": "2024-01-15T10:00:00Z",
    "jurisdiction": "GDPR",
    "domain": "general"
  },
  "rules": [
    {
      "id": "rule-001",
      "name": "Rule Name",
      "type": "dsl",
      "definition": {
        "dsl": "WHEN condition THEN MUST consequence"
      }
    }
  ],
  "decisions": [
    {
      "id": "decision-001",
      "ruleId": "rule-001",
      "input": {...},
      "output": {...},
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "evidence": [
    {
      "id": "evidence-001",
      "type": "document",
      "content": {...},
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "audit": {
    "created": "2024-01-15T10:00:00Z",
    "trail": [...]
  }
}
```

## Creating DecisionBundles

### Basic DecisionBundle Creation

Let's create a simple DecisionBundle for GDPR compliance:

```python
from glassbox import DecisionBundle, ComplianceRule, ComplianceDecision
import uuid
from datetime import datetime

# Create compliance rules
consent_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="GDPR Consent Validation",
    description="Verify that consent is properly informed",
    type="dsl",
    definition={
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE",
        "parameters": {
            "user.consent_given": "boolean",
            "user.consent_informed": "boolean"
        }
    },
    severity="high",
    category="consent",
    references=[
        {
            "type": "regulation",
            "id": "GDPR-Article-7",
            "title": "GDPR Article 7: Conditions for consent",
            "url": "https://gdpr-info.eu/art-7-gdpr/"
        }
    ]
)

data_minimization_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Data Minimization",
    description="Ensure only necessary data is collected",
    type="dsl",
    definition={
        "dsl": "WHEN data.collected = TRUE THEN MUST data.minimal = TRUE AND data.retention_specified = TRUE",
        "parameters": {
            "data.collected": "boolean",
            "data.minimal": "boolean",
            "data.retention_specified": "boolean"
        }
    },
    severity="medium",
    category="data_protection"
)

# Create compliance decisions
consent_decision = ComplianceDecision(
    id=str(uuid.uuid4()),
    ruleId=consent_rule.id,
    input={
        "user.consent_given": True,
        "user.consent_informed": True
    },
    output={
        "result": True,
        "confidence": 1.0,
        "reason": "Consent is properly informed",
        "evidence": [
            {
                "type": "document",
                "id": "consent-form-001",
                "content": "User consent form",
                "timestamp": "2024-01-15T10:00:00Z"
            }
        ]
    },
    timestamp=datetime.now().isoformat(),
    executor="compliance-engine-v1.0",
    context={
        "user_id": "user-123",
        "session_id": "session-456"
    }
)

# Create the DecisionBundle
bundle = DecisionBundle(
    version="1.0",
    metadata={
        "id": str(uuid.uuid4()),
        "name": "GDPR Compliance Bundle",
        "description": "Comprehensive GDPR compliance assessment",
        "created": datetime.now().isoformat(),
        "author": "Compliance Officer",
        "jurisdiction": "GDPR",
        "domain": "general",
        "tags": ["gdpr", "privacy", "consent", "data_protection"]
    },
    rules=[consent_rule, data_minimization_rule],
    decisions=[consent_decision]
)

# Validate and save the bundle
if bundle.validate():
    bundle.save("gdpr_compliance_bundle.json")
    print("DecisionBundle created and saved successfully!")
else:
    print("DecisionBundle validation failed!")
```

### Advanced DecisionBundle with Evidence and Audit

Let's create a more comprehensive DecisionBundle with evidence and audit trails:

```python
from glassbox import DecisionBundle, ComplianceRule, ComplianceDecision
import uuid
from datetime import datetime, timedelta
import hashlib

# Create additional evidence
evidence_items = [
    {
        "id": "privacy-policy-001",
        "type": "document",
        "content": {
            "document_type": "privacy_policy",
            "version": "2.1",
            "url": "/privacy-policy-v2.1.pdf",
            "content_hash": hashlib.sha256("privacy policy content".encode()).hexdigest()
        },
        "timestamp": "2024-01-10T09:00:00Z",
        "source": "document-management-system",
        "hash": hashlib.sha256("privacy policy content".encode()).hexdigest()
    },
    {
        "id": "consent-log-001",
        "type": "log",
        "content": {
            "event": "consent_given",
            "user_id": "user-123",
            "ip_address": "192.168.1.100",
            "user_agent": "Mozilla/5.0...",
            "timestamp": "2024-01-15T10:30:00Z"
        },
        "timestamp": "2024-01-15T10:30:00Z",
        "source": "application-logs",
        "hash": hashlib.sha256("consent log entry".encode()).hexdigest()
    }
]

# Create audit trail
audit_trail = [
    {
        "timestamp": "2024-01-15T10:00:00Z",
        "action": "bundle_created",
        "user": "compliance-officer",
        "details": {
            "reason": "Initial GDPR compliance assessment"
        }
    },
    {
        "timestamp": "2024-01-15T10:30:00Z",
        "action": "decision_added",
        "user": "compliance-engine",
        "details": {
            "decision_id": consent_decision.id,
            "rule_id": consent_rule.id
        }
    }
]

# Create enhanced DecisionBundle
enhanced_bundle = DecisionBundle(
    version="1.0",
    metadata={
        "id": str(uuid.uuid4()),
        "name": "Enhanced GDPR Compliance Bundle",
        "description": "GDPR compliance with full evidence and audit trail",
        "created": datetime.now().isoformat(),
        "modified": datetime.now().isoformat(),
        "author": "Compliance Team",
        "jurisdiction": "GDPR",
        "domain": "general",
        "tags": ["gdpr", "privacy", "audit", "evidence"],
        "signature": {
            "algorithm": "ES256",
            "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEVs/o5+uQbTjL3jynfh+Y2FwI7...",
            "value": "MEUCIAQ9bXJ4o3Z3N5V7g8Y2FwI7X6v5K8J9H7G6F5D4E3C2A1B..."
        }
    },
    rules=[consent_rule, data_minimization_rule],
    decisions=[consent_decision],
    evidence=evidence_items,
    audit={
        "created": datetime.now().isoformat(),
        "modified": datetime.now().isoformat(),
        "version": "1.0",
        "checksum": hashlib.sha256("bundle content".encode()).hexdigest(),
        "trail": audit_trail
    }
)

# Save the enhanced bundle
if enhanced_bundle.validate():
    enhanced_bundle.save("enhanced_gdpr_bundle.json")
    print("Enhanced DecisionBundle created and saved successfully!")
else:
    print("Enhanced DecisionBundle validation failed!")
```

## Loading and Manipulating DecisionBundles

### Loading from File

```python
from glassbox import DecisionBundle
import json

# Load a DecisionBundle from file
try:
    with open('gdpr_compliance_bundle.json', 'r') as f:
        bundle_data = json.load(f)
    
    bundle = DecisionBundle.from_dict(bundle_data)
    print(f"Loaded DecisionBundle: {bundle.metadata['name']}")
    print(f"Rules: {len(bundle.rules)}")
    print(f"Decisions: {len(bundle.decisions)}")
    print(f"Evidence: {len(bundle.evidence) if hasattr(bundle, 'evidence') else 0}")
    
except FileNotFoundError:
    print("DecisionBundle file not found!")
except json.JSONDecodeError:
    print("Invalid JSON format!")
except Exception as e:
    print(f"Error loading DecisionBundle: {e}")
```

### Modifying DecisionBundles

```python
# Add a new rule to an existing bundle
new_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Data Subject Rights",
    description="Ensure data subject rights are respected",
    type="dsl",
    definition={
        "dsl": "WHEN subject.access_request = TRUE THEN MUST response.provided WITHIN 30 DAYS",
        "parameters": {
            "subject.access_request": "boolean",
            "response.provided": "boolean"
        }
    },
    severity="high",
    category="data_subject_rights"
)

# Add the rule to the bundle
bundle.rules.append(new_rule)

# Add a new decision
new_decision = ComplianceDecision(
    id=str(uuid.uuid4()),
    ruleId=new_rule.id,
    input={
        "subject.access_request": True,
        "response.provided": True
    },
    output={
        "result": True,
        "confidence": 0.95,
        "reason": "Access request responded to within timeframe"
    },
    timestamp=datetime.now().isoformat(),
    executor="compliance-engine-v1.0"
)

bundle.decisions.append(new_decision)

# Update metadata
bundle.metadata['modified'] = datetime.now().isoformat()

# Add to audit trail
if hasattr(bundle, 'audit') and bundle.audit:
    bundle.audit['trail'].append({
        "timestamp": datetime.now().isoformat(),
        "action": "rule_added",
        "user": "compliance-officer",
        "details": {
            "rule_id": new_rule.id,
            "rule_name": new_rule.name
        }
    })
    bundle.audit['modified'] = datetime.now().isoformat()

# Validate and save
if bundle.validate():
    bundle.save("modified_gdpr_bundle.json")
    print("DecisionBundle modified and saved successfully!")
else:
    print("Modified DecisionBundle validation failed!")
```

### Querying DecisionBundles

```python
class DecisionBundleQuery:
    def __init__(self, bundle):
        self.bundle = bundle
    
    def get_rules_by_type(self, rule_type):
        """Get rules by type"""
        return [rule for rule in self.bundle.rules if rule.type == rule_type]
    
    def get_rules_by_severity(self, severity):
        """Get rules by severity"""
        return [rule for rule in self.bundle.rules if rule.severity == severity]
    
    def get_decisions_by_rule(self, rule_id):
        """Get decisions for a specific rule"""
        return [decision for decision in self.bundle.decisions if decision.ruleId == rule_id]
    
    def get_decisions_by_result(self, result):
        """Get decisions by result"""
        return [decision for decision in self.bundle.decisions if decision.output.get('result') == result]
    
    def get_evidence_by_type(self, evidence_type):
        """Get evidence by type"""
        if hasattr(self.bundle, 'evidence'):
            return [evidence for evidence in self.bundle.evidence if evidence['type'] == evidence_type]
        return []
    
    def get_compliance_summary(self):
        """Get compliance summary"""
        total_decisions = len(self.bundle.decisions)
        passed_decisions = sum(1 for d in self.bundle.decisions if d.output.get('result', False))
        
        return {
            'total_decisions': total_decisions,
            'passed_decisions': passed_decisions,
            'failed_decisions': total_decisions - passed_decisions,
            'compliance_rate': (passed_decisions / total_decisions * 100) if total_decisions > 0 else 0
        }

# Use the query class
query = DecisionBundleQuery(bundle)

# Query examples
dsl_rules = query.get_rules_by_type('dsl')
high_severity_rules = query.get_rules_by_severity('high')
consent_decisions = query.get_decisions_by_rule(consent_rule.id)
passed_decisions = query.get_decisions_by_result(True)
document_evidence = query.get_evidence_by_type('document')
summary = query.get_compliance_summary()

print(f"DSL Rules: {len(dsl_rules)}")
print(f"High Severity Rules: {len(high_severity_rules)}")
print(f"Consent Decisions: {len(consent_decisions)}")
print(f"Passed Decisions: {len(passed_decisions)}")
print(f"Document Evidence: {len(document_evidence)}")
print(f"Compliance Summary: {summary}")
```

## Working with Multiple DecisionBundles

### Bundle Collection Management

```python
class DecisionBundleCollection:
    def __init__(self):
        self.bundles = []
    
    def add_bundle(self, bundle):
        """Add a DecisionBundle to the collection"""
        if bundle.validate():
            self.bundles.append(bundle)
            return True
        return False
    
    def load_from_directory(self, directory):
        """Load all DecisionBundles from a directory"""
        import os
        loaded_count = 0
        
        for filename in os.listdir(directory):
            if filename.endswith('.json'):
                try:
                    filepath = os.path.join(directory, filename)
                    with open(filepath, 'r') as f:
                        bundle_data = json.load(f)
                    
                    bundle = DecisionBundle.from_dict(bundle_data)
                    if self.add_bundle(bundle):
                        loaded_count += 1
                        print(f"Loaded: {filename}")
                    else:
                        print(f"Validation failed: {filename}")
                
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
        
        return loaded_count
    
    def get_bundles_by_jurisdiction(self, jurisdiction):
        """Get bundles by jurisdiction"""
        return [bundle for bundle in self.bundles if bundle.metadata.get('jurisdiction') == jurisdiction]
    
    def get_bundles_by_domain(self, domain):
        """Get bundles by domain"""
        return [bundle for bundle in self.bundles if bundle.metadata.get('domain') == domain]
    
    def get_bundles_by_author(self, author):
        """Get bundles by author"""
        return [bundle for bundle in self.bundles if bundle.metadata.get('author') == author]
    
    def get_all_rules(self):
        """Get all rules from all bundles"""
        all_rules = []
        for bundle in self.bundles:
            all_rules.extend(bundle.rules)
        return all_rules
    
    def get_all_decisions(self):
        """Get all decisions from all bundles"""
        all_decisions = []
        for bundle in self.bundles:
            all_decisions.extend(bundle.decisions)
        return all_decisions
    
    def get_global_compliance_summary(self):
        """Get global compliance summary across all bundles"""
        all_decisions = self.get_all_decisions()
        total_decisions = len(all_decisions)
        passed_decisions = sum(1 for d in all_decisions if d.output.get('result', False))
        
        return {
            'total_bundles': len(self.bundles),
            'total_rules': len(self.get_all_rules()),
            'total_decisions': total_decisions,
            'passed_decisions': passed_decisions,
            'failed_decisions': total_decisions - passed_decisions,
            'compliance_rate': (passed_decisions / total_decisions * 100) if total_decisions > 0 else 0
        }

# Use the collection
collection = DecisionBundleCollection()

# Load bundles from directory
collection.load_from_directory('./bundles')

# Query the collection
gdpr_bundles = collection.get_bundles_by_jurisdiction('GDPR')
finance_bundles = collection.get_bundles_by_domain('finance')
all_rules = collection.get_all_rules()
global_summary = collection.get_global_compliance_summary()

print(f"GDPR Bundles: {len(gdpr_bundles)}")
print(f"Finance Bundles: {len(finance_bundles)}")
print(f"Total Rules: {len(all_rules)}")
print(f"Global Summary: {global_summary}")
```

## DecisionBundle Validation

### Schema Validation

```python
def validate_bundle_schema(bundle):
    """Validate DecisionBundle against JSON schema"""
    import jsonschema
    
    # Load the schema (you would normally load this from a file)
    schema = {
        "type": "object",
        "required": ["version", "metadata", "rules", "decisions"],
        "properties": {
            "version": {"type": "string", "enum": ["1.0"]},
            "metadata": {
                "type": "object",
                "required": ["id", "name", "description", "created", "jurisdiction", "domain"],
                "properties": {
                    "id": {"type": "string", "format": "uuid"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "created": {"type": "string", "format": "date-time"},
                    "jurisdiction": {"type": "string"},
                    "domain": {"type": "string", "enum": ["finance", "health", "esg", "general"]}
                }
            },
            "rules": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["id", "name", "type", "definition"],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "type": {"type": "string", "enum": ["dsl", "expression", "decision_table", "decision_tree"]},
                        "definition": {"type": "object"}
                    }
                }
            },
            "decisions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["id", "ruleId", "input", "output", "timestamp"],
                    "properties": {
                        "id": {"type": "string"},
                        "ruleId": {"type": "string"},
                        "input": {"type": "object"},
                        "output": {"type": "object"},
                        "timestamp": {"type": "string", "format": "date-time"}
                    }
                }
            }
        }
    }
    
    try:
        jsonschema.validate(bundle.to_dict(), schema)
        return True, "Schema validation passed"
    except jsonschema.ValidationError as e:
        return False, f"Schema validation failed: {e.message}"
    except Exception as e:
        return False, f"Validation error: {e}"

# Use the validation function
is_valid, message = validate_bundle_schema(bundle)
print(f"Validation: {is_valid}")
print(f"Message: {message}")
```

### Business Rule Validation

```python
def validate_business_rules(bundle):
    """Validate business rules within the DecisionBundle"""
    errors = []
    warnings = []
    
    # Check for duplicate rule IDs
    rule_ids = [rule.id for rule in bundle.rules]
    if len(rule_ids) != len(set(rule_ids)):
        errors.append("Duplicate rule IDs found")
    
    # Check for orphaned decisions (decisions without corresponding rules)
    rule_ids_set = set(rule_ids)
    for decision in bundle.decisions:
        if decision.ruleId not in rule_ids_set:
            errors.append(f"Orphaned decision found: {decision.id} references non-existent rule {decision.ruleId}")
    
    # Check for missing required metadata
    required_metadata = ['id', 'name', 'description', 'created', 'jurisdiction', 'domain']
    for field in required_metadata:
        if field not in bundle.metadata:
            errors.append(f"Missing required metadata field: {field}")
    
    # Check for valid UUID format
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    if not uuid_pattern.match(bundle.metadata['id']):
        errors.append("Invalid UUID format for bundle ID")
    
    # Check for valid date-time format
    try:
        datetime.fromisoformat(bundle.metadata['created'].replace('Z', '+00:00'))
    except ValueError:
        errors.append("Invalid date-time format for created field")
    
    # Check rule definitions
    for rule in bundle.rules:
        if rule.type == 'dsl':
            if 'dsl' not in rule.definition:
                errors.append(f"DSL rule {rule.id} missing 'dsl' field in definition")
        elif rule.type == 'expression':
            if 'expression' not in rule.definition:
                errors.append(f"Expression rule {rule.id} missing 'expression' field in definition")
        elif rule.type == 'decision_table':
            if 'table' not in rule.definition:
                errors.append(f"Decision table rule {rule.id} missing 'table' field in definition")
    
    # Check decision outputs
    for decision in bundle.decisions:
        if 'result' not in decision.output:
            errors.append(f"Decision {decision.id} missing 'result' field in output")
        if 'reason' not in decision.output:
            warnings.append(f"Decision {decision.id} missing 'reason' field in output")
    
    return errors, warnings

# Use business rule validation
errors, warnings = validate_business_rules(bundle)

if errors:
    print("Errors found:")
    for error in errors:
        print(f"  - {error}")

if warnings:
    print("Warnings found:")
    for warning in warnings:
        print(f"  - {warning}")

if not errors and not warnings:
    print("Business rule validation passed!")
```

## DecisionBundle Operations

### Merging DecisionBundles

```python
def merge_decision_bundles(bundle1, bundle2):
    """Merge two DecisionBundles"""
    import uuid
    from datetime import datetime
    
    # Check for conflicts
    rule_ids_1 = {rule.id for rule in bundle1.rules}
    rule_ids_2 = {rule.id for rule in bundle2.rules}
    
    conflicting_rule_ids = rule_ids_1.intersection(rule_ids_2)
    if conflicting_rule_ids:
        print(f"Warning: Conflicting rule IDs found: {conflicting_rule_ids}")
    
    # Create merged bundle
    merged_bundle = DecisionBundle(
        version="1.0",
        metadata={
            "id": str(uuid.uuid4()),
            "name": f"Merged: {bundle1.metadata['name']} + {bundle2.metadata['name']}",
            "description": f"Merged bundle created on {datetime.now().isoformat()}",
            "created": datetime.now().isoformat(),
            "author": "System",
            "jurisdiction": f"{bundle1.metadata['jurisdiction']}, {bundle2.metadata['jurisdiction']}",
            "domain": bundle1.metadata['domain'],  # Use domain from first bundle
            "tags": list(set(bundle1.metadata.get('tags', []) + bundle2.metadata.get('tags', [])))
        },
        rules=bundle1.rules + bundle2.rules,
        decisions=bundle1.decisions + bundle2.decisions
    )
    
    # Add evidence if present
    evidence = []
    if hasattr(bundle1, 'evidence') and bundle1.evidence:
        evidence.extend(bundle1.evidence)
    if hasattr(bundle2, 'evidence') and bundle2.evidence:
        evidence.extend(bundle2.evidence)
    
    if evidence:
        merged_bundle.evidence = evidence
    
    # Create audit trail
    audit_trail = [
        {
            "timestamp": datetime.now().isoformat(),
            "action": "bundle_merged",
            "user": "system",
            "details": {
                "source_bundles": [bundle1.metadata['id'], bundle2.metadata['id']],
                "merged_bundle_id": merged_bundle.metadata['id']
            }
        }
    ]
    
    merged_bundle.audit = {
        "created": datetime.now().isoformat(),
        "modified": datetime.now().isoformat(),
        "version": "1.0",
        "trail": audit_trail
    }
    
    return merged_bundle

# Use the merge function
merged_bundle = merge_decision_bundles(bundle1, bundle2)
if merged_bundle.validate():
    merged_bundle.save("merged_bundle.json")
    print("DecisionBundles merged successfully!")
else:
    print("Merged DecisionBundle validation failed!")
```

### Filtering DecisionBundles

```python
def filter_decision_bundle(bundle, filters):
    """Filter a DecisionBundle based on criteria"""
    import copy
    
    # Create a deep copy of the bundle
    filtered_bundle = copy.deepcopy(bundle)
    
    # Filter rules
    if 'rule_types' in filters:
        filtered_bundle.rules = [
            rule for rule in filtered_bundle.rules 
            if rule.type in filters['rule_types']
        ]
    
    if 'rule_severities' in filters:
        filtered_bundle.rules = [
            rule for rule in filtered_bundle.rules 
            if rule.severity in filters['rule_severities']
        ]
    
    # Filter decisions
    if 'decision_results' in filters:
        filtered_bundle.decisions = [
            decision for decision in filtered_bundle.decisions 
            if decision.output.get('result') in filters['decision_results']
        ]
    
    # Filter evidence
    if hasattr(filtered_bundle, 'evidence') and 'evidence_types' in filters:
        filtered_bundle.evidence = [
            evidence for evidence in filtered_bundle.evidence 
            if evidence['type'] in filters['evidence_types']
        ]
    
    # Update metadata to reflect filtering
    filtered_bundle.metadata['name'] = f"Filtered: {filtered_bundle.metadata['name']}"
    filtered_bundle.metadata['description'] = f"Filtered bundle with criteria: {filters}"
    
    return filtered_bundle

# Use the filter function
filters = {
    'rule_types': ['dsl'],
    'rule_severities': ['high'],
    'decision_results': [True],
    'evidence_types': ['document']
}

filtered_bundle = filter_decision_bundle(bundle, filters)
if filtered_bundle.validate():
    filtered_bundle.save("filtered_bundle.json")
    print("DecisionBundle filtered successfully!")
    print(f"Original rules: {len(bundle.rules)}")
    print(f"Filtered rules: {len(filtered_bundle.rules)}")
else:
    print("Filtered DecisionBundle validation failed!")
```

## Best Practices

### 1. Bundle Organization

#### Use Clear Naming Conventions
```python
# Good naming convention
bundle = DecisionBundle(
    metadata={
        "name": "GDPR_Compliance_Q1_2024",
        "description": "GDPR compliance assessment for Q1 2024",
        "jurisdiction": "GDPR",
        "domain": "general"
    }
)

# Avoid unclear naming
bundle = DecisionBundle(
    metadata={
        "name": "compliance_bundle",
        "description": "compliance stuff",
        "jurisdiction": "GDPR",
        "domain": "general"
    }
)
```

#### Include Comprehensive Metadata
```python
bundle = DecisionBundle(
    metadata={
        "id": str(uuid.uuid4()),
        "name": "GDPR Compliance Assessment",
        "description": "Comprehensive GDPR compliance assessment including consent validation and data minimization",
        "created": datetime.now().isoformat(),
        "modified": datetime.now().isoformat(),
        "author": "Compliance Team",
        "jurisdiction": "GDPR",
        "domain": "general",
        "tags": ["gdpr", "privacy", "consent", "data_protection", "q1_2024"]
    }
)
```

### 2. Rule Management

#### Keep Rules Focused
```python
# Good - Focused rule
consent_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="GDPR Consent Validation",
    type="dsl",
    definition={
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE"
    }
)

# Avoid - Overly complex rule
complex_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="GDPR Everything",
    type="dsl",
    definition={
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE AND user.data_minimized = TRUE AND user.retention_specified = TRUE AND user.rights_respected = TRUE"
    }
)
```

#### Use Appropriate Rule Types
```python
# Use DSL for human-readable rules
dsl_rule = ComplianceRule(
    name="Consent Check",
    type="dsl",
    definition={
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE"
    }
)

# Use expression for complex boolean logic
expression_rule = ComplianceRule(
    name="Complex Validation",
    type="expression",
    definition={
        "expression": "(user.age >= 18 AND user.verified) OR (user.parental_consent = TRUE)"
    }
)

# Use decision tables for complex business logic
decision_table_rule = ComplianceRule(
    name="Risk Assessment",
    type="decision_table",
    definition={
        "table": {
            "conditions": [
                {"field": "transaction.amount", "operator": ">", "value": 10000},
                {"field": "customer.risk_score", "operator": ">", "value": 75}
            ],
            "actions": [
                {"result": false, "reason": "High-risk transaction"}
            ]
        }
    }
)
```

### 3. Evidence Management

#### Include Comprehensive Evidence
```python
evidence = [
    {
        "id": "privacy-policy-001",
        "type": "document",
        "content": {
            "document_type": "privacy_policy",
            "version": "2.1",
            "url": "/privacy-policy-v2.1.pdf"
        },
        "timestamp": "2024-01-10T09:00:00Z",
        "source": "document-management-system",
        "hash": "sha256:abc123..."  # Always include hash for integrity
    },
    {
        "id": "consent-log-001",
        "type": "log",
        "content": {
            "event": "consent_given",
            "user_id": "user-123",
            "timestamp": "2024-01-15T10:30:00Z"
        },
        "timestamp": "2024-01-15T10:30:00Z",
        "source": "application-logs",
        "hash": "sha256:def456..."
    }
]
```

#### Use Cryptographic Hashes
```python
import hashlib

def calculate_hash(content):
    """Calculate SHA-256 hash of content"""
    if isinstance(content, str):
        content_bytes = content.encode('utf-8')
    elif isinstance(content, dict):
        content_bytes = json.dumps(content, sort_keys=True).encode('utf-8')
    else:
        content_bytes = str(content).encode('utf-8')
    
    return hashlib.sha256(content_bytes).hexdigest()

# Use in evidence
evidence = {
    "id": "document-001",
    "type": "document",
    "content": {"document_type": "policy", "version": "1.0"},
    "hash": calculate_hash({"document_type": "policy", "version": "1.0"})
}
```

### 4. Audit Trail Management

#### Maintain Complete Audit Trail
```python
audit_trail = [
    {
        "timestamp": "2024-01-15T10:00:00Z",
        "action": "bundle_created",
        "user": "compliance-officer",
        "details": {
            "reason": "Initial compliance assessment"
        }
    },
    {
        "timestamp": "2024-01-15T10:30:00Z",
        "action": "decision_added",
        "user": "compliance-engine",
        "details": {
            "decision_id": "decision-001",
            "rule_id": "rule-001"
        }
    },
    {
        "timestamp": "2024-01-15T11:00:00Z",
        "action": "evidence_added",
        "user": "compliance-officer",
        "details": {
            "evidence_id": "evidence-001",
            "evidence_type": "document"
        }
    }
]
```

#### Include Detailed Context
```python
audit_entry = {
    "timestamp": datetime.now().isoformat(),
    "action": "rule_modified",
    "user": "compliance-officer",
    "details": {
        "rule_id": "rule-001",
        "rule_name": "Consent Validation",
        "modification_type": "severity_updated",
        "old_value": "medium",
        "new_value": "high",
        "reason": "Increased risk assessment"
    },
    "context": {
        "session_id": "session-123",
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0..."
    }
}
```

## Common Issues and Solutions

### 1. Validation Failures

**Problem**: DecisionBundle fails schema validation
**Solution**: Check required fields and data types

```python
def debug_validation_errors(bundle):
    """Debug validation errors"""
    print("Debugging DecisionBundle validation...")
    
    # Check required top-level fields
    required_fields = ['version', 'metadata', 'rules', 'decisions']
    for field in required_fields:
        if not hasattr(bundle, field):
            print(f"Missing required field: {field}")
    
    # Check metadata
    if hasattr(bundle, 'metadata'):
        required_metadata = ['id', 'name', 'description', 'created', 'jurisdiction', 'domain']
        for field in required_metadata:
            if field not in bundle.metadata:
                print(f"Missing required metadata field: {field}")
    
    # Check rules
    if hasattr(bundle, 'rules'):
        for i, rule in enumerate(bundle.rules):
            if not hasattr(rule, 'id'):
                print(f"Rule {i} missing ID")
            if not hasattr(rule, 'name'):
                print(f"Rule {i} missing name")
            if not hasattr(rule, 'type'):
                print(f"Rule {i} missing type")
            if not hasattr(rule, 'definition'):
                print(f"Rule {i} missing definition")
    
    # Check decisions
    if hasattr(bundle, 'decisions'):
        for i, decision in enumerate(bundle.decisions):
            if not hasattr(decision, 'id'):
                print(f"Decision {i} missing ID")
            if not hasattr(decision, 'ruleId'):
                print(f"Decision {i} missing ruleId")
            if not hasattr(decision, 'input'):
                print(f"Decision {i} missing input")
            if not hasattr(decision, 'output'):
                print(f"Decision {i} missing output")
            if not hasattr(decision, 'timestamp'):
                print(f"Decision {i} missing timestamp")

# Use the debug function
debug_validation_errors(bundle)
```

### 2. Performance Issues

**Problem**: Large DecisionBundles are slow to process
**Solution**: Optimize bundle structure and use filtering

```python
def optimize_bundle_performance(bundle):
    """Optimize DecisionBundle for better performance"""
    # Remove duplicate rules
    rule_ids = set()
    unique_rules = []
    for rule in bundle.rules:
        if rule.id not in rule_ids:
            rule_ids.add(rule.id)
            unique_rules.append(rule)
    bundle.rules = unique_rules
    
    # Remove orphaned decisions
    rule_ids_set = {rule.id for rule in bundle.rules}
    bundle.decisions = [
        decision for decision in bundle.decisions 
        if decision.ruleId in rule_ids_set
    ]
    
    # Compress evidence if too large
    if hasattr(bundle, 'evidence') and len(bundle.evidence) > 1000:
        print(f"Warning: Large evidence set ({len(bundle.evidence)} items)")
        # Consider implementing evidence pagination or compression
    
    return bundle

# Use the optimization function
optimized_bundle = optimize_bundle_performance(bundle.copy())
```

### 3. Memory Issues

**Problem**: Memory usage spikes when processing large bundles
**Solution**: Use streaming and batch processing

```python
def process_large_bundle_streaming(bundle_path, batch_size=100):
    """Process large DecisionBundle in batches"""
    import json
    
    with open(bundle_path, 'r') as f:
        bundle_data = json.load(f)
    
    # Process rules in batches
    rules = bundle_data.get('rules', [])
    for i in range(0, len(rules), batch_size):
        batch = rules[i:i + batch_size]
        print(f"Processing rules batch {i//batch_size + 1}: {len(batch)} rules")
        # Process batch here
    
    # Process decisions in batches
    decisions = bundle_data.get('decisions', [])
    for i in range(0, len(decisions), batch_size):
        batch = decisions[i:i + batch_size]
        print(f"Processing decisions batch {i//batch_size + 1}: {len(batch)} decisions")
        # Process batch here
    
    print("Large bundle processing completed")
```

## Next Steps

Now that you understand how to work with DecisionBundles, you're ready to:

1. **Practice with Real Examples**: Try creating DecisionBundles for your specific use cases
2. **Learn Advanced Topics**: [Go to Advanced Topics](advanced-topics.md)
3. **Explore Integration**: Learn about [system integration](../developers/integration.md)
4. **Build Complete Solutions**: Create end-to-end compliance solutions

---

**Mastering DecisionBundles is essential for building effective compliance systems with GlassBox Standard.**