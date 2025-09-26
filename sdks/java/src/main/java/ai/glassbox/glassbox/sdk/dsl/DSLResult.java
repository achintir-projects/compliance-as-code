package com.glassbox.sdk.dsl;

/**
 * Result of DSL evaluation.
 */
public class DSLResult {
    
    private final boolean result;
    private final String reason;
    private final double confidence;
    
    private Object details;
    private long timestamp;

    /**
     * Constructor with required fields
     */
    public DSLResult(boolean result, String reason, double confidence) {
        this.result = result;
        this.reason = reason;
        this.confidence = confidence;
        this.timestamp = System.currentTimeMillis();
    }

    // Getters and Setters
    public boolean isResult() {
        return result;
    }

    public String getReason() {
        return reason;
    }

    public double getConfidence() {
        return confidence;
    }

    public Object getDetails() {
        return details;
    }

    public void setDetails(Object details) {
        this.details = details;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "DSLResult{" +
                "result=" + result +
                ", reason='" + reason + '\'' +
                ", confidence=" + confidence +
                ", timestamp=" + timestamp +
                '}';
    }
}