"""
GlassBox Python SDK Examples

This script demonstrates how to use the GlassBox Python SDK for creating,
parsing, and executing compliance rules and DecisionBundles.
"""

import json
from datetime import datetime, timezone, timedelta
from sdk import (
    DecisionBundle, DecisionBundleBuilder,
    DSLParser, DSLEvaluator,
    RuleEngine, ExecutionContext,
    EvidenceManager, AuditTrail
)

def example_1_basic_decision_bundle():
    """Example 1: Create a basic DecisionBundle."""
    print("=== Example 1: Basic DecisionBundle Creation ===")
    
    # Create a DecisionBundle using the builder
    builder = DecisionBundleBuilder()
    builder.set_name("GDPR Compliance Check")
    builder.set_description("Basic GDPR compliance verification")
    builder.set_jurisdiction("GDPR")
    builder.set_domain("general")
    builder.set_author("Compliance Officer")
    builder.add_tag("privacy")
    builder.add_tag("gdpr")
    
    # Add a DSL rule
    gdpr_rule = {
        "id": "rule-gdpr-001",
        "name": "Lawful Basis for Processing",
        "description": "Verify that all data processing has a lawful basis under GDPR Article 6",
        "type": "dsl",
        "definition": {
            "dsl": "WHEN processing_data THEN MUST have_lawful_basis IN ['consent', 'contract', 'legal_obligation']",
            "parameters": {
                "processing_data": "boolean",
                "have_lawful_basis": "string"
            }
        },
        "severity": "high",
        "category": "data_protection"
    }
    builder.add_rule(gdpr_rule)
    
    # Build the DecisionBundle
    bundle = builder.build()
    
    print(f"Created DecisionBundle: {bundle.metadata['name']}")
    print(f"Bundle ID: {bundle.metadata['id']}")
    print(f"Rules count: {len(bundle.rules)}")
    print(f"JSON representation:")
    print(bundle.to_json(indent=2))
    print()


def example_2_dsl_parsing_and_evaluation():
    """Example 2: Parse and evaluate DSL rules."""
    print("=== Example 2: DSL Parsing and Evaluation ===")
    
    # Initialize parser and evaluator
    parser = DSLParser()
    evaluator = DSLEvaluator()
    
    # Example DSL rules
    dsl_rules = [
        "WHEN user.age >= 18 THEN MUST account.is_active = TRUE",
        "WHEN transaction.amount > 10000 AND transaction.country IN ['IR', 'KP'] THEN MUST FLAG transaction as_high_risk",
        "WHEN consent.given BEFORE 2024-01-01T00:00:00Z THEN MUST consent.expires AFTER 2024-12-31T23:59:59Z",
        "WHEN email MATCHES '.*@bank\\.com' THEN MUST user.is_verified = TRUE"
    ]
    
    # Test context data
    test_contexts = [
        {
            "user": {"age": 25, "is_verified": False},
            "account": {"is_active": True},
            "processing_data": True
        },
        {
            "transaction": {"amount": 15000, "country": "IR"},
            "processing_data": True
        },
        {
            "consent": {
                "given": "2023-12-01T10:00:00Z",
                "expires": "2025-01-01T00:00:00Z"
            },
            "processing_data": True
        },
        {
            "email": "customer@bank.com",
            "user": {"is_verified": False},
            "processing_data": True
        }
    ]
    
    # Parse and evaluate each rule
    for i, dsl_rule in enumerate(dsl_rules):
        print(f"\nRule {i+1}: {dsl_rule}")
        
        try:
            # Parse the DSL
            ast = parser.parse(dsl_rule)
            print(f"Parsed successfully: {ast['type']}")
            
            # Evaluate with context
            context = test_contexts[i]
            result = evaluator.evaluate(ast, context)
            
            print(f"Result: {result['result']}")
            print(f"Reason: {result['reason']}")
            
        except Exception as e:
            print(f"Error: {e}")
    
    print()


