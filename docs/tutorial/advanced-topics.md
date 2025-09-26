---
sidebar_position: 5
---

# Advanced Topics

In this final section of the tutorial, we'll explore advanced topics in GlassBox Standard v1.0. These topics will help you build sophisticated compliance solutions and optimize your implementations for production environments.

## Advanced DSL Features

### 1. Complex Pattern Matching

#### Regular Expression Patterns
```python
from glassbox import ComplianceRule
import uuid

# Advanced pattern matching with regex
pattern_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Email Pattern Validation",
    description="Validate email patterns for official communications",
    type="dsl",
    definition={
        "dsl": "WHEN communication.official = TRUE THEN MUST communication.email MATCHES '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' AND communication.email_domain IN ['gov', 'edu', 'org']",
        "parameters": {
            "communication.official": "boolean",
            "communication.email": "string",
            "communication.email_domain": "string"
        }
    },
    severity="medium",
    category="communication_validation"
)
```

#### Wildcard Patterns
```python
# Wildcard pattern matching
wildcard_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="File Path Validation",
    description="Validate file paths for sensitive data",
    type="dsl",
    definition={
        "dsl": "WHEN file.accessed = TRUE THEN MUST file.path NOT LIKE '/sensitive/*' AND file.path NOT LIKE '/confidential/*'",
        "parameters": {
            "file.accessed": "boolean",
            "file.path": "string"
        }
    },
    severity="high",
    category="file_access"
)
```

### 2. Advanced Temporal Logic

#### Complex Time-Based Conditions
```python
# Complex temporal conditions
temporal_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Session Security",
    description="Advanced session security checks",
    type="dsl",
    definition={
        "dsl": "WHEN session.active = TRUE THEN MUST (session.last_login WITHIN 24 HOURS AND session.activity_count < 1000) OR (session.mfa_completed = TRUE AND session.last_activity WITHIN 1 HOUR)",
        "parameters": {
            "session.active": "boolean",
            "session.last_login": "datetime",
            "session.activity_count": "number",
            "session.mfa_completed": "boolean",
            "session.last_activity": "datetime"
        }
    },
    severity="high",
    category="security"
)
```

#### Recurring Time Patterns
```python
# Recurring time patterns
recurring_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Recurring Compliance Check",
    description="Check compliance on recurring schedule",
    type="dsl",
    definition={
        "dsl": "WHEN current_time MATCHES '.*T09:00:00.*' AND current_day IN ['MONDAY', 'WEDNESDAY', 'FRIDAY'] THEN MUST daily_compliance_check = TRUE AND weekly_report_generated = TRUE",
        "parameters": {
            "current_time": "datetime",
            "current_day": "string",
            "daily_compliance_check": "boolean",
            "weekly_report_generated": "boolean"
        }
    },
    severity="medium",
    category="scheduled_compliance"
)
```

### 3. Advanced Conditional Logic

#### Nested Conditions with Groups
```python
# Nested conditions with grouping
nested_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Complex AML Detection",
    description="Advanced AML pattern detection with nested logic",
    type="dsl",
    definition={
        "dsl": "WHEN (transaction.amount > 10000 AND transaction.type = 'cash') OR ((customer.risk_score > 75 OR customer.new_customer = TRUE) AND transaction.frequency > 5) OR (transaction.geographic_pattern_suspicious = TRUE AND transaction.amount > 5000) THEN MUST transaction.flagged = TRUE AND transaction.investigation_required = TRUE",
        "parameters": {
            "transaction.amount": "number",
            "transaction.type": "string",
            "transaction.flagged": "boolean",
            "transaction.investigation_required": "boolean",
            "transaction.frequency": "number",
            "transaction.geographic_pattern_suspicious": "boolean",
            "customer.risk_score": "number",
            "customer.new_customer": "boolean"
        }
    },
    severity="critical",
    category="aml_advanced"
)
```

#### Conditional Actions
```python
# Conditional actions based on severity
conditional_action_rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="Risk-Based Response",
    description="Apply different actions based on risk level",
    type="dsl",
    definition={
        "dsl": "WHEN risk.assessed = TRUE THEN IF risk.level = 'critical' THEN MUST immediate_action = TRUE AND escalation_required = TRUE ELSE IF risk.level = 'high' THEN MUST enhanced_monitoring = TRUE AND review_within_24h = TRUE ELSE IF risk.level = 'medium' THEN MUST standard_monitoring = TRUE AND review_within_7d = TRUE ELSE MUST routine_monitoring = TRUE",
        "parameters": {
            "risk.assessed": "boolean",
            "risk.level": "string",
            "immediate_action": "boolean",
            "escalation_required": "boolean",
            "enhanced_monitoring": "boolean",
            "review_within_24h": "boolean",
            "standard_monitoring": "boolean",
            "review_within_7d": "boolean",
            "routine_monitoring": "boolean"
        }
    },
    severity="high",
    category="risk_management"
)
```

## Advanced DecisionBundle Features

### 1. Digital Signatures and Security

#### Implementing Digital Signatures
```python
import json
import hashlib
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

class DecisionBundleSigner:
    def __init__(self):
        # Generate RSA key pair
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        self.public_key = self.private_key.public_key()
    
    def sign_bundle(self, bundle):
        """Sign a DecisionBundle"""
        # Create canonical JSON representation
        bundle_dict = bundle.to_dict()
        canonical_json = json.dumps(bundle_dict, sort_keys=True, separators=(',', ':'))
        
        # Calculate hash
        digest = hashlib.sha256(canonical_json.encode()).digest()
        
        # Sign the hash
        signature = self.private_key.sign(
            digest,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        # Add signature to bundle
        bundle.metadata['signature'] = {
            'algorithm': 'RS256',
            'public_key': self.public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode(),
            'value': signature.hex()
        }
        
        return bundle
    
    def verify_bundle(self, bundle):
        """Verify a DecisionBundle signature"""
        if 'signature' not in bundle.metadata:
            return False, "No signature found"
        
        try:
            # Extract signature data
            signature_data = bundle.metadata['signature']
            signature = bytes.fromhex(signature_data['value'])
            public_key_pem = signature_data['public_key']
            
            # Load public key
            public_key = serialization.load_pem_public_key(
                public_key_pem.encode(),
                backend=None
            )
            
            # Create canonical JSON (excluding signature)
            bundle_copy = bundle.to_dict()
            bundle_copy['metadata'] = bundle.metadata.copy()
            bundle_copy['metadata'].pop('signature', None)
            
            canonical_json = json.dumps(bundle_copy, sort_keys=True, separators=(',', ':'))
            digest = hashlib.sha256(canonical_json.encode()).digest()
            
            # Verify signature
            public_key.verify(
                signature,
                digest,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return True, "Signature verified successfully"
        
        except Exception as e:
            return False, f"Signature verification failed: {e}"

# Use the signer
signer = DecisionBundleSigner()

# Sign a bundle
signed_bundle = signer.sign_bundle(bundle)
print("Bundle signed successfully!")

# Verify the bundle
is_valid, message = signer.verify_bundle(signed_bundle)
print(f"Signature verification: {is_valid}, {message}")
```

