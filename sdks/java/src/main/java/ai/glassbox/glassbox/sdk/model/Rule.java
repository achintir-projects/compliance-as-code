package com.glassbox.sdk.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.List;
import java.util.Map;

/**
 * Represents a compliance rule in a DecisionBundle.
 * 
 * Rules define the logic for compliance checks and can be of different types:
 * DSL, expression, decision table, or decision tree.
 */
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = DSLRule.class, name = "dsl"),
    @JsonSubTypes.Type(value = ExpressionRule.class, name = "expression"),
    @JsonSubTypes.Type(value = DecisionTableRule.class, name = "decision_table"),
    @JsonSubTypes.Type(value = DecisionTreeRule.class, name = "decision_tree")
})
public abstract class Rule {
    
    @JsonProperty("id")
    protected String id;
    
    @JsonProperty("name")
    protected String name;
    
    @JsonProperty("description")
    protected String description;
    
    @JsonProperty("type")
    protected String type;
    
    @JsonProperty("priority")
    protected Integer priority = 1;
    
    @JsonProperty("enabled")
    protected Boolean enabled = true;
    
    @JsonProperty("tags")
    protected List<String> tags;
    
    @JsonProperty("metadata")
    protected Map<String, Object> metadata;

    /**
     * Default constructor
     */
    public Rule() {
        // Default constructor for Jackson
    }

    /**
     * Constructor with basic fields
     */
    public Rule(String id, String name, String description, String type) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    /**
     * Validate the rule structure
     */
    public abstract void validate(List<String> errors);

    /**
     * Execute the rule with given context
     */
    public abstract RuleResult execute(ExecutionContext context);

    @Override
    public String toString() {
        return "Rule{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", type='" + type + '\'' +
                ", priority=" + priority +
                ", enabled=" + enabled +
                '}';
    }
}