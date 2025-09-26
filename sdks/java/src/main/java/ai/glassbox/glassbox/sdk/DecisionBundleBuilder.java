package com.glassbox.sdk;

import com.glassbox.sdk.model.DecisionBundle;
import com.glassbox.sdk.model.Decision;
import com.glassbox.sdk.model.Evidence;
import com.glassbox.sdk.model.Rule;
import com.glassbox.sdk.model.DSLRule;
import com.glassbox.sdk.model.ExpressionRule;
import com.glassbox.sdk.model.DecisionTableRule;
import com.glassbox.sdk.model.DecisionTreeRule;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Builder class for creating DecisionBundles with fluent API.
 */
public class DecisionBundleBuilder {
    
    private String name;
    private String description;
    private String jurisdiction;
    private String domain;
    private String createdBy;
    private List<String> tags = new ArrayList<>();
    private Map<String, Object> additionalProperties;
    
    private final List<Rule> rules = new ArrayList<>();
    private final List<Decision> decisions = new ArrayList<>();
    private final List<Evidence> evidence = new ArrayList<>();

    /**
     * Set the bundle name
     */
    public DecisionBundleBuilder setName(String name) {
        this.name = name;
        return this;
    }

    /**
     * Set the bundle description
     */
    public DecisionBundleBuilder setDescription(String description) {
        this.description = description;
        return this;
    }

    /**
     * Set the bundle jurisdiction
     */
    public DecisionBundleBuilder setJurisdiction(String jurisdiction) {
        this.jurisdiction = jurisdiction;
        return this;
    }

    /**
     * Set the bundle domain
     */
    public DecisionBundleBuilder setDomain(String domain) {
        this.domain = domain;
        return this;
    }

    /**
     * Set the bundle creator
     */
    public DecisionBundleBuilder setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
        return this;
    }

    /**
     * Add a tag to the bundle
     */
    public DecisionBundleBuilder addTag(String tag) {
        if (tag != null && !tag.trim().isEmpty()) {
            this.tags.add(tag);
        }
        return this;
    }

    /**
     * Add multiple tags to the bundle
     */
    public DecisionBundleBuilder addTags(List<String> tags) {
        if (tags != null) {
            for (String tag : tags) {
                addTag(tag);
            }
        }
        return this;
    }

    /**
     * Set additional properties
     */
    public DecisionBundleBuilder setAdditionalProperties(Map<String, Object> properties) {
        this.additionalProperties = properties;
        return this;
    }

    /**
     * Add a rule to the bundle
     */
    public DecisionBundleBuilder addRule(Rule rule) {
        if (rule != null) {
            this.rules.add(rule);
        }
        return this;
    }

    /**
     * Add a DSL rule
     */
    public DecisionBundleBuilder addDSLRule(String id, String name, String description, String dslText) {
        DSLRule rule = new DSLRule(id, name, description, dslText);
        return addRule(rule);
    }

    /**
     * Add an expression rule
     */
    public DecisionBundleBuilder addExpressionRule(String id, String name, String description, String expression) {
        ExpressionRule rule = new ExpressionRule(id, name, description, expression);
        return addRule(rule);
    }

    /**
     * Add a decision table rule
     */
    public DecisionBundleBuilder addDecisionTableRule(String id, String name, String description) {
        DecisionTableRule rule = new DecisionTableRule(id, name, description);
        return addRule(rule);
    }

    /**
     * Add a decision tree rule
     */
    public DecisionBundleBuilder addDecisionTreeRule(String id, String name, String description) {
        DecisionTreeRule rule = new DecisionTreeRule(id, name, description);
        return addRule(rule);
    }

    /**
     * Add multiple rules
     */
    public DecisionBundleBuilder addRules(List<Rule> rules) {
        if (rules != null) {
            this.rules.addAll(rules);
        }
        return this;
    }

    /**
     * Add a decision to the bundle
     */
    public DecisionBundleBuilder addDecision(Decision decision) {
        if (decision != null) {
            this.decisions.add(decision);
        }
        return this;
    }

    /**
     * Add multiple decisions
     */
    public DecisionBundleBuilder addDecisions(List<Decision> decisions) {
        if (decisions != null) {
            this.decisions.addAll(decisions);
        }
        return this;
    }

    /**
     * Add evidence to the bundle
     */
    public DecisionBundleBuilder addEvidence(Evidence evidence) {
        if (evidence != null) {
            this.evidence.add(evidence);
        }
        return this;
    }

    /**
     * Add multiple evidence items
     */
    public DecisionBundleBuilder addEvidence(List<Evidence> evidence) {
        if (evidence != null) {
            this.evidence.addAll(evidence);
        }
        return this;
    }

    /**
     * Build the DecisionBundle
     */
    public DecisionBundle build() {
        // Validate required fields
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Bundle name is required");
        }
        if (jurisdiction == null || jurisdiction.trim().isEmpty()) {
            throw new IllegalArgumentException("Bundle jurisdiction is required");
        }
        if (domain == null || domain.trim().isEmpty()) {
            throw new IllegalArgumentException("Bundle domain is required");
        }

        // Create the bundle
        DecisionBundle bundle = new DecisionBundle(name, description, jurisdiction, domain);
        
        // Set optional metadata
        if (createdBy != null) {
            bundle.getMetadata().setCreatedBy(createdBy);
        }
        if (!tags.isEmpty()) {
            bundle.getMetadata().setTags(tags);
        }
        if (additionalProperties != null) {
            bundle.getMetadata().setAdditionalProperties(additionalProperties);
        }

        // Add components
        bundle.getRules().addAll(rules);
        bundle.getDecisions().addAll(decisions);
        bundle.getEvidence().addAll(evidence);

        // Validate the bundle
        try {
            bundle.validate();
        } catch (Exception e) {
            throw new RuntimeException("Failed to validate DecisionBundle: " + e.getMessage(), e);
        }

        return bundle;
    }

    /**
     * Create a new builder instance
     */
    public static DecisionBundleBuilder create() {
        return new DecisionBundleBuilder();
    }

    /**
     * Create a new builder with required fields
     */
    public static DecisionBundleBuilder create(String name, String jurisdiction, String domain) {
        return new DecisionBundleBuilder()
            .setName(name)
            .setJurisdiction(jurisdiction)
            .setDomain(domain);
    }
}