### 2. Evidence Chain Management

#### Implementing Evidence Chain of Custody
```python
class EvidenceChainManager:
    def __init__(self):
        self.evidence_chain = []
    
    def add_evidence(self, evidence_type, content, source, custodian):
        """Add evidence to the chain with custody tracking"""
        import uuid
        from datetime import datetime
        import hashlib
        
        evidence_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Calculate hash
        content_hash = hashlib.sha256(
            json.dumps(content, sort_keys=True).encode()
        ).hexdigest()
        
        evidence = {
            "id": evidence_id,
            "type": evidence_type,
            "content": content,
            "timestamp": timestamp,
            "source": source,
            "hash": content_hash,
            "custody": {
                "current_custodian": custodian,
                "custody_history": [
                    {
                        "custodian": custodian,
                        "timestamp": timestamp,
                        "action": "created"
                    }
                ]
            }
        }
        
        self.evidence_chain.append(evidence)
        return evidence_id
    
    def transfer_custody(self, evidence_id, new_custodian, reason):
        """Transfer custody of evidence"""
        from datetime import datetime
        
        for evidence in self.evidence_chain:
            if evidence['id'] == evidence_id:
                transfer_record = {
                    "custodian": new_custodian,
                    "timestamp": datetime.now().isoformat(),
                    "action": "transferred",
                    "reason": reason,
                    "previous_custodian": evidence['custody']['current_custodian']
                }
                
                evidence['custody']['custody_history'].append(transfer_record)
                evidence['custody']['current_custodian'] = new_custodian
                return True
        
        return False
    
    def verify_evidence_integrity(self, evidence_id):
        """Verify evidence integrity"""
        import hashlib
        
        for evidence in self.evidence_chain:
            if evidence['id'] == evidence_id:
                current_hash = hashlib.sha256(
                    json.dumps(evidence['content'], sort_keys=True).encode()
                ).hexdigest()
                
                return current_hash == evidence['hash']
        
        return False
    
    def get_evidence_history(self, evidence_id):
        """Get complete custody history for evidence"""
        for evidence in self.evidence_chain:
            if evidence['id'] == evidence_id:
                return evidence['custody']['custody_history']
        
        return None

# Use the evidence chain manager
chain_manager = EvidenceChainManager()

# Add evidence
evidence_id = chain_manager.add_evidence(
    evidence_type="document",
    content={"type": "privacy_policy", "version": "2.1"},
    source="document-management-system",
    custodian="compliance-officer"
)

# Transfer custody
chain_manager.transfer_custody(
    evidence_id=evidence_id,
    new_custodian="legal-team",
    reason="legal review required"
)

# Verify integrity
is_intact = chain_manager.verify_evidence_integrity(evidence_id)
print(f"Evidence integrity: {is_intact}")

# Get history
history = chain_manager.get_evidence_history(evidence_id)
print(f"Evidence history: {history}")
```

### 3. Advanced Audit Trail Features

#### Implementing Immutable Audit Logs
```python
import hashlib
import json
from datetime import datetime

class ImmutableAuditLogger:
    def __init__(self):
        self.audit_chain = []
        self.previous_hash = None
    
    def log_action(self, action, user, details, context=None):
        """Log an action with immutable chain"""
        timestamp = datetime.now().isoformat()
        
        # Create audit entry
        audit_entry = {
            "timestamp": timestamp,
            "action": action,
            "user": user,
            "details": details,
            "context": context or {},
            "sequence_number": len(self.audit_chain) + 1
        }
        
        # Calculate entry hash
        entry_data = {
            "entry": audit_entry,
            "previous_hash": self.previous_hash
        }
        
        entry_hash = hashlib.sha256(
            json.dumps(entry_data, sort_keys=True).encode()
        ).hexdigest()
        
        # Add hash to entry
        audit_entry['hash'] = entry_hash
        audit_entry['previous_hash'] = self.previous_hash
        
        # Add to chain
        self.audit_chain.append(audit_entry)
        self.previous_hash = entry_hash
        
        return entry_hash
    
    def verify_audit_integrity(self):
        """Verify the integrity of the entire audit chain"""
        current_hash = None
        
        for i, entry in enumerate(self.audit_chain):
            # Recalculate hash for this entry
            entry_data = {
                "entry": {k: v for k, v in entry.items() if k not in ['hash', 'previous_hash']},
                "previous_hash": entry['previous_hash']
            }
            
            calculated_hash = hashlib.sha256(
                json.dumps(entry_data, sort_keys=True).encode()
            ).hexdigest()
            
            if calculated_hash != entry['hash']:
                return False, f"Hash mismatch at entry {i}"
            
            if i > 0 and entry['previous_hash'] != current_hash:
                return False, f"Chain broken at entry {i}"
            
            current_hash = calculated_hash
        
        return True, "Audit chain integrity verified"
    
    def get_audit_trail(self, start_time=None, end_time=None, user=None, action=None):
        """Get filtered audit trail"""
        filtered_trail = []
        
        for entry in self.audit_chain:
            # Apply filters
            if start_time and entry['timestamp'] < start_time:
                continue
            if end_time and entry['timestamp'] > end_time:
                continue
            if user and entry['user'] != user:
                continue
            if action and entry['action'] != action:
                continue
            
            filtered_trail.append(entry)
        
        return filtered_trail

# Use the immutable audit logger
audit_logger = ImmutableAuditLogger()

# Log various actions
audit_logger.log_action(
    action="bundle_created",
    user="compliance-officer",
    details={"bundle_id": "bundle-001"},
    context={"session_id": "session-123", "ip": "192.168.1.100"}
)

audit_logger.log_action(
    action="rule_added",
    user="compliance-officer",
    details={"rule_id": "rule-001", "rule_name": "Consent Validation"},
    context={"session_id": "session-123"}
)

audit_logger.log_action(
    action="decision_made",
    user="compliance-engine",
    details={"decision_id": "decision-001", "result": True},
    context={"session_id": "session-456"}
)

# Verify integrity
is_valid, message = audit_logger.verify_audit_integrity()
print(f"Audit integrity: {is_valid}, {message}")

# Get filtered trail
recent_actions = audit_logger.get_audit_trail(
    start_time="2024-01-15T10:00:00Z",
    user="compliance-officer"
)
print(f"Recent actions: {len(recent_actions)}")
```

## Performance Optimization

### 1. Rule Execution Optimization

