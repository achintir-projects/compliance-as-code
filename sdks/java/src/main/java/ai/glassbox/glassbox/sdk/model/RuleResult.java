package com.glassbox.sdk.model;

/**
 * Represents the result of executing a rule.
 */
public class RuleResult {
    
    private final String ruleId;
    private final boolean result;
    private final String reason;
    private final double confidence;
    private final long timestamp;
    
    private String executionId;
    private Object details;

    /**
     * Constructor with required fields
     */
    public RuleResult(String ruleId, boolean result, String reason, double confidence, long timestamp) {
        this.ruleId = ruleId;
        this.result = result;
        this.reason = reason;
        this.confidence = confidence;
        this.timestamp = timestamp;
    }

    // Getters
    public String getRuleId() {
        return ruleId;
    }

    public boolean isResult() {
        return result;
    }

    public String getReason() {
        return reason;
    }

    public double getConfidence() {
        return confidence;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public String getExecutionId() {
        return executionId;
    }

    public void setExecutionId(String executionId) {
        this.executionId = executionId;
    }

    public Object getDetails() {
        return details;
    }

    public void setDetails(Object details) {
        this.details = details;
    }

    @Override
    public String toString() {
        return "RuleResult{" +
                "ruleId='" + ruleId + '\'' +
                ", result=" + result +
                ", reason='" + reason + '\'' +
                ", confidence=" + confidence +
                ", timestamp=" + timestamp +
                '}';
    }
}