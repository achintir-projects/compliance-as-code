"""
GlassBox SDK Command Line Interface

This module provides command-line tools for working with GlassBox DecisionBundles
and Compliance DSL rules.
"""

import argparse
import json
import sys
from typing import Dict, Any
from sdk import (
    DecisionBundle, DecisionBundleBuilder,
    DSLParser, DSLEvaluator,
    RuleEngine, ExecutionContext,
    EvidenceManager, AuditTrail
)
from sdk.exceptions import GlassBoxException


def validate_bundle(args):
    """Validate a DecisionBundle file."""
    try:
        bundle = DecisionBundle.from_file(args.file)
        print(f"✓ DecisionBundle is valid")
        print(f"  Name: {bundle.metadata['name']}")
        print(f"  Version: {bundle.version}")
        print(f"  Rules: {len(bundle.rules)}")
        print(f"  Decisions: {len(bundle.decisions)}")
        print(f"  Evidence: {len(bundle.evidence)}")
        
        if args.verbose:
            print(f"\nMetadata:")
            for key, value in bundle.metadata.items():
                print(f"  {key}: {value}")
            
            print(f"\nRules:")
            for rule in bundle.rules:
                print(f"  - {rule['id']}: {rule['name']} ({rule['type']})")
    
    except Exception as e:
        print(f"✗ Validation failed: {e}")
        sys.exit(1)


def execute_bundle(args):
    """Execute a DecisionBundle with context data."""
    try:
        # Load bundle
        bundle = DecisionBundle.from_file(args.bundle)
        
        # Load context data
        if args.context:
            with open(args.context, 'r') as f:
                context_data = json.load(f)
        else:
            context_data = {}
        
        # Create execution context
        context = ExecutionContext(context_data)
        
        # Execute bundle
        engine = RuleEngine()
        results = engine.execute_bundle(bundle, context)
        
        print(f"Execution Results:")
        print(f"  Bundle: {bundle.metadata['name']}")
        print(f"  Execution ID: {results['execution_id']}")
        print(f"  Overall Result: {'✓ PASS' if results['overall_result'] else '✗ FAIL'}")
        print(f"  Rules Executed: {results['rules_executed']}")
        print(f"  Rules Passed: {results['rules_passed']}")
        print(f"  Rules Failed: {results['rules_failed']}")
        
        if args.verbose:
            print(f"\nRule Details:")
            for rule_result in results['rule_results']:
                status = "✓ PASS" if rule_result['result'] else "✗ FAIL"
                print(f"  {status} {rule_result['rule_name']}: {rule_result['reason']}")
                if 'error' in rule_result:
                    print(f"    Error: {rule_result['error']}")
        
        # Save results if requested
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            print(f"\nResults saved to: {args.output}")
    
    except Exception as e:
        print(f"✗ Execution failed: {e}")
        sys.exit(1)


def parse_dsl(args):
    """Parse and optionally evaluate DSL rules."""
    try:
        parser = DSLParser()
        evaluator = DSLEvaluator()
        
        # Read DSL from file or stdin
        if args.file:
            with open(args.file, 'r') as f:
                dsl_text = f.read()
        else:
            dsl_text = sys.stdin.read()
        
        # Parse DSL
        ast = parser.parse(dsl_text)
        print(f"✓ DSL parsed successfully")
        print(f"  Rule type: {ast['type']}")
        
        if args.verbose:
            print(f"  AST: {json.dumps(ast, indent=2)}")
        
        # Evaluate if context provided
        if args.context:
            with open(args.context, 'r') as f:
                context_data = json.load(f)
            
            result = evaluator.evaluate(ast, context_data)
            print(f"\nEvaluation Result:")
            print(f"  Result: {'✓ PASS' if result['result'] else '✗ FAIL'}")
            print(f"  Reason: {result['reason']}")
            
            if args.verbose:
                print(f"  Details: {json.dumps(result['details'], indent=2, default=str)}")
        
        # Save AST if requested
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(ast, f, indent=2, default=str)
            print(f"\nAST saved to: {args.output}")
    
    except Exception as e:
        print(f"✗ DSL parsing failed: {e}")
        sys.exit(1)