#### Caching Rule Results
```python
from functools import lru_cache
import hashlib

class OptimizedRuleEngine:
    def __init__(self):
        self.rule_cache = {}
        self.cache_hits = 0
        self.cache_misses = 0
    
    def cache_key(self, rule_id, input_data):
        """Generate cache key for rule execution"""
        input_str = json.dumps(input_data, sort_keys=True)
        return hashlib.md5(f"{rule_id}:{input_str}".encode()).hexdigest()
    
    def execute_rule_with_cache(self, rule, input_data):
        """Execute rule with caching"""
        cache_key = self.cache_key(rule.id, input_data)
        
        if cache_key in self.rule_cache:
            self.cache_hits += 1
            return self.rule_cache[cache_key]
        
        # Execute rule (placeholder for actual rule execution)
        result = self._execute_rule_logic(rule, input_data)
        
        # Cache result
        self.rule_cache[cache_key] = result
        self.cache_misses += 1
        
        return result
    
    def _execute_rule_logic(self, rule, input_data):
        """Actual rule execution logic"""
        # This is a simplified example
        if rule.type == 'dsl':
            # Parse and execute DSL rule
            return self._execute_dsl_rule(rule, input_data)
        elif rule.type == 'expression':
            # Parse and execute expression rule
            return self._execute_expression_rule(rule, input_data)
        else:
            return {"result": False, "reason": "Unsupported rule type"}
    
    def _execute_dsl_rule(self, rule, input_data):
        """Execute DSL rule"""
        # Simplified DSL execution
        dsl = rule.definition.get('dsl', '')
        if 'WHEN user.consent_given = TRUE' in dsl:
            consent_given = input_data.get('user', {}).get('consent_given', False)
            if consent_given:
                return {"result": True, "reason": "Consent given"}
            else:
                return {"result": False, "reason": "Consent not given"}
        return {"result": False, "reason": "Rule not matched"}
    
    def _execute_expression_rule(self, rule, input_data):
        """Execute expression rule"""
        # Simplified expression execution
        expression = rule.definition.get('expression', '')
        # This would require a proper expression parser
        return {"result": False, "reason": "Expression execution not implemented"}
    
    def get_cache_stats(self):
        """Get cache performance statistics"""
        total_requests = self.cache_hits + self.cache_misses
        hit_rate = (self.cache_hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "total_requests": total_requests,
            "hit_rate": f"{hit_rate:.2f}%"
        }
    
    def clear_cache(self):
        """Clear the rule cache"""
        self.rule_cache.clear()
        self.cache_hits = 0
        self.cache_misses = 0

# Use the optimized rule engine
engine = OptimizedRuleEngine()

# Execute rules with caching
rule = ComplianceRule(
    id="rule-001",
    name="Consent Check",
    type="dsl",
    definition={
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE"
    }
)

input_data = {"user": {"consent_given": True, "consent_informed": True}}

# Execute multiple times to test caching
for i in range(5):
    result = engine.execute_rule_with_cache(rule, input_data)
    print(f"Execution {i+1}: {result}")

# Get cache statistics
stats = engine.get_cache_stats()
print(f"Cache statistics: {stats}")
```

### 2. Batch Processing Optimization

#### Processing DecisionBundles in Batches
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed

class BatchProcessor:
    def __init__(self, max_workers=4):
        self.max_workers = max_workers
    
    def process_decision_bundle_batch(self, bundles):
        """Process multiple DecisionBundles in parallel"""
        results = {}
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_bundle = {
                executor.submit(self.process_single_bundle, bundle): bundle 
                for bundle in bundles
            }
            
            # Collect results
            for future in as_completed(future_to_bundle):
                bundle = future_to_bundle[future]
                try:
                    result = future.result()
                    results[bundle.metadata['id']] = result
                except Exception as e:
                    results[bundle.metadata['id']] = {"error": str(e)}
        
        return results
    
    def process_single_bundle(self, bundle):
        """Process a single DecisionBundle"""
        try:
            # Validate bundle
            if not bundle.validate():
                return {"status": "error", "message": "Bundle validation failed"}
            
            # Process rules
            rule_results = []
            for rule in bundle.rules:
                rule_result = self.process_rule(rule, bundle)
                rule_results.append(rule_result)
            
            # Process decisions
            decision_results = []
            for decision in bundle.decisions:
                decision_result = self.process_decision(decision, bundle)
                decision_results.append(decision_result)
            
            return {
                "status": "success",
                "rule_results": rule_results,
                "decision_results": decision_results,
                "processing_time": self._get_processing_time()
            }
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def process_rule(self, rule, bundle):
        """Process a single rule"""
        # Find related decisions
        related_decisions = [
            decision for decision in bundle.decisions 
            if decision.ruleId == rule.id
        ]
        
        return {
            "rule_id": rule.id,
            "rule_name": rule.name,
            "related_decisions": len(related_decisions),
            "decisions_passed": sum(1 for d in related_decisions if d.output.get('result', False)),
            "severity": rule.severity
        }
    
    def process_decision(self, decision, bundle):
        """Process a single decision"""
        # Find the related rule
        related_rule = next(
            (rule for rule in bundle.rules if rule.id == decision.ruleId),
            None
        )
        
        return {
            "decision_id": decision.id,
            "rule_id": decision.ruleId,
            "rule_name": related_rule.name if related_rule else "Unknown",
            "result": decision.output.get('result', False),
            "confidence": decision.output.get('confidence', 0),
            "timestamp": decision.timestamp
        }
    
    def _get_processing_time(self):
        """Get processing time (placeholder)"""
        import time
        return time.time()

# Use the batch processor
processor = BatchProcessor(max_workers=4)

# Create sample bundles
bundles = [bundle1, bundle2, bundle3, bundle4]  # Assume these are defined

# Process in batch
batch_results = processor.process_decision_bundle_batch(bundles)

# Display results
for bundle_id, result in batch_results.items():
    print(f"Bundle {bundle_id}: {result['status']}")
    if result['status'] == 'success':
        print(f"  Rules processed: {len(result['rule_results'])}")
        print(f"  Decisions processed: {len(result['decision_results'])}")
        print(f"  Processing time: {result['processing_time']}")
    else:
        print(f"  Error: {result['message']}")
```

### 3. Memory Optimization

#### Streaming Large DecisionBundles
```python
import json
import ijson