def example_3_rule_engine_execution():
    """Example 3: Execute rules using the RuleEngine."""
    print("=== Example 3: Rule Engine Execution ===")
    
    # Create a DecisionBundle with multiple rule types
    builder = DecisionBundleBuilder()
    builder.set_name("Financial Compliance Check")
    builder.set_description("Multi-type rule execution example")
    builder.set_jurisdiction("AML")
    builder.set_domain("finance")
    
    # Add DSL rule
    dsl_rule = {
        "id": "rule-aml-001",
        "name": "Large Transaction Alert",
        "description": "Alert on large transactions from high-risk countries",
        "type": "dsl",
        "definition": {
            "dsl": "WHEN transaction.amount > 10000 AND transaction.country IN ['IR', 'KP', 'SY'] THEN MUST FLAG transaction as_suspicious",
            "parameters": {
                "transaction.amount": "number",
                "transaction.country": "string"
            }
        },
        "severity": "high",
        "category": "transaction_monitoring"
    }
    builder.add_rule(dsl_rule)
    
    # Add expression rule
    expression_rule = {
        "id": "rule-aml-002",
        "name": "Customer Risk Score",
        "description": "Calculate customer risk score based on factors",
        "type": "expression",
        "definition": {
            "expression": "customer.risk_score > 75 and customer.kyc_verified == True",
            "variables": {
                "customer.risk_score": "number",
                "customer.kyc_verified": "boolean"
            }
        },
        "severity": "medium",
        "category": "risk_assessment"
    }
    builder.add_rule(expression_rule)
    
    # Add decision table rule
    decision_table_rule = {
        "id": "rule-aml-003",
        "name": "Transaction Decision Table",
        "description": "Decision table for transaction approval",
        "type": "decision_table",
        "definition": {
            "table": {
                "conditions": [
                    {"field": "transaction.amount", "operator": ">", "value": 50000},
                    {"field": "customer.risk_level", "operator": "=", "value": "high"}
                ],
                "actions": [
                    {"result": False, "reason": "Manual review required for high-risk large transactions"}
                ]
            }
        },
        "severity": "high",
        "category": "transaction_approval"
    }
    builder.add_rule(decision_table_rule)
    
    # Build the bundle
    bundle = builder.build()
    
    # Initialize rule engine
    engine = RuleEngine()
    
    # Create execution context with test data
    test_data = {
        "transaction": {
            "amount": 25000,
            "country": "IR",
            "currency": "USD"
        },
        "customer": {
            "risk_score": 85,
            "risk_level": "high",
            "kyc_verified": True,
            "name": "John Doe"
        }
    }
    
    context = ExecutionContext(test_data)
    
    # Execute the bundle
    results = engine.execute_bundle(bundle, context)
    
    print(f"Bundle: {bundle.metadata['name']}")
    print(f"Execution ID: {results['execution_id']}")
    print(f"Rules executed: {results['rules_executed']}")
    print(f"Rules passed: {results['rules_passed']}")
    print(f"Rules failed: {results['rules_failed']}")
    print(f"Overall result: {results['overall_result']}")
    
    # Print individual rule results
    for rule_result in results['rule_results']:
        print(f"\nRule: {rule_result['rule_name']}")
        print(f"Result: {rule_result['result']}")
        print(f"Reason: {rule_result['reason']}")
        if 'error' in rule_result:
            print(f"Error: {rule_result['error']}")
    
    print()


