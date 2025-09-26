"""
Basic tests for the GlassBox Python SDK
"""

import pytest
import json
from datetime import datetime, timezone
from sdk import (
    DecisionBundle, DecisionBundleBuilder,
    DSLParser, DSLEvaluator,
    RuleEngine, ExecutionContext,
    EvidenceManager, AuditTrail
)
from sdk.exceptions import (
    GlassBoxException, DSLParserException,
    RuleExecutionException, ValidationException
)


class TestDecisionBundle:
    """Test DecisionBundle functionality."""
    
    def test_decision_bundle_creation(self):
        """Test creating a DecisionBundle from dictionary."""
        bundle_data = {
            "version": "1.0",
            "metadata": {
                "id": "test-bundle-id",
                "name": "Test Bundle",
                "description": "Test bundle for unit testing",
                "created": datetime.now(timezone.utc).isoformat(),
                "jurisdiction": "TEST",
                "domain": "general"
            },
            "rules": [],
            "decisions": []
        }
        
        bundle = DecisionBundle(bundle_data)
        
        assert bundle.version == "1.0"
        assert bundle.metadata["name"] == "Test Bundle"
        assert len(bundle.rules) == 0
        assert len(bundle.decisions) == 0
    
    def test_decision_bundle_validation(self):
        """Test DecisionBundle validation."""
        # Missing required fields
        with pytest.raises(ValidationException):
            DecisionBundle({})
        
        # Invalid version
        with pytest.raises(ValidationException):
            DecisionBundle({
                "version": "2.0",
                "metadata": {
                    "id": "test",
                    "name": "test",
                    "description": "test",
                    "created": datetime.now().isoformat(),
                    "jurisdiction": "test",
                    "domain": "general"
                },
                "rules": [],
                "decisions": []
            })
    
    def test_decision_bundle_builder(self):
        """Test DecisionBundleBuilder."""
        builder = DecisionBundleBuilder()
        builder.set_name("Test Bundle")
        builder.set_description("Test description")
        builder.set_jurisdiction("GDPR")
        builder.set_domain("general")
        
        bundle = builder.build()
        
        assert bundle.metadata["name"] == "Test Bundle"
        assert bundle.metadata["jurisdiction"] == "GDPR"
        assert bundle.metadata["domain"] == "general"
        assert bundle.version == "1.0"
    
    def test_decision_bundle_to_json(self):
        """Test DecisionBundle JSON serialization."""
        builder = DecisionBundleBuilder()
        builder.set_name("Test Bundle")
        bundle = builder.build()
        
        json_str = bundle.to_json()
        assert "Test Bundle" in json_str
        assert "1.0" in json_str
        
        # Test deserialization
        parsed_bundle = DecisionBundle.from_json(json_str)
        assert parsed_bundle.metadata["name"] == "Test Bundle"


class TestDSLParser:
    """Test DSL parser functionality."""
    
    def test_dsl_parser_initialization(self):
        """Test DSL parser initialization."""
        parser = DSLParser()
        assert parser is not None
        assert len(parser.KEYWORDS) > 0
        assert len(parser.OPERATORS) > 0
    
    def test_simple_dsl_parsing(self):
        """Test parsing simple DSL rules."""
        parser = DSLParser()
        
        dsl_text = "WHEN user.age >= 18 THEN MUST account.is_active = TRUE"
        ast = parser.parse(dsl_text)
        
        assert ast["type"] == "rule"
        assert "condition" in ast
        assert "consequence" in ast
    
    def test_complex_dsl_parsing(self):
        """Test parsing complex DSL rules."""
        parser = DSLParser()
        
        dsl_text = "WHEN transaction.amount > 10000 AND transaction.country IN ['IR', 'KP'] THEN MUST FLAG transaction as_high_risk"
        ast = parser.parse(dsl_text)
        
        assert ast["type"] == "rule"
        assert ast["condition"]["type"] == "compound_condition"
        assert ast["action"]["type"] == "action"
    
    def test_dsl_parser_errors(self):
        """Test DSL parser error handling."""
        parser = DSLParser()
        
        # Empty DSL
        with pytest.raises(DSLParserException):
            parser.parse("")
        
        # Invalid syntax
        with pytest.raises(DSLParserException):
            parser.parse("INVALID SYNTAX")
    
    def test_dsl_evaluator(self):
        """Test DSL evaluator."""
        parser = DSLParser()
        evaluator = DSLEvaluator()
        
        dsl_text = "WHEN user.age >= 18 THEN MUST account.is_active = TRUE"
        ast = parser.parse(dsl_text)
        
        context = {
            "user": {"age": 25},
            "account": {"is_active": True}
        }
        
        result = evaluator.evaluate(ast, context)
        assert result["result"] is True


