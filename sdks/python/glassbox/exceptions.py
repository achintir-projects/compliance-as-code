"""
GlassBox SDK Exceptions

Custom exceptions for the GlassBox Python SDK.
"""

class GlassBoxException(Exception):
    """Base exception for all GlassBox SDK errors."""
    pass

class DSLParserException(GlassBoxException):
    """Exception raised when DSL parsing fails."""
    def __init__(self, message, line=None, column=None):
        self.line = line
        self.column = column
        if line is not None and column is not None:
            super().__init__(f"DSL Parser Error at line {line}, column {column}: {message}")
        else:
            super().__init__(f"DSL Parser Error: {message}")

class RuleExecutionException(GlassBoxException):
    """Exception raised when rule execution fails."""
    def __init__(self, message, rule_id=None, context=None):
        self.rule_id = rule_id
        self.context = context
        if rule_id:
            super().__init__(f"Rule Execution Error (Rule: {rule_id}): {message}")
        else:
            super().__init__(f"Rule Execution Error: {message}")

class ValidationException(GlassBoxException):
    """Exception raised when validation fails."""
    def __init__(self, message, field=None):
        self.field = field
        if field:
            super().__init__(f"Validation Error (Field: {field}): {message}")
        else:
            super().__init__(f"Validation Error: {message}")

class EvidenceException(GlassBoxException):
    """Exception raised when evidence operations fail."""
    def __init__(self, message, evidence_id=None):
        self.evidence_id = evidence_id
        if evidence_id:
            super().__init__(f"Evidence Error (ID: {evidence_id}): {message}")
        else:
            super().__init__(f"Evidence Error: {message}")

class AuditException(GlassBoxException):
    """Exception raised when audit operations fail."""
    def __init__(self, message, audit_id=None):
        self.audit_id = audit_id
        if audit_id:
            super().__init__(f"Audit Error (ID: {audit_id}): {message}")
        else:
            super().__init__(f"Audit Error: {message}")