def example_4_evidence_management():
    """Example 4: Evidence management."""
    print("=== Example 4: Evidence Management ===")
    
    # Initialize evidence manager
    evidence_manager = EvidenceManager()
    
    # Create different types of evidence
    log_evidence = evidence_manager.create_evidence(
        "log",
        {
            "event": "user_login",
            "user_id": "user_123",
            "ip_address": "192.168.1.100",
            "timestamp": "2024-01-15T10:30:00Z",
            "success": True
        },
        "authentication_system"
    )
    
    document_evidence = evidence_manager.create_evidence(
        "document",
        {
            "document_type": "privacy_policy",
            "version": "2.1",
            "url": "/privacy-policy-v2.1.pdf",
            "hash": "sha256:abc123...",
            "size": 2048576
        },
        "document_management"
    )
    
    metric_evidence = evidence_manager.create_evidence(
        "metric",
        {
            "metric_name": "compliance_score",
            "value": 98.5,
            "unit": "percent",
            "timestamp": "2024-01-15T10:00:00Z"
        },
        "monitoring_system"
    )
    
    user_input_evidence = evidence_manager.create_evidence(
        "user_input",
        {
            "form_id": "consent_form_001",
            "user_id": "user_123",
            "consent_given": True,
            "consent_type": "data_processing",
            "timestamp": "2024-01-15T10:15:00Z"
        },
        "user_interface"
    )
    
    print(f"Created {len(evidence_manager.evidence_store)} evidence items")
    
    # Retrieve evidence by type
    log_evidence_list = evidence_manager.get_evidence_by_type("log")
    print(f"Log evidence count: {len(log_evidence_list)}")
    
    # Search evidence
    search_results = evidence_manager.search_evidence({
        "type": "log",
        "content.event": "user_login"
    })
    print(f"Search results for user_login events: {len(search_results)}")
    
    # Verify evidence integrity
    verification = evidence_manager.verify_evidence_integrity(log_evidence['id'])
    print(f"Log evidence integrity: {verification['valid']}")
    
    # Create evidence chain
    evidence_ids = [log_evidence['id'], user_input_evidence['id']]
    chain = evidence_manager.create_evidence_chain(evidence_ids)
    print(f"Created evidence chain with {chain['evidence_count']} items")
    print(f"Chain hash: {chain['chain_hash']}")
    
    # Get statistics
    stats = evidence_manager.get_statistics()
    print(f"Evidence statistics: {stats}")
    
    # Export evidence
    exported_json = evidence_manager.export_evidence(evidence_ids, 'json')
    print(f"Exported {len(evidence_ids)} evidence items to JSON")
    
    print()


def example_5_audit_trail():
    """Example 5: Audit trail management."""
    print("=== Example 5: Audit Trail Management ===")
    
    # Initialize audit trail
    audit_trail = AuditTrail()
    
    # Create audit entries
    entry1 = audit_trail.create_audit_entry(
        "bundle_created",
        "compliance_officer",
        {
            "bundle_name": "GDPR Compliance Check",
            "reason": "Initial compliance assessment"
        }
    )
    
    entry2 = audit_trail.create_audit_entry(
        "rule_added",
        "compliance_engine",
        {
            "rule_id": "rule-gdpr-001",
            "rule_name": "Lawful Basis for Processing"
        }
    )
    
    entry3 = audit_trail.create_audit_entry(
        "decision_made",
        "compliance_engine",
        {
            "rule_id": "rule-gdpr-001",
            "decision_id": "decision-001",
            "result": True,
            "confidence": 0.95
        }
    )
    
    print(f"Created {len(audit_trail.audit_store)} audit entries")
    
    # Retrieve audit entries by user
    user_entries = audit_trail.get_audit_entries_by_user("compliance_officer")
    print(f"Entries by compliance_officer: {len(user_entries)}")
    
    # Search audit entries
    search_results = audit_trail.search_audit_entries({
        "action": "rule_added"
    })
    print(f"Search results for rule_added actions: {len(search_results)}")
    
    # Create audit bundle
    audit_ids = [entry1['id'], entry2['id'], entry3['id']]
    bundle = audit_trail.create_audit_bundle(
        "GDPR Compliance Audit",
        "Complete audit trail for GDPR compliance assessment",
        audit_ids
    )
    print(f"Created audit bundle with {bundle['entry_count']} entries")
    print(f"Bundle checksum: {bundle['checksum']}")
    
    # Verify bundle integrity
    bundle_verification = audit_trail.verify_audit_bundle_integrity(bundle['id'])
    print(f"Bundle integrity: {bundle_verification['valid']}")
    
    # Generate audit report
    start_time = datetime.now(timezone.utc) - timedelta(days=1)
    end_time = datetime.now(timezone.utc)
    report = audit_trail.generate_audit_report(start_time, end_time)
    print(f"Generated audit report with {report['total_entries']} entries")
    
    # Get statistics
    stats = audit_trail.get_statistics()
    print(f"Audit statistics: {stats}")
    
    # Export audit trail
    exported_xml = audit_trail.export_audit_trail('xml', audit_ids=audit_ids)
    print(f"Exported {len(audit_ids)} audit entries to XML")
    
    print()


