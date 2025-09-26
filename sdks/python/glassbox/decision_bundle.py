"""
GlassBox DecisionBundle Module

This module provides classes for creating, parsing, and managing GlassBox DecisionBundles
according to the GlassBox Standard v1.0 specification.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union
from .exceptions import ValidationException


class DecisionBundle:
    """
    Represents a GlassBox DecisionBundle according to the v1.0 specification.
    
    A DecisionBundle contains compliance rules, decisions, evidence, and audit information
    for regulatory compliance scenarios.
    """
    
    def __init__(self, bundle_data: Dict[str, Any]):
        """
        Initialize a DecisionBundle from a dictionary.
        
        Args:
            bundle_data: Dictionary containing the DecisionBundle data
            
        Raises:
            ValidationException: If the bundle data is invalid
        """
        self._data = bundle_data
        self._validate()
    
    def _validate(self):
        """Validate the DecisionBundle structure."""
        required_fields = ["version", "metadata", "rules", "decisions"]
        for field in required_fields:
            if field not in self._data:
                raise ValidationException(f"Missing required field: {field}", field)
        
        # Validate version
        if self._data["version"] != "1.0":
            raise ValidationException(f"Unsupported version: {self._data['version']}", "version")
        
        # Validate metadata
        metadata = self._data["metadata"]
        required_metadata = ["id", "name", "description", "created", "jurisdiction", "domain"]
        for field in required_metadata:
            if field not in metadata:
                raise ValidationException(f"Missing required metadata field: {field}", f"metadata.{field}")
        
        # Validate domain
        valid_domains = ["finance", "health", "esg", "general"]
        if metadata["domain"] not in valid_domains:
            raise ValidationException(f"Invalid domain: {metadata['domain']}", "metadata.domain")
        
        # Validate rules
        for i, rule in enumerate(self._data["rules"]):
            self._validate_rule(rule, i)
        
        # Validate decisions
        for i, decision in enumerate(self._data["decisions"]):
            self._validate_decision(decision, i)
    
    def _validate_rule(self, rule: Dict[str, Any], index: int):
        """Validate a single rule."""
        required_fields = ["id", "name", "type", "definition"]
        for field in required_fields:
            if field not in rule:
                raise ValidationException(f"Missing required rule field: {field}", f"rules[{index}].{field}")
        
        # Validate rule type
        valid_types = ["dsl", "expression", "decision_table", "decision_tree"]
        if rule["type"] not in valid_types:
            raise ValidationException(f"Invalid rule type: {rule['type']}", f"rules[{index}].type")
    
    def _validate_decision(self, decision: Dict[str, Any], index: int):
        """Validate a single decision."""
        required_fields = ["id", "ruleId", "input", "output", "timestamp"]
        for field in required_fields:
            if field not in decision:
                raise ValidationException(f"Missing required decision field: {field}", f"decisions[{index}].{field}")
        
        # Validate output
        output = decision["output"]
        if "result" not in output:
            raise ValidationException("Missing output.result", f"decisions[{index}].output.result")
    
    @property
    def version(self) -> str:
        """Get the DecisionBundle version."""
        return self._data["version"]
    
    @property
    def metadata(self) -> Dict[str, Any]:
        """Get the DecisionBundle metadata."""
        return self._data["metadata"]
    
    @property
    def rules(self) -> List[Dict[str, Any]]:
        """Get the DecisionBundle rules."""
        return self._data["rules"]
    
    @property
    def decisions(self) -> List[Dict[str, Any]]:
        """Get the DecisionBundle decisions."""
        return self._data["decisions"]
    
    @property
    def evidence(self) -> List[Dict[str, Any]]:
        """Get the DecisionBundle evidence."""
        return self._data.get("evidence", [])
    
    @property
    def audit(self) -> Optional[Dict[str, Any]]:
        """Get the DecisionBundle audit information."""
        return self._data.get("audit")
    
    def get_rule_by_id(self, rule_id: str) -> Optional[Dict[str, Any]]:
        """Get a rule by its ID."""
        for rule in self.rules:
            if rule["id"] == rule_id:
                return rule
        return None
    
    def get_decisions_by_rule_id(self, rule_id: str) -> List[Dict[str, Any]]:
        """Get all decisions for a specific rule."""
        return [d for d in self.decisions if d["ruleId"] == rule_id]
    
    def get_evidence_by_id(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        """Get evidence by its ID."""
        for evidence in self.evidence:
            if evidence["id"] == evidence_id:
                return evidence
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the DecisionBundle to a dictionary."""
        return self._data.copy()
    
    def to_json(self, indent: int = 2) -> str:
        """Convert the DecisionBundle to a JSON string."""
        return json.dumps(self._data, indent=indent, default=str)
    
    @classmethod
    def from_file(cls, file_path: str) -> 'DecisionBundle':
        """Load a DecisionBundle from a JSON file."""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return cls(data)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'DecisionBundle':
        """Load a DecisionBundle from a JSON string."""
        data = json.loads(json_str)
        return cls(data)


