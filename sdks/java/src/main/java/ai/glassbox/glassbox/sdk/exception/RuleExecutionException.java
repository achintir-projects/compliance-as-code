package com.glassbox.sdk.exception;

/**
 * Exception thrown when rule execution fails.
 */
public class RuleExecutionException extends GlassBoxException {
    
    private final String ruleId;
    private final String ruleType;
    private final Object executionContext;

    /**
     * Constructor with message and rule ID
     */
    public RuleExecutionException(String message, String ruleId) {
        super(message, "RULE_EXECUTION_ERROR");
        this.ruleId = ruleId;
        this.ruleType = null;
        this.executionContext = null;
    }

    /**
     * Constructor with message, rule ID, and rule type
     */
    public RuleExecutionException(String message, String ruleId, String ruleType) {
        super(message, "RULE_EXECUTION_ERROR");
        this.ruleId = ruleId;
        this.ruleType = ruleType;
        this.executionContext = null;
    }

    /**
     * Constructor with message, cause, and rule ID
     */
    public RuleExecutionException(String message, Throwable cause, String ruleId) {
        super(message, cause, "RULE_EXECUTION_ERROR", null);
        this.ruleId = ruleId;
        this.ruleType = null;
        this.executionContext = null;
    }

    /**
     * Constructor with message, cause, rule ID, and rule type
     */
    public RuleExecutionException(String message, Throwable cause, String ruleId, String ruleType) {
        super(message, cause, "RULE_EXECUTION_ERROR", null);
        this.ruleId = ruleId;
        this.ruleType = ruleType;
        this.executionContext = null;
    }

    /**
     * Constructor with message, rule ID, rule type, and execution context
     */
    public RuleExecutionException(String message, String ruleId, String ruleType, Object executionContext) {
        super(message, "RULE_EXECUTION_ERROR", executionContext);
        this.ruleId = ruleId;
        this.ruleType = ruleType;
        this.executionContext = executionContext;
    }

    // Getters
    public String getRuleId() {
        return ruleId;
    }

    public String getRuleType() {
        return ruleType;
    }

    public Object getExecutionContext() {
        return executionContext;
    }

    /**
     * Get formatted error message with rule information
     */
    public String getFormattedMessage() {
        StringBuilder sb = new StringBuilder();
        sb.append("Rule execution failed");
        if (ruleId != null) {
            sb.append(" for rule '").append(ruleId).append("'");
        }
        if (ruleType != null) {
            sb.append(" (").append(ruleType).append(")");
        }
        sb.append(": ").append(getMessage());
        return sb.toString();
    }

    @Override
    public String toString() {
        return "RuleExecutionException{" +
                "errorCode='" + getErrorCode() + '\'' +
                ", message='" + getMessage() + '\'' +
                ", ruleId='" + ruleId + '\'' +
                ", ruleType='" + ruleType + '\'' +
                ", executionContext=" + executionContext +
                '}';
    }
}