"""
GlassBox Python SDK v1.0

A comprehensive Python SDK for working with GlassBox DecisionBundles and Compliance DSL.
This SDK provides tools for creating, parsing, validating, and executing compliance rules
and decisions according to the GlassBox Standard v1.0.

Author: GlassBox Compliance Team
Version: 1.0.0
License: MIT
"""

from .decision_bundle import DecisionBundle, DecisionBundleBuilder
from .dsl_parser import DSLParser, DSLEvaluator
from .rule_engine import RuleEngine, ExecutionContext
from .evidence_manager import EvidenceManager
from .audit_trail import AuditTrail
from .exceptions import GlassBoxException, DSLParserException, RuleExecutionException

__version__ = "1.0.0"
__author__ = "GlassBox Compliance Team"

__all__ = [
    "DecisionBundle",
    "DecisionBundleBuilder", 
    "DSLParser",
    "DSLEvaluator",
    "RuleEngine",
    "ExecutionContext",
    "EvidenceManager",
    "AuditTrail",
    "GlassBoxException",
    "DSLParserException", 
    "RuleExecutionException"
]