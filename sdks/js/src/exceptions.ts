/**
 * GlassBox SDK Exceptions
 * 
 * Custom exceptions for the GlassBox JavaScript/TypeScript SDK.
 */

/**
 * Base exception for all GlassBox SDK errors.
 */
export class GlassBoxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GlassBoxError';
    Object.setPrototypeOf(this, GlassBoxError.prototype);
  }
}

/**
 * Exception raised when DSL parsing fails.
 */
export class DSLParserError extends GlassBoxError {
  public readonly line?: number;
  public readonly column?: number;

  constructor(message: string, line?: number, column?: number) {
    if (line !== undefined && column !== undefined) {
      super(`DSL Parser Error at line ${line}, column ${column}: ${message}`);
    } else {
      super(`DSL Parser Error: ${message}`);
    }
    this.name = 'DSLParserError';
    this.line = line;
    this.column = column;
    Object.setPrototypeOf(this, DSLParserError.prototype);
  }
}

/**
 * Exception raised when rule execution fails.
 */
export class RuleExecutionError extends GlassBoxError {
  public readonly ruleId?: string;
  public readonly context?: any;

  constructor(message: string, ruleId?: string, context?: any) {
    if (ruleId) {
      super(`Rule Execution Error (Rule: ${ruleId}): ${message}`);
    } else {
      super(`Rule Execution Error: ${message}`);
    }
    this.name = 'RuleExecutionError';
    this.ruleId = ruleId;
    this.context = context;
    Object.setPrototypeOf(this, RuleExecutionError.prototype);
  }
}

/**
 * Exception raised when validation fails.
 */
export class ValidationError extends GlassBoxError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    if (field) {
      super(`Validation Error (Field: ${field}): ${message}`);
    } else {
      super(`Validation Error: ${message}`);
    }
    this.name = 'ValidationError';
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Exception raised when evidence operations fail.
 */
export class EvidenceError extends GlassBoxError {
  public readonly evidenceId?: string;

  constructor(message: string, evidenceId?: string) {
    if (evidenceId) {
      super(`Evidence Error (ID: ${evidenceId}): ${message}`);
    } else {
      super(`Evidence Error: ${message}`);
    }
    this.name = 'EvidenceError';
    this.evidenceId = evidenceId;
    Object.setPrototypeOf(this, EvidenceError.prototype);
  }
}

/**
 * Exception raised when audit operations fail.
 */
export class AuditError extends GlassBoxError {
  public readonly auditId?: string;

  constructor(message: string, auditId?: string) {
    if (auditId) {
      super(`Audit Error (ID: ${auditId}): ${message}`);
    } else {
      super(`Audit Error: ${message}`);
    }
    this.name = 'AuditError';
    this.auditId = auditId;
    Object.setPrototypeOf(this, AuditError.prototype);
  }
}