class StreamingDecisionBundleProcessor:
    def __init__(self):
        self.chunk_size = 1024  # 1KB chunks
    
    def process_large_bundle_streaming(self, file_path):
        """Process a large DecisionBundle using streaming"""
        results = {
            "rules_processed": 0,
            "decisions_processed": 0,
            "evidence_processed": 0,
            "errors": []
        }
        
        try:
            with open(file_path, 'r') as f:
                # Use ijson for streaming JSON parsing
                parser = ijson.parse(f)
                
                current_path = []
                current_object = None
                
                for prefix, event, value in parser:
                    # Track current path in JSON structure
                    if event == 'start_map':
                        current_path.append(prefix)
                        if prefix == '':
                            current_object = {}
                    elif event == 'end_map':
                        current_path.pop()
                    elif event in ['start_array', 'end_array']:
                        continue
                    
                    # Process based on path
                    if prefix == 'rules.item':
                        self._process_rule_streaming(value, results)
                        results["rules_processed"] += 1
                    elif prefix == 'decisions.item':
                        self._process_decision_streaming(value, results)
                        results["decisions_processed"] += 1
                    elif prefix == 'evidence.item':
                        self._process_evidence_streaming(value, results)
                        results["evidence_processed"] += 1
                    
                    # Handle large values
                    if isinstance(value, str) and len(value) > 10000:
                        # Process large string values in chunks
                        self._process_large_value(value, results)
        
        except Exception as e:
            results["errors"].append(f"Processing error: {e}")
        
        return results
    
    def _process_rule_streaming(self, rule_data, results):
        """Process rule data from stream"""
        try:
            # Validate required fields
            required_fields = ['id', 'name', 'type', 'definition']
            for field in required_fields:
                if field not in rule_data:
                    results["errors"].append(f"Rule missing required field: {field}")
                    return
            
            # Process rule type-specific validation
            if rule_data['type'] == 'dsl':
                if 'dsl' not in rule_data.get('definition', {}):
                    results["errors"].append(f"DSL rule missing DSL definition")
            elif rule_data['type'] == 'expression':
                if 'expression' not in rule_data.get('definition', {}):
                    results["errors"].append(f"Expression rule missing expression")
            
        except Exception as e:
            results["errors"].append(f"Rule processing error: {e}")
    
    def _process_decision_streaming(self, decision_data, results):
        """Process decision data from stream"""
        try:
            # Validate required fields
            required_fields = ['id', 'ruleId', 'input', 'output', 'timestamp']
            for field in required_fields:
                if field not in decision_data:
                    results["errors"].append(f"Decision missing required field: {field}")
                    return
            
            # Validate output structure
            output = decision_data.get('output', {})
            if 'result' not in output:
                results["errors"].append(f"Decision missing result in output")
            
        except Exception as e:
            results["errors"].append(f"Decision processing error: {e}")
    
    def _process_evidence_streaming(self, evidence_data, results):
        """Process evidence data from stream"""
        try:
            # Validate required fields
            required_fields = ['id', 'type', 'content', 'timestamp']
            for field in required_fields:
                if field not in evidence_data:
                    results["errors"].append(f"Evidence missing required field: {field}")
                    return
            
            # Validate evidence hash if present
            if 'hash' in evidence_data:
                # In a real implementation, you would verify the hash
                pass
            
        except Exception as e:
            results["errors"].append(f"Evidence processing error: {e}")
    
    def _process_large_value(self, value, results):
        """Process large string values"""
        # Process in chunks
        for i in range(0, len(value), self.chunk_size):
            chunk = value[i:i + self.chunk_size]
            # Process chunk (e.g., scan for sensitive data)
            if 'sensitive' in chunk.lower():
                results["errors"].append(f"Potential sensitive data found in large value")

# Use the streaming processor
streaming_processor = StreamingDecisionBundleProcessor()

# Process a large bundle
results = streaming_processor.process_large_bundle_streaming('large_bundle.json')

print(f"Processing results:")
print(f"Rules processed: {results['rules_processed']}")
print(f"Decisions processed: {results['decisions_processed']}")
print(f"Evidence processed: {results['evidence_processed']}")
print(f"Errors: {len(results['errors'])}")

for error in results['errors'][:5]:  # Show first 5 errors
    print(f"  - {error}")
```

## Security Best Practices

### 1. Input Validation and Sanitization

#### Comprehensive Input Validation
```python
import re
from datetime import datetime
import uuid

class InputValidator:
    def __init__(self):
        self.patterns = {
            'uuid': r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            'datetime_iso': r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$',
            'jurisdiction': r'^[A-Z]{2,10}$',
            'domain': r'^(finance|health|esg|general)$'
        }
    
    def validate_uuid(self, value):
        """Validate UUID format"""
        if not isinstance(value, str):
            return False, "UUID must be a string"
        
        if not re.match(self.patterns['uuid'], value):
            return False, "Invalid UUID format"
        
        try:
            uuid.UUID(value)
            return True, "Valid UUID"
        except ValueError:
            return False, "Invalid UUID value"
    
    def validate_datetime(self, value):
        """Validate ISO datetime format"""
        if not isinstance(value, str):
            return False, "Datetime must be a string"
        
        if not re.match(self.patterns['datetime_iso'], value):
            return False, "Invalid datetime format"
        
        try:
            # Try to parse the datetime
            if value.endswith('Z'):
                dt = datetime.fromisoformat(value[:-1] + '+00:00')
            else:
                dt = datetime.fromisoformat(value)
            return True, "Valid datetime"
        except ValueError:
            return False, "Invalid datetime value"
    
    def validate_jurisdiction(self, value):
        """Validate jurisdiction code"""
        if not isinstance(value, str):
            return False, "Jurisdiction must be a string"
        
        if not re.match(self.patterns['jurisdiction'], value):
            return False, "Invalid jurisdiction format"
        
        # Check against known jurisdictions
        known_jurisdictions = ['GDPR', 'CCPA', 'HIPAA', 'AML', 'FATF', 'ESG']
        if value not in known_jurisdictions:
            return False, f"Unknown jurisdiction: {value}"
        
        return True, "Valid jurisdiction"
    
    def validate_domain(self, value):
        """Validate business domain"""
        if not isinstance(value, str):
            return False, "Domain must be a string"
        
        if not re.match(self.patterns['domain'], value):
            return False, "Invalid domain"
        
        return True, "Valid domain"
    
    def sanitize_string(self, value, max_length=1000):
        """Sanitize string input"""
        if not isinstance(value, str):
            return None, "Input must be a string"
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\']', '', value)
        
        # Truncate if too long
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized, "String sanitized"
    
    def validate_rule_definition(self, definition):
        """Validate rule definition structure"""
        if not isinstance(definition, dict):
            return False, "Rule definition must be a dictionary"
        
        rule_type = definition.get('type')
        if not rule_type:
            return False, "Rule type is required"
        
        if rule_type == 'dsl':
            if 'dsl' not in definition:
                return False, "DSL rule must have 'dsl' field"
            if not isinstance(definition['dsl'], str):
                return False, "DSL must be a string"
            if len(definition['dsl']) > 10000:
                return False, "DSL rule too long"
        
        elif rule_type == 'expression':
            if 'expression' not in definition:
                return False, "Expression rule must have 'expression' field"
            if not isinstance(definition['expression'], str):
                return False, "Expression must be a string"
        
        elif rule_type == 'decision_table':
            if 'table' not in definition:
                return False, "Decision table must have 'table' field"
            if not isinstance(definition['table'], dict):
                return False, "Table must be a dictionary"
        
        return True, "Valid rule definition"

# Use the input validator
validator = InputValidator()

# Validate various inputs
uuid_valid, uuid_msg = validator.validate_uuid("550e8400-e29b-41d4-a716-446655440000")
print(f"UUID validation: {uuid_valid}, {uuid_msg}")

datetime_valid, datetime_msg = validator.validate_datetime("2024-01-15T10:30:00Z")
print(f"Datetime validation: {datetime_valid}, {datetime_msg}")

jurisdiction_valid, jurisdiction_msg = validator.validate_jurisdiction("GDPR")
print(f"Jurisdiction validation: {jurisdiction_valid}, {jurisdiction_msg}")

# Sanitize string
sanitized, sanitize_msg = validator.sanitize_string("Hello <script>alert('xss')</script> World")
print(f"Sanitized string: {sanitized}, {sanitize_msg}")