class DecisionBundleBuilder:
    """
    Builder class for creating DecisionBundles programmatically.
    """
    
    def __init__(self):
        """Initialize a new DecisionBundle builder."""
        self._bundle = {
            "version": "1.0",
            "metadata": {
                "id": str(uuid.uuid4()),
                "name": "",
                "description": "",
                "created": datetime.now(timezone.utc).isoformat(),
                "jurisdiction": "",
                "domain": "general",
                "tags": []
            },
            "rules": [],
            "decisions": [],
            "evidence": [],
            "audit": {
                "created": datetime.now(timezone.utc).isoformat(),
                "modified": datetime.now(timezone.utc).isoformat(),
                "version": "1.0",
                "trail": []
            }
        }
    
    def set_name(self, name: str) -> 'DecisionBundleBuilder':
        """Set the DecisionBundle name."""
        self._bundle["metadata"]["name"] = name
        return self
    
    def set_description(self, description: str) -> 'DecisionBundleBuilder':
        """Set the DecisionBundle description."""
        self._bundle["metadata"]["description"] = description
        return self
    
    def set_jurisdiction(self, jurisdiction: str) -> 'DecisionBundleBuilder':
        """Set the DecisionBundle jurisdiction."""
        self._bundle["metadata"]["jurisdiction"] = jurisdiction
        return self
    
    def set_domain(self, domain: str) -> 'DecisionBundleBuilder':
        """Set the DecisionBundle domain."""
        valid_domains = ["finance", "health", "esg", "general"]
        if domain not in valid_domains:
            raise ValidationException(f"Invalid domain: {domain}")
        self._bundle["metadata"]["domain"] = domain
        return self
    
    def set_author(self, author: str) -> 'DecisionBundleBuilder':
        """Set the DecisionBundle author."""
        self._bundle["metadata"]["author"] = author
        return self
    
    def add_tag(self, tag: str) -> 'DecisionBundleBuilder':
        """Add a tag to the DecisionBundle."""
        if tag not in self._bundle["metadata"]["tags"]:
            self._bundle["metadata"]["tags"].append(tag)
        return self
    
    def add_rule(self, rule: Dict[str, Any]) -> 'DecisionBundleBuilder':
        """Add a rule to the DecisionBundle."""
        self._bundle["rules"].append(rule)
        self._add_audit_trail("rule_added", f"Added rule: {rule.get('id', 'unknown')}")
        return self
    
    def add_decision(self, decision: Dict[str, Any]) -> 'DecisionBundleBuilder':
        """Add a decision to the DecisionBundle."""
        self._bundle["decisions"].append(decision)
        self._add_audit_trail("decision_added", f"Added decision: {decision.get('id', 'unknown')}")
        return self
    
    def add_evidence(self, evidence: Dict[str, Any]) -> 'DecisionBundleBuilder':
        """Add evidence to the DecisionBundle."""
        self._bundle["evidence"].append(evidence)
        self._add_audit_trail("evidence_added", f"Added evidence: {evidence.get('id', 'unknown')}")
        return self
    
    def _add_audit_trail(self, action: str, details: str):
        """Add an entry to the audit trail."""
        self._bundle["audit"]["modified"] = datetime.now(timezone.utc).isoformat()
        self._bundle["audit"]["trail"].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "user": "builder",
            "details": {"reason": details}
        })
    
    def build(self) -> DecisionBundle:
        """Build and return the DecisionBundle."""
        return DecisionBundle(self._bundle.copy())
    
    def to_dict(self) -> Dict[str, Any]:
        """Get the bundle as a dictionary without validation."""
        return self._bundle.copy()