class TestRuleEngine:
    """Test rule engine functionality."""
    
    def test_rule_engine_initialization(self):
        """Test rule engine initialization."""
        engine = RuleEngine()
        assert engine is not None
        assert engine.dsl_parser is not None
        assert engine.dsl_evaluator is not None
    
    def test_execution_context(self):
        """Test execution context."""
        context = ExecutionContext({"test": "value"})
        
        assert context.data["test"] == "value"
        assert context.execution_id is not None
        assert context.timestamp is not None
        assert len(context.results) == 0
        assert len(context.errors) == 0
    
    def test_dsl_rule_execution(self):
        """Test executing DSL rules."""
        engine = RuleEngine()
        
        # Create a simple bundle with DSL rule
        builder = DecisionBundleBuilder()
        builder.set_name("Test DSL Bundle")
        
        rule = {
            "id": "rule-dsl-001",
            "name": "Test DSL Rule",
            "description": "Test DSL rule execution",
            "type": "dsl",
            "definition": {
                "dsl": "WHEN user.age >= 18 THEN MUST account.is_active = TRUE",
                "parameters": {
                    "user.age": "number",
                    "account.is_active": "boolean"
                }
            }
        }
        builder.add_rule(rule)
        
        bundle = builder.build()
        
        # Execute with valid context
        context = ExecutionContext({
            "user": {"age": 25},
            "account": {"is_active": True}
        })
        
        results = engine.execute_bundle(bundle, context)
        
        assert results["rules_executed"] == 1
        assert results["rules_passed"] == 1
        assert results["rules_failed"] == 0
        assert results["overall_result"] is True
    
    def test_expression_rule_execution(self):
        """Test executing expression rules."""
        engine = RuleEngine()
        
        # Create a bundle with expression rule
        builder = DecisionBundleBuilder()
        builder.set_name("Test Expression Bundle")
        
        rule = {
            "id": "rule-expr-001",
            "name": "Test Expression Rule",
            "description": "Test expression rule execution",
            "type": "expression",
            "definition": {
                "expression": "user.age >= 18 and account.is_active == True",
                "variables": {
                    "user.age": "number",
                    "account.is_active": "boolean"
                }
            }
        }
        builder.add_rule(rule)
        
        bundle = builder.build()
        
        # Execute with context
        context = ExecutionContext({
            "user": {"age": 25},
            "account": {"is_active": True}
        })
        
        results = engine.execute_bundle(bundle, context)
        
        assert results["rules_executed"] == 1
        assert results["rules_passed"] == 1
        assert results["overall_result"] is True


class TestEvidenceManager:
    """Test evidence manager functionality."""
    
    def test_evidence_manager_initialization(self):
        """Test evidence manager initialization."""
        manager = EvidenceManager()
        assert manager is not None
        assert len(manager.evidence_store) == 0
    
    def test_create_evidence(self):
        """Test creating evidence."""
        manager = EvidenceManager()
        
        evidence = manager.create_evidence(
            "log",
            {"event": "test", "user": "test_user"},
            "test_system"
        )
        
        assert evidence["type"] == "log"
        assert evidence["content"]["event"] == "test"
        assert evidence["source"] == "test_system"
        assert evidence["hash"] is not None
        assert evidence["id"] in manager.evidence_store
    
    def test_get_evidence(self):
        """Test retrieving evidence."""
        manager = EvidenceManager()
        
        evidence = manager.create_evidence(
            "log",
            {"event": "test"},
            "test_system"
        )
        
        retrieved = manager.get_evidence(evidence["id"])
        assert retrieved is not None
        assert retrieved["id"] == evidence["id"]
    
    def test_evidence_integrity_verification(self):
        """Test evidence integrity verification."""
        manager = EvidenceManager()
        
        evidence = manager.create_evidence(
            "log",
            {"event": "test"},
            "test_system"
        )
        
        verification = manager.verify_evidence_integrity(evidence["id"])
        assert verification["valid"] is True
    
    def test_evidence_search(self):
        """Test evidence search functionality."""
        manager = EvidenceManager()
        
        # Create multiple evidence items
        manager.create_evidence("log", {"event": "login"}, "auth_system")
        manager.create_evidence("log", {"event": "logout"}, "auth_system")
        manager.create_evidence("document", {"type": "policy"}, "doc_system")
        
        # Search by type
        log_evidence = manager.get_evidence_by_type("log")
        assert len(log_evidence) == 2
        
        # Search by source
        auth_evidence = manager.get_evidence_by_source("auth_system")
        assert len(auth_evidence) == 2
        
        # Search with query
        results = manager.search_evidence({"type": "log", "content.event": "login"})
        assert len(results) == 1


