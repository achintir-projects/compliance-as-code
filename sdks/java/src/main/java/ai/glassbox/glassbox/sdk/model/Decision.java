package com.glassbox.sdk.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * Represents a compliance decision in a DecisionBundle.
 * 
 * Decisions contain the results of compliance checks and associated evidence.
 */
public class Decision {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("rule_id")
    private String ruleId;
    
    @JsonProperty("result")
    private Boolean result;
    
    @JsonProperty("confidence")
    private Double confidence;
    
    @JsonProperty("reason")
    private String reason;
    
    @JsonProperty("evidence_ids")
    private List<String> evidenceIds;
    
    @JsonProperty("timestamp")
    private String timestamp;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    /**
     * Default constructor
     */
    public Decision() {
        this.timestamp = java.time.Instant.now().toString();
    }

    /**
     * Constructor with required fields
     */
    public Decision(String id, String ruleId, Boolean result, String reason) {
        this.id = id;
        this.ruleId = ruleId;
        this.result = result;
        this.reason = reason;
        this.confidence = 1.0;
        this.timestamp = java.time.Instant.now().toString();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRuleId() {
        return ruleId;
    }

    public void setRuleId(String ruleId) {
        this.ruleId = ruleId;
    }

    public Boolean getResult() {
        return result;
    }

    public void setResult(Boolean result) {
        this.result = result;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public List<String> getEvidenceIds() {
        return evidenceIds;
    }

    public void setEvidenceIds(List<String> evidenceIds) {
        this.evidenceIds = evidenceIds;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    /**
     * Add evidence ID to the decision
     */
    public void addEvidenceId(String evidenceId) {
        if (this.evidenceIds == null) {
            this.evidenceIds = new java.util.ArrayList<>();
        }
        this.evidenceIds.add(evidenceId);
    }

    /**
     * Validate the decision structure
     */
    public void validate(List<String> errors) {
        if (id == null || id.trim().isEmpty()) {
            errors.add("Decision must have an ID");
        }
        if (ruleId == null || ruleId.trim().isEmpty()) {
            errors.add("Decision '" + id + "' must have a rule ID");
        }
        if (result == null) {
            errors.add("Decision '" + id + "' must have a result");
        }
        if (confidence != null && (confidence < 0.0 || confidence > 1.0)) {
            errors.add("Decision '" + id + "' confidence must be between 0.0 and 1.0");
        }
        if (reason == null || reason.trim().isEmpty()) {
            errors.add("Decision '" + id + "' must have a reason");
        }
    }

    @Override
    public String toString() {
        return "Decision{" +
                "id='" + id + '\'' +
                ", ruleId='" + ruleId + '\'' +
                ", result=" + result +
                ", confidence=" + confidence +
                ", reason='" + reason + '\'' +
                ", timestamp='" + timestamp + '\'' +
                '}';
    }
}