def create_bundle(args):
    """Create a new DecisionBundle interactively."""
    try:
        builder = DecisionBundleBuilder()
        
        # Get basic information
        name = input("Bundle name: ")
        description = input("Bundle description: ")
        jurisdiction = input("Jurisdiction (e.g., GDPR, CCPA): ")
        domain = input("Domain (finance/health/esg/general): ")
        author = input("Author: ")
        
        builder.set_name(name)
        builder.set_description(description)
        builder.set_jurisdiction(jurisdiction)
        builder.set_domain(domain)
        builder.set_author(author)
        
        # Add tags
        tags_input = input("Tags (comma-separated): ")
        if tags_input:
            tags = [tag.strip() for tag in tags_input.split(',')]
            for tag in tags:
                builder.add_tag(tag)
        
        # Add rules
        print("\nAdd rules (leave empty to finish):")
        while True:
            rule_id = input("Rule ID: ")
            if not rule_id:
                break
            
            rule_name = input("Rule name: ")
            rule_description = input("Rule description: ")
            rule_type = input("Rule type (dsl/expression/decision_table/decision_tree): ")
            
            rule = {
                "id": rule_id,
                "name": rule_name,
                "description": rule_description,
                "type": rule_type,
                "definition": {}
            }
            
            if rule_type == "dsl":
                dsl_text = input("DSL text: ")
                rule["definition"]["dsl"] = dsl_text
            elif rule_type == "expression":
                expression = input("Expression: ")
                rule["definition"]["expression"] = expression
            elif rule_type == "decision_table":
                print("Decision table (simplified - you can edit the JSON later)")
                rule["definition"]["table"] = {
                    "conditions": [],
                    "actions": []
                }
            
            builder.add_rule(rule)
            print(f"Added rule: {rule_name}")
        
        # Build and save
        bundle = builder.build()
        
        output_file = args.output or f"{name.lower().replace(' ', '_')}_bundle.json"
        with open(output_file, 'w') as f:
            f.write(bundle.to_json())
        
        print(f"\n✓ DecisionBundle created: {output_file}")
        print(f"  Bundle ID: {bundle.metadata['id']}")
        print(f"  Rules: {len(bundle.rules)}")
    
    except KeyboardInterrupt:
        print("\nOperation cancelled")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Bundle creation failed: {e}")
        sys.exit(1)


def list_bundles(args):
    """List DecisionBundles in a directory."""
    import os
    from pathlib import Path
    
    try:
        directory = Path(args.directory)
        bundle_files = list(directory.glob("*_bundle.json")) + list(directory.glob("*bundle*.json"))
        
        if not bundle_files:
            print("No DecisionBundle files found")
            return
        
        print(f"Found {len(bundle_files)} DecisionBundle(s):")
        print("-" * 80)
        
        for bundle_file in bundle_files:
            try:
                bundle = DecisionBundle.from_file(str(bundle_file))
                print(f"File: {bundle_file.name}")
                print(f"  Name: {bundle.metadata['name']}")
                print(f"  Jurisdiction: {bundle.metadata['jurisdiction']}")
                print(f"  Domain: {bundle.metadata['domain']}")
                print(f"  Rules: {len(bundle.rules)}")
                print(f"  Created: {bundle.metadata['created']}")
                print()
            
            except Exception as e:
                print(f"File: {bundle_file.name}")
                print(f"  Error: {e}")
                print()
    
    except Exception as e:
        print(f"✗ Failed to list bundles: {e}")
        sys.exit(1)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="GlassBox SDK Command Line Interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  glassbox-validate bundle.json                    # Validate a DecisionBundle
  glassbox-execute bundle.json -c context.json     # Execute with context
  glassbox-parse rule.dsl                          # Parse DSL rule
  glassbox-create-bundle -o my_bundle.json         # Create new bundle
  glassbox-list-bundles ./bundles/                 # List bundles in directory
        """
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Validate a DecisionBundle")
    validate_parser.add_argument("file", help="DecisionBundle JSON file")
    validate_parser.set_defaults(func=validate_bundle)
    
    # Execute command
    execute_parser = subparsers.add_parser("execute", help="Execute a DecisionBundle")
    execute_parser.add_argument("bundle", help="DecisionBundle JSON file")
    execute_parser.add_argument("-c", "--context", help="Context data JSON file")
    execute_parser.add_argument("-o", "--output", help="Output results file")
    execute_parser.set_defaults(func=execute_bundle)
    
    # Parse DSL command
    parse_parser = subparsers.add_parser("parse", help="Parse DSL rules")
    parse_parser.add_argument("file", nargs="?", help="DSL file (stdin if not provided)")
    parse_parser.add_argument("-c", "--context", help="Context data JSON file")
    parse_parser.add_argument("-o", "--output", help="Output AST file")
    parse_parser.set_defaults(func=parse_dsl)
    
    # Create bundle command
    create_parser = subparsers.add_parser("create-bundle", help="Create a new DecisionBundle")
    create_parser.add_argument("-o", "--output", help="Output file name")
    create_parser.set_defaults(func=create_bundle)
    
    # List bundles command
    list_parser = subparsers.add_parser("list-bundles", help="List DecisionBundles in directory")
    list_parser.add_argument("directory", nargs="?", default=".", help="Directory to search")
    list_parser.set_defaults(func=list_bundles)
    
    # Parse arguments
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Execute command
    args.func(args)


if __name__ == "__main__":
    main()