def example_6_complete_workflow():
    """Example 6: Complete compliance workflow."""
    print("=== Example 6: Complete Compliance Workflow ===")
    
    # Initialize components
    evidence_manager = EvidenceManager()
    audit_trail = AuditTrail()
    rule_engine = RuleEngine()
    
    # Create audit entry for workflow start
    workflow_start = audit_trail.create_audit_entry(
        "compliance_workflow_started",
        "system",
        {
            "workflow_type": "gdpr_assessment",
            "initiator": "compliance_officer"
        }
    )
    
    # Create evidence for the workflow
    consent_evidence = evidence_manager.create_evidence(
        "user_input",
        {
            "consent_id": "consent_001",
            "user_id": "user_123",
            "data_types": ["personal", "contact"],
            "consent_given": True,
            "timestamp": "2024-01-15T10:00:00Z"
        },
        "consent_system"
    )
    
    # Create DecisionBundle for GDPR compliance
    builder = DecisionBundleBuilder()
    builder.set_name("User Consent Verification")
    builder.set_description("Verify user consent for data processing")
    builder.set_jurisdiction("GDPR")
    builder.set_domain("general")
    
    consent_rule = {
        "id": "rule-consent-001",
        "name": "Valid Consent Check",
        "description": "Verify that user consent is valid and compliant",
        "type": "dsl",
        "definition": {
            "dsl": "WHEN consent.processing_data THEN MUST consent.given = TRUE AND consent.specific = TRUE AND consent.informed = TRUE",
            "parameters": {
                "consent.processing_data": "boolean",
                "consent.given": "boolean",
                "consent.specific": "boolean",
                "consent.informed": "boolean"
            }
        },
        "severity": "high",
        "category": "consent"
    }
    builder.add_rule(consent_rule)
    
    bundle = builder.build()
    
    # Create audit entry for bundle creation
    bundle_created = audit_trail.create_audit_entry(
        "bundle_created",
        "compliance_officer",
        {
            "bundle_id": bundle.metadata['id'],
            "bundle_name": bundle.metadata['name']
        }
    )
    
    # Prepare execution context
    context_data = {
        "consent": {
            "processing_data": True,
            "given": True,
            "specific": True,
            "informed": True,
            "timestamp": "2024-01-15T10:00:00Z"
        },
        "user": {
            "id": "user_123",
            "name": "John Doe"
        }
    }
    
    execution_context = ExecutionContext(context_data)
    
    # Execute compliance check
    results = rule_engine.execute_bundle(bundle, execution_context)
    
    # Create evidence for execution results
    execution_evidence = evidence_manager.create_evidence(
        "system_event",
        {
            "event_type": "compliance_check",
            "bundle_id": bundle.metadata['id'],
            "execution_id": results['execution_id'],
            "overall_result": results['overall_result'],
            "rules_executed": results['rules_executed'],
            "rules_passed": results['rules_passed'],
            "rules_failed": results['rules_failed']
        },
        "compliance_engine"
    )
    
    # Create audit entry for execution
    execution_audit = audit_trail.create_audit_entry(
        "bundle_executed",
        "compliance_engine",
        {
            "bundle_id": bundle.metadata['id'],
            "execution_id": results['execution_id'],
            "result": results['overall_result']
        }
    )
    
    # Create final audit bundle
    audit_ids = [workflow_start['id'], bundle_created['id'], execution_audit['id']]
    final_bundle = audit_trail.create_audit_bundle(
        "GDPR Consent Workflow",
        "Complete workflow for user consent verification",
        audit_ids
    )
    
    # Print workflow summary
    print(f"Workflow completed successfully!")
    print(f"DecisionBundle: {bundle.metadata['name']}")
    print(f"Execution result: {results['overall_result']}")
    print(f"Rules passed: {results['rules_passed']}/{results['rules_executed']}")
    print(f"Evidence items created: {len(evidence_manager.evidence_store)}")
    print(f"Audit entries created: {len(audit_trail.audit_store)}")
    print(f"Final audit bundle: {final_bundle['id']} with {final_bundle['entry_count']} entries")
    
    # Verify everything
    bundle_integrity = audit_trail.verify_audit_bundle_integrity(final_bundle['id'])
    print(f"Final bundle integrity: {bundle_integrity['valid']}")
    
    print()


def main():
    """Run all examples."""
    print("GlassBox Python SDK Examples")
    print("=" * 50)
    
    try:
        example_1_basic_decision_bundle()
        example_2_dsl_parsing_and_evaluation()
        example_3_rule_engine_execution()
        example_4_evidence_management()
        example_5_audit_trail()
        example_6_complete_workflow()
        
        print("All examples completed successfully!")
        
    except Exception as e:
        print(f"Error running examples: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()