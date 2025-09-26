package com.glassbox.sdk.model;

import java.util.HashMap;
import java.util.Map;

/**
 * Context for rule execution containing variables and execution metadata.
 */
public class ExecutionContext {
    
    private final String executionId;
    private final long timestamp;
    private final Map<String, Object> variables;
    private final Map<String, Object> metadata;
    
    private String tenantId;
    private String userId;
    private String requestId;

    /**
     * Constructor with empty context
     */
    public ExecutionContext() {
        this.executionId = java.util.UUID.randomUUID().toString();
        this.timestamp = System.currentTimeMillis();
        this.variables = new HashMap<>();
        this.metadata = new HashMap<>();
    }

    /**
     * Constructor with initial variables
     */
    public ExecutionContext(Map<String, Object> variables) {
        this();
        if (variables != null) {
            this.variables.putAll(variables);
        }
    }

    /**
     * Constructor with variables and metadata
     */
    public ExecutionContext(Map<String, Object> variables, Map<String, Object> metadata) {
        this(variables);
        if (metadata != null) {
            this.metadata.putAll(metadata);
        }
    }

    // Getters
    public String getExecutionId() {
        return executionId;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public Map<String, Object> getVariables() {
        return variables;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    /**
     * Set a variable in the context
     */
    public void setVariable(String name, Object value) {
        variables.put(name, value);
    }

    /**
     * Get a variable from the context
     */
    public Object getVariable(String name) {
        return variables.get(name);
    }

    /**
     * Get a variable with default value
     */
    public Object getVariable(String name, Object defaultValue) {
        return variables.getOrDefault(name, defaultValue);
    }

    /**
     * Check if a variable exists
     */
    public boolean hasVariable(String name) {
        return variables.containsKey(name);
    }

    /**
     * Remove a variable from the context
     */
    public Object removeVariable(String name) {
        return variables.remove(name);
    }

    /**
     * Set metadata
     */
    public void setMetadata(String key, Object value) {
        metadata.put(key, value);
    }

    /**
     * Get metadata
     */
    public Object getMetadata(String key) {
        return metadata.get(key);
    }

    /**
     * Get metadata with default value
     */
    public Object getMetadata(String key, Object defaultValue) {
        return metadata.getOrDefault(key, defaultValue);
    }

    /**
     * Create a copy of this context
     */
    public ExecutionContext copy() {
        ExecutionContext copy = new ExecutionContext();
        copy.variables.putAll(this.variables);
        copy.metadata.putAll(this.metadata);
        copy.tenantId = this.tenantId;
        copy.userId = this.userId;
        copy.requestId = this.requestId;
        return copy;
    }

    @Override
    public String toString() {
        return "ExecutionContext{" +
                "executionId='" + executionId + '\'' +
                ", timestamp=" + timestamp +
                ", variables=" + variables.size() +
                ", tenantId='" + tenantId + '\'' +
                ", userId='" + userId + '\'' +
                ", requestId='" + requestId + '\'' +
                '}';
    }
}