# Validate rule definition
rule_def = {
    "type": "dsl",
    "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE"
}
rule_valid, rule_msg = validator.validate_rule_definition(rule_def)
print(f"Rule definition validation: {rule_valid}, {rule_msg}")
```

### 2. Access Control and Authorization

#### Role-Based Access Control (RBAC)
```python
from enum import Enum
from typing import List, Dict, Set
from dataclasses import dataclass

class UserRole(Enum):
    COMPLIANCE_OFFICER = "compliance_officer"
    COMPLIANCE_MANAGER = "compliance_manager"
    AUDITOR = "auditor"
    REGULATOR = "regulator"
    ADMIN = "admin"
    VIEWER = "viewer"

class Permission(Enum):
    READ_BUNDLE = "read_bundle"
    WRITE_BUNDLE = "write_bundle"
    DELETE_BUNDLE = "delete_bundle"
    EXECUTE_RULE = "execute_rule"
    MANAGE_USERS = "manage_users"
    AUDIT_ACCESS = "audit_access"
    SYSTEM_CONFIG = "system_config"

@dataclass
class User:
    id: str
    username: str
    roles: List[UserRole]
    departments: List[str]
    active: bool

class AccessControlManager:
    def __init__(self):
        # Define role-permission mapping
        self.role_permissions = {
            UserRole.COMPLIANCE_OFFICER: [
                Permission.READ_BUNDLE,
                Permission.WRITE_BUNDLE,
                Permission.EXECUTE_RULE
            ],
            UserRole.COMPLIANCE_MANAGER: [
                Permission.READ_BUNDLE,
                Permission.WRITE_BUNDLE,
                Permission.DELETE_BUNDLE,
                Permission.EXECUTE_RULE,
                Permission.AUDIT_ACCESS
            ],
            UserRole.AUDITOR: [
                Permission.READ_BUNDLE,
                Permission.AUDIT_ACCESS
            ],
            UserRole.REGULATOR: [
                Permission.READ_BUNDLE,
                Permission.AUDIT_ACCESS,
                Permission.EXECUTE_RULE
            ],
            UserRole.ADMIN: [
                Permission.READ_BUNDLE,
                Permission.WRITE_BUNDLE,
                Permission.DELETE_BUNDLE,
                Permission.EXECUTE_RULE,
                Permission.MANAGE_USERS,
                Permission.AUDIT_ACCESS,
                Permission.SYSTEM_CONFIG
            ],
            UserRole.VIEWER: [
                Permission.READ_BUNDLE
            ]
        }
        
        # Define department-based restrictions
        self.department_restrictions = {
            "finance": ["finance", "aml", "kyc"],
            "healthcare": ["healthcare", "hipaa", "clinical"],
            "legal": ["legal", "gdpr", "privacy"],
            "it": ["security", "access_control", "system"]
        }
        
        self.users = {}
        self.session_tokens = {}
    
    def add_user(self, user: User):
        """Add a user to the system"""
        self.users[user.id] = user
        return True
    
    def authenticate_user(self, username: str, password: str) -> str:
        """Authenticate user and return session token"""
        # In a real implementation, you would verify the password
        for user in self.users.values():
            if user.username == username and user.active:
                # Generate session token
                import uuid
                session_token = str(uuid.uuid4())
                self.session_tokens[session_token] = user.id
                return session_token
        
        return None
    
    def get_user_from_token(self, session_token: str) -> User:
        """Get user from session token"""
        if session_token not in self.session_tokens:
            return None
        
        user_id = self.session_tokens[session_token]
        return self.users.get(user_id)
    
    def has_permission(self, user: User, permission: Permission, resource_type: str = None, resource_id: str = None) -> bool:
        """Check if user has permission"""
        # Check if user is active
        if not user.active:
            return False
        
        # Get user's permissions based on roles
        user_permissions = set()
        for role in user.roles:
            user_permissions.update(self.role_permissions.get(role, []))
        
        # Check if user has the required permission
        if permission not in user_permissions:
            return False
        
        # Check department-based restrictions
        if resource_type and resource_id:
            if not self._check_department_access(user, resource_type, resource_id):
                return False
        
        return True
    
    def _check_department_access(self, user: User, resource_type: str, resource_id: str) -> bool:
        """Check department-based access restrictions"""
        # In a real implementation, you would look up the resource's department
        resource_department = self._get_resource_department(resource_type, resource_id)
        
        if not resource_department:
            return True  # No restriction
        
        # Check if user has access to the resource's department
        for user_dept in user.departments:
            if user_dept in self.department_restrictions:
                if resource_department in self.department_restrictions[user_dept]:
                    return True
        
        return False
    
    def _get_resource_department(self, resource_type: str, resource_id: str) -> str:
        """Get department for a resource (placeholder implementation)"""
        # In a real implementation, this would look up the resource in a database
        resource_departments = {
            "bundle": {
                "finance-bundle-001": "finance",
                "healthcare-bundle-001": "healthcare",
                "legal-bundle-001": "legal"
            }
        }
        
        return resource_departments.get(resource_type, {}).get(resource_id)
    
    def authorize_access(self, session_token: str, permission: Permission, resource_type: str = None, resource_id: str = None) -> bool:
        """Authorize access based on session token"""
        user = self.get_user_from_token(session_token)
        if not user:
            return False
        
        return self.has_permission(user, permission, resource_type, resource_id)
    
    def logout(self, session_token: str):
        """Logout user by invalidating session token"""
        if session_token in self.session_tokens:
            del self.session_tokens[session_token]
            return True
        return False

# Use the access control manager
acm = AccessControlManager()

# Add users
compliance_officer = User(
    id="user-001",
    username="cofficer",
    roles=[UserRole.COMPLIANCE_OFFICER],
    departments=["finance"],
    active=True
)

auditor = User(
    id="user-002",
    username="auditor",
    roles=[UserRole.AUDITOR],
    departments=["legal"],
    active=True
)

admin = User(
    id="user-003",
    username="admin",
    roles=[UserRole.ADMIN],
    departments=["it"],
    active=True
)

acm.add_user(compliance_officer)
acm.add_user(auditor)
acm.add_user(admin)

# Authenticate users
cofficer_token = acm.authenticate_user("cofficer", "password")
auditor_token = acm.authenticate_user("auditor", "password")
admin_token = acm.authenticate_user("admin", "password")

# Check permissions
print(f"Compliance officer can read bundle: {acm.authorize_access(cofficer_token, Permission.READ_BUNDLE)}")
print(f"Compliance officer can delete bundle: {acm.authorize_access(cofficer_token, Permission.DELETE_BUNDLE)}")
print(f"Auditor can read bundle: {acm.authorize_access(auditor_token, Permission.READ_BUNDLE)}")
print(f"Auditor can write bundle: {acm.authorize_access(auditor_token, Permission.WRITE_BUNDLE)}")
print(f"Admin can manage users: {acm.authorize_access(admin_token, Permission.MANAGE_USERS)}")