class TestAuditTrail:
    """Test audit trail functionality."""
    
    def test_audit_trail_initialization(self):
        """Test audit trail initialization."""
        audit = AuditTrail()
        assert audit is not None
        assert len(audit.audit_store) == 0
    
    def test_create_audit_entry(self):
        """Test creating audit entries."""
        audit = AuditTrail()
        
        entry = audit.create_audit_entry(
            "test_action",
            "test_user",
            {"detail": "test detail"}
        )
        
        assert entry["action"] == "test_action"
        assert entry["user"] == "test_user"
        assert entry["details"]["detail"] == "test detail"
        assert entry["hash"] is not None
        assert entry["id"] in audit.audit_store
    
    def test_get_audit_entries(self):
        """Test retrieving audit entries."""
        audit = AuditTrail()
        
        entry = audit.create_audit_entry(
            "test_action",
            "test_user",
            {"detail": "test"}
        )
        
        # Get by ID
        retrieved = audit.get_audit_entry(entry["id"])
        assert retrieved is not None
        assert retrieved["id"] == entry["id"]
        
        # Get by user
        user_entries = audit.get_audit_entries_by_user("test_user")
        assert len(user_entries) == 1
        
        # Get by action
        action_entries = audit.get_audit_entries_by_action("test_action")
        assert len(action_entries) == 1
    
    def test_audit_bundle_creation(self):
        """Test creating audit bundles."""
        audit = AuditTrail()
        
        # Create multiple entries
        entry1 = audit.create_audit_entry("action1", "user1", {"detail": "test1"})
        entry2 = audit.create_audit_entry("action2", "user2", {"detail": "test2"})
        
        # Create bundle
        bundle = audit.create_audit_bundle(
            "Test Bundle",
            "Test audit bundle",
            [entry1["id"], entry2["id"]]
        )
        
        assert bundle["name"] == "Test Bundle"
        assert bundle["entry_count"] == 2
        assert bundle["bundle_hash"] is not None
        assert bundle["id"] in audit.bundles
    
    def test_audit_integrity_verification(self):
        """Test audit integrity verification."""
        audit = AuditTrail()
        
        entry = audit.create_audit_entry(
            "test_action",
            "test_user",
            {"detail": "test"}
        )
        
        verification = audit.verify_audit_entry_integrity(entry["id"])
        assert verification["valid"] is True


class TestIntegration:
    """Integration tests for the complete SDK."""
    
    def test_complete_workflow(self):
        """Test a complete compliance workflow."""
        # Initialize components
        evidence_manager = EvidenceManager()
        audit_trail = AuditTrail()
        rule_engine = RuleEngine()
        
        # Create audit entry
        audit_entry = audit_trail.create_audit_entry(
            "workflow_started",
            "system",
            {"workflow": "test_compliance"}
        )
        
        # Create evidence
        evidence = evidence_manager.create_evidence(
            "user_input",
            {"consent": True, "user_id": "test_user"},
            "test_system"
        )
        
        # Create DecisionBundle
        builder = DecisionBundleBuilder()
        builder.set_name("Test Compliance Workflow")
        
        rule = {
            "id": "rule-test-001",
            "name": "Consent Verification",
            "description": "Verify user consent",
            "type": "dsl",
            "definition": {
                "dsl": "WHEN user.consent_given THEN MUST user.consent_valid = TRUE",
                "parameters": {
                    "user.consent_given": "boolean",
                    "user.consent_valid": "boolean"
                }
            }
        }
        builder.add_rule(rule)
        
        bundle = builder.build()
        
        # Execute workflow
        context = ExecutionContext({
            "user": {
                "consent_given": True,
                "consent_valid": True
            }
        })
        
        results = rule_engine.execute_bundle(bundle, context)
        
        # Verify results
        assert results["overall_result"] is True
        assert results["rules_passed"] == 1
        
        # Create final audit bundle
        final_bundle = audit_trail.create_audit_bundle(
            "Test Workflow",
            "Complete test workflow",
            [audit_entry["id"]]
        )
        
        # Verify integrity
        bundle_verification = audit_trail.verify_audit_bundle_integrity(final_bundle["id"])
        assert bundle_verification["valid"] is True
        
        # Verify evidence integrity
        evidence_verification = evidence_manager.verify_evidence_integrity(evidence["id"])
        assert evidence_verification["valid"] is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])