# Check department-based access
print(f"Compliance officer can access finance bundle: {acm.authorize_access(cofficer_token, Permission.READ_BUNDLE, 'bundle', 'finance-bundle-001')}")
print(f"Compliance officer can access healthcare bundle: {acm.authorize_access(cofficer_token, Permission.READ_BUNDLE, 'bundle', 'healthcare-bundle-001')}")
```

## Integration Patterns

### 1. API Integration Patterns

#### RESTful API Integration
```python
from flask import Flask, request, jsonify
from functools import wraps
import json

app = Flask(__name__)

# Mock data storage
decision_bundles = {}
users = {}

# Authentication middleware
def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authentication"}), 401
        
        token = auth_header.split(' ')[1]
        user = users.get(token)
        if not user:
            return jsonify({"error": "Invalid token"}), 401
        
        return f(user, *args, **kwargs)
    return decorated_function

# Authorization middleware
def authorize(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(user, *args, **kwargs):
            if permission not in user['permissions']:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(user, *args, **kwargs)
        return decorated_function
    return decorator

# API endpoints
@app.route('/api/v1/bundles', methods=['POST'])
@authenticate
@authorize('write_bundle')
def create_bundle(user):
    """Create a new DecisionBundle"""
    try:
        bundle_data = request.get_json()
        
        # Validate bundle data
        if not bundle_data or 'metadata' not in bundle_data:
            return jsonify({"error": "Invalid bundle data"}), 400
        
        # Generate bundle ID
        import uuid
        bundle_id = str(uuid.uuid4())
        bundle_data['metadata']['id'] = bundle_id
        
        # Store bundle
        decision_bundles[bundle_id] = bundle_data
        
        return jsonify({
            "id": bundle_id,
            "message": "DecisionBundle created successfully"
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/bundles/<bundle_id>', methods=['GET'])
@authenticate
@authorize('read_bundle')
def get_bundle(user, bundle_id):
    """Get a specific DecisionBundle"""
    if bundle_id not in decision_bundles:
        return jsonify({"error": "Bundle not found"}), 404
    
    return jsonify(decision_bundles[bundle_id])

@app.route('/api/v1/bundles/<bundle_id>', methods=['PUT'])
@authenticate
@authorize('write_bundle')
def update_bundle(user, bundle_id):
    """Update a DecisionBundle"""
    if bundle_id not in decision_bundles:
        return jsonify({"error": "Bundle not found"}), 404
    
    try:
        bundle_data = request.get_json()
        
        # Update bundle
        decision_bundles[bundle_id].update(bundle_data)
        
        return jsonify({
            "id": bundle_id,
            "message": "DecisionBundle updated successfully"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/bundles/<bundle_id>', methods=['DELETE'])
@authenticate
@authorize('delete_bundle')
def delete_bundle(user, bundle_id):
    """Delete a DecisionBundle"""
    if bundle_id not in decision_bundles:
        return jsonify({"error": "Bundle not found"}), 404
    
    del decision_bundles[bundle_id]
    
    return jsonify({
        "id": bundle_id,
        "message": "DecisionBundle deleted successfully"
    })

@app.route('/api/v1/bundles', methods=['GET'])
@authenticate
@authorize('read_bundle')
def list_bundles(user):
    """List all DecisionBundles"""
    # Support filtering
    jurisdiction = request.args.get('jurisdiction')
    domain = request.args.get('domain')
    
    filtered_bundles = []
    for bundle_id, bundle in decision_bundles.items():
        if jurisdiction and bundle.get('metadata', {}).get('jurisdiction') != jurisdiction:
            continue
        if domain and bundle.get('metadata', {}).get('domain') != domain:
            continue
        filtered_bundles.append({
            "id": bundle_id,
            "name": bundle.get('metadata', {}).get('name'),
            "jurisdiction": bundle.get('metadata', {}).get('jurisdiction'),
            "domain": bundle.get('metadata', {}).get('domain')
        })
    
    return jsonify({"bundles": filtered_bundles})

@app.route('/api/v1/bundles/<bundle_id>/execute', methods=['POST'])
@authenticate
@authorize('execute_rule')
def execute_bundle(user, bundle_id):
    """Execute rules in a DecisionBundle"""
    if bundle_id not in decision_bundles:
        return jsonify({"error": "Bundle not found"}), 404
    
    try:
        input_data = request.get_json()
        
        # Execute bundle rules (simplified)
        bundle = decision_bundles[bundle_id]
        results = []
        
        for rule in bundle.get('rules', []):
            result = execute_rule(rule, input_data)
            results.append(result)
        
        return jsonify({
            "bundle_id": bundle_id,
            "results": results,
            "execution_time": "2024-01-15T10:30:00Z"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def execute_rule(rule, input_data):
    """Execute a single rule (simplified)"""
    # This is a placeholder for actual rule execution
    return {
        "rule_id": rule.get('id'),
        "rule_name": rule.get('name'),
        "result": True,
        "reason": "Rule executed successfully"
    }

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": "2024-01-15T10:30:00Z"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### 2. Event-Driven Architecture

#### Event-Driven Compliance Processing
```python
import asyncio
import json
from datetime import datetime
from typing import Dict, List, Callable
import uuid

class ComplianceEvent:
    def __init__(self, event_type: str, data: dict, source: str):
        self.id = str(uuid.uuid4())
        self.event_type = event_type
        self.data = data
        self.source = source
        self.timestamp = datetime.now().isoformat()
        self.processed = False
        self.processing_attempts = 0

class EventBus:
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}
        self.event_history: List[ComplianceEvent] = []
        self.max_history = 10000
    
    def subscribe(self, event_type: str, handler: Callable):
        """Subscribe to an event type"""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)
    
    def unsubscribe(self, event_type: str, handler: Callable):
        """Unsubscribe from an event type"""
        if event_type in self.subscribers:
            try:
                self.subscribers[event_type].remove(handler)
            except ValueError:
                pass
    
    async def publish(self, event: ComplianceEvent):
        """Publish an event to all subscribers"""
        self.event_history.append(event)
        
        # Limit history size
        if len(self.event_history) > self.max_history:
            self.event_history = self.event_history[-self.max_history:]
        
        # Notify subscribers
        if event.event_type in self.subscribers:
            tasks = []
            for handler in self.subscribers[event.event_type]:
                task = asyncio.create_task(self._safe_handler_call(handler, event))
                tasks.append(task)
            
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _safe_handler_call(self, handler: Callable, event: ComplianceEvent):
        """Safely call event handler with error handling"""
        try:
            await handler(event)
        except Exception as e:
            print(f"Error in event handler: {e}")
            event.processing_attempts += 1

class ComplianceProcessor:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.processed_events = set()
        self.failed_events = set()
    
    async def process_event(self, event: ComplianceEvent):
        """Process a compliance event"""
        try:
            if event.id in self.processed_events:
                return
            
            # Mark as being processed
            event.processing_attempts += 1
            
            # Process based on event type
            if event.event_type == 'bundle_created':
                await self._process_bundle_created(event)
            elif event.event_type == 'rule_executed':
                await self._process_rule_executed(event)
            elif event.event_type == 'violation_detected':
                await self._process_violation_detected(event)
            elif event.event_type == 'evidence_added':
                await self._process_evidence_added(event)
            
            # Mark as processed
            event.processed = True
            self.processed_events.add(event.id)
            
        except Exception as e:
            print(f"Error processing event {event.id}: {e}")
            if event.processing_attempts >= 3:
                self.failed_events.add(event.id)
            
            # Retry processing
            if event.processing_attempts < 3:
                await asyncio.sleep(2 ** event.processing_attempts)  # Exponential backoff
                await self.process_event(event)
    
    async def _process_bundle_created(self, event: ComplianceEvent):
        """Process bundle created event"""
        bundle_data = event.data
        
        # Validate bundle
        if not self._validate_bundle(bundle_data):
            await self.event_bus.publish(ComplianceEvent(
                'bundle_validation_failed',
                {'bundle_id': bundle_data.get('metadata', {}).get('id'), 'errors': ['Validation failed']},
                'compliance_processor'
            ))
            return
        
        # Store bundle
        bundle_id = bundle_data['metadata']['id']
        print(f"Bundle {bundle_id} created and validated")
        
        # Publish validation success event
        await self.event_bus.publish(ComplianceEvent(
            'bundle_validated',
            {'bundle_id': bundle_id, 'status': 'valid'},
            'compliance_processor'
        ))
    
    async def _process_rule_executed(self, event: ComplianceEvent):
        """Process rule executed event"""
        rule_data = event.data
        
        rule_id = rule_data.get('rule_id')
        result = rule_data.get('result')
        
        print(f"Rule {rule_id} executed with result: {result}")
        
        # If rule failed, create violation event
        if result == False:
            await self.event_bus.publish(ComplianceEvent(
                'violation_detected',
                {
                    'rule_id': rule_id,
                    'violation_type': 'rule_failure',
                    'severity': rule_data.get('severity', 'medium'),
                    'timestamp': event.timestamp
                },
                'compliance_processor'
            ))
    
    async def _process_violation_detected(self, event: ComplianceEvent):
        """Process violation detected event"""
        violation_data = event.data
        
        rule_id = violation_data.get('rule_id')
        severity = violation_data.get('severity')
        
        print(f"Violation detected for rule {rule_id} with severity {severity}")
        
        # Create alert based on severity
        if severity in ['high', 'critical']:
            await self.event_bus.publish(ComplianceEvent(
                'compliance_alert',
                {
                    'alert_type': 'violation',
                    'severity': severity,
                    'rule_id': rule_id,
                    'requires_immediate_attention': True
                },
                'compliance_processor'
            ))
    
    async def _process_evidence_added(self, event: ComplianceEvent):
        """Process evidence added event"""
        evidence_data = event.data
        
        evidence_id = evidence_data.get('evidence_id')
        evidence_type = evidence_data.get('type')
        
        print(f"Evidence {evidence_id} of type {evidence_type} added")
        
        # Validate evidence integrity
        if 'hash' in evidence_data:
            is_valid = self._validate_evidence_hash(evidence_data)
            if not is_valid:
                await self.event_bus.publish(ComplianceEvent(
                    'evidence_integrity_failed',
                    {
                        'evidence_id': evidence_id,
                        'expected_hash': evidence_data['hash'],
                        'actual_hash': 'calculated_hash'
                    },
                    'compliance_processor'
                ))
    
    def _validate_bundle(self, bundle_data):
        """Validate bundle structure"""
        required_fields = ['version', 'metadata', 'rules', 'decisions']
        
        for field in required_fields:
            if field not in bundle_data:
                return False
        
        return True
    
    def _validate_evidence_hash(self, evidence_data):
        """Validate evidence hash (placeholder)"""
        # In a real implementation, you would calculate and compare hashes
        return True

# Event handlers
async def bundle_created_handler(event: ComplianceEvent):
    """Handle bundle created events"""
    print(f"Bundle created: {event.data.get('metadata', {}).get('name')}")

async def violation_detected_handler(event: ComplianceEvent):
    """Handle violation detected events"""
    violation_data = event.data
    print(f"VIOLATION ALERT: {violation_data.get('rule_id')} - {violation_data.get('severity')}")

async def compliance_alert_handler(event: ComplianceEvent):
    """Handle compliance alert events"""
    alert_data = event.data
    print(f"COMPLIANCE ALERT: {alert_data.get('alert_type')} - {alert_data.get('severity')}")

# Usage example
async def main():
    # Create event bus and processor
    event_bus = EventBus()
    processor = ComplianceProcessor(event_bus)
    
    # Subscribe to events
    event_bus.subscribe('bundle_created', bundle_created_handler)
    event_bus.subscribe('violation_detected', violation_detected_handler)
    event_bus.subscribe('compliance_alert', compliance_alert_handler)
    
    # Create and publish events
    bundle_event = ComplianceEvent(
        'bundle_created',
        {
            'metadata': {
                'id': 'bundle-001',
                'name': 'GDPR Compliance Bundle'
            },
            'rules': [],
            'decisions': []
        },
        'user_system'
    )
    
    await event_bus.publish(bundle_event)
    await processor.process_event(bundle_event)
    
    # Create rule execution event
    rule_event = ComplianceEvent(
        'rule_executed',
        {
            'rule_id': 'rule-001',
            'result': False,
            'severity': 'high'
        },
        'compliance_engine'
    )
    
    await event_bus.publish(rule_event)
    await processor.process_event(rule_event)

# Run the example
if __name__ == '__main__':
    asyncio.run(main())
```

## Monitoring and Observability

### 1. Metrics Collection
```python
import time
from collections import defaultdict, deque
from typing import Dict, List, Any
import statistics

class ComplianceMetricsCollector:
    def __init__(self, max_history=1000):
        self.metrics = {
            'rule_executions': defaultdict(int),
            'rule_execution_times': defaultdict(list),
            'bundle_validations': defaultdict(int),
            'violation_counts': defaultdict(int),
            'api_requests': defaultdict(int),
            'api_response_times': defaultdict(list),
            'system_errors': defaultdict(int),
            'user_sessions': defaultdict(int)
        }
        self.max_history = max_history
        self.alerts = []
    
    def record_rule_execution(self, rule_id: str, execution_time: float, result: bool):
        """Record rule execution metrics"""
        self.metrics['rule_executions'][rule_id] += 1
        
        # Store execution time with history limit
        times = self.metrics['rule_execution_times'][rule_id]
        times.append(execution_time)
        if len(times) > self.max_history:
            times.pop(0)
        
        # Record violation if failed
        if not result:
            self.metrics['violation_counts'][rule_id] += 1
    
    def record_bundle_validation(self, bundle_id: str, is_valid: bool):
        """Record bundle validation metrics"""
        self.metrics['bundle_validations'][bundle_id] += 1
    
    def record_api_request(self, endpoint: str, response_time: float, status_code: int):
        """Record API request metrics"""
        self.metrics['api_requests'][endpoint] += 1
        
        # Store response time with history limit
        times = self.metrics['api_response_times'][endpoint]
        times.append(response_time)
        if len(times) > self.max_history:
            times.pop(0)
        
        # Record errors
        if status_code >= 400:
            self.metrics['system_errors'][endpoint] += 1
    
    def record_user_session(self, user_id: str, session_duration: float):
        """Record user session metrics"""
        self.metrics['user_sessions'][user_id] += 1
    
    def get_rule_execution_stats(self, rule_id: str) -> Dict[str, Any]:
        """Get statistics for rule execution"""
        executions = self.metrics['rule_executions'][rule_id]
        times = self.metrics['rule_execution_times'][rule_id]
        violations = self.metrics['violation_counts'][rule_id]
        
        if not times:
            return {
                'rule_id': rule_id,
                'executions': executions,
                'violations': violations,
                'avg_execution_time': 0,
                'min_execution_time': 0,
                'max_execution_time': 0
            }
        
        return {
            'rule_id': rule_id,
            'executions': executions,
            'violations': violations,
            'violation_rate': (violations / executions * 100) if executions > 0 else 0,
            'avg_execution_time': statistics.mean(times),
            'min_execution_time': min(times),
            'max_execution_time': max(times),
            'median_execution_time': statistics.median(times),
            'p95_execution_time': statistics.quantiles(times, n=20)[18] if len(times) > 20 else max(times)
        }
    
    def get_api_stats(self, endpoint: str) -> Dict[str, Any]:
        """Get statistics for API endpoint"""
        requests = self.metrics['api_requests'][endpoint]
        times = self.metrics['api_response_times'][endpoint]
        errors = self.metrics['system_errors'][endpoint]
        
        if not times:
            return {
                'endpoint': endpoint,
                'requests': requests,
                'errors': errors,
                'avg_response_time': 0,
                'error_rate': 0
            }
        
        return {
            'endpoint': endpoint,
            'requests': requests,
            'errors': errors,
            'error_rate': (errors / requests * 100) if requests > 0 else 0,
            'avg_response_time': statistics.mean(times),
            'min_response_time': min(times),
            'max_response_time': max(times),
            'median_response_time': statistics.median(times)
        }
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health metrics"""
        total_rule_executions = sum(self.metrics['rule_executions'].values())
        total_violations = sum(self.metrics['violation_counts'].values())
        total_api_requests = sum(self.metrics['api_requests'].values())
        total_errors = sum(self.metrics['system_errors'].values())
        
        return {
            'total_rule_executions': total_rule_executions,
            'total_violations': total_violations,
            'overall_violation_rate': (total_violations / total_rule_executions * 100) if total_rule_executions > 0 else 0,
            'total_api_requests': total_api_requests,
            'total_api_errors': total_errors,
            'overall_error_rate': (total_errors / total_api_requests * 100) if total_api_requests > 0 else 0,
            'active_users': len(self.metrics['user_sessions']),
            'alert_count': len(self.alerts)
        }
    
    def check_alerts(self):
        """Check for alert conditions"""
        alerts = []
        
        # Check for high violation rates
        for rule_id, executions in self.metrics['rule_executions'].items():
            violations = self.metrics['violation_counts'][rule_id]
            if executions > 10:  # Only check rules with sufficient executions
                violation_rate = violations / executions * 100
                if violation_rate > 20:  # Alert if violation rate > 20%
                    alerts.append({
                        'type': 'high_violation_rate',
                        'rule_id': rule_id,
                        'violation_rate': violation_rate,
                        'severity': 'warning' if violation_rate < 50 else 'critical'
                    })
        
        # Check for slow API responses
        for endpoint, times in self.metrics['api_response_times'].items():
            if times:
                avg_time = statistics.mean(times)
                if avg_time > 5.0:  # Alert if average response time > 5 seconds
                    alerts.append({
                        'type': 'slow_api_response',
                        'endpoint': endpoint,
                        'avg_response_time': avg_time,
                        'severity': 'warning' if avg_time < 10.0 else 'critical'
                    })
        
        # Check for high error rates
        for endpoint, requests in self.metrics['api_requests'].items():
            if requests > 10:  # Only check endpoints with sufficient requests
                errors = self.metrics['system_errors'][endpoint]
                error_rate = errors / requests * 100
                if error_rate > 10:  # Alert if error rate > 10%
                    alerts.append({
                        'type': 'high_error_rate',
                        'endpoint': endpoint,
                        'error_rate': error_rate,
                        'severity': 'warning' if error_rate < 20 else 'critical'
                    })
        
        self.alerts = alerts
        return alerts

# Use the metrics collector
metrics = ComplianceMetricsCollector()

# Record some metrics
metrics.record_rule_execution('rule-001', 0.5, True)
metrics.record_rule_execution('rule-001', 0.7, False)
metrics.record_rule_execution('rule-001', 0.6, True)
metrics.record_rule_execution('rule-002', 1.2, True)
metrics.record_rule_execution('rule-002', 0.8, False)

metrics.record_api_request('/api/v1/bundles', 0.3, 200)
metrics.record_api_request('/api/v1/bundles', 0.5, 200)
metrics.record_api_request('/api/v1/bundles', 2.1, 500)

# Get statistics
rule_stats = metrics.get_rule_execution_stats('rule-001')
print(f"Rule 001 stats: {rule_stats}")

api_stats = metrics.get_api_stats('/api/v1/bundles')
print(f"API stats: {api_stats}")

system_health = metrics.get_system_health()
print(f"System health: {system_health}")

# Check for alerts
alerts = metrics.check_alerts()
print(f"Alerts: {alerts}")
```

## Conclusion

This advanced topics section has covered sophisticated features and patterns for building production-ready compliance solutions with GlassBox Standard v1.0. You've learned about:

- **Advanced DSL Features**: Complex pattern matching, temporal logic, and conditional actions
- **Advanced DecisionBundle Features**: Digital signatures, evidence chain management, and immutable audit logs
- **Performance Optimization**: Caching, batch processing, and memory optimization
- **Security Best Practices**: Input validation, access control, and secure implementations
- **Integration Patterns**: RESTful APIs and event-driven architectures
- **Monitoring and Observability**: Metrics collection, alerting, and system health monitoring

### Next Steps

With these advanced concepts mastered, you're ready to:

1. **Build Production Systems**: Implement enterprise-grade compliance solutions
2. **Contribute to GlassBox**: Share your improvements and patterns with the community
3. **Explore Emerging Technologies**: Integrate with AI/ML for advanced compliance analytics
4. **Mentor Others**: Help others learn advanced GlassBox Standard concepts

### Continuous Learning

The field of regulatory technology is constantly evolving. Stay current by:

- **Following Industry Trends**: Keep up with new regulations and compliance requirements
- **Experimenting with New Features**: Try new GlassBox Standard features as they're released
- **Participating in the Community**: Engage with other users and developers
- **Attending Conferences**: Learn from industry experts and practitioners

---

**You've completed the GlassBox Standard v1.0 tutorial! You now have the knowledge and skills to build sophisticated compliance solutions.**