package com.glassbox.sdk.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.glassbox.sdk.exception.GlassBoxException;
import com.glassbox.sdk.exception.ValidationException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Represents a GlassBox DecisionBundle - the core data structure for compliance decisions.
 * 
 * A DecisionBundle contains metadata, rules, decisions, and audit information
 * for regulatory compliance according to the GlassBox Standard v1.0.
 */
public class DecisionBundle {
    
    @JsonProperty("version")
    private String version = "1.0";
    
    @JsonProperty("metadata")
    private Metadata metadata;
    
    @JsonProperty("rules")
    private List<Rule> rules = new ArrayList<>();
    
    @JsonProperty("decisions")
    private List<Decision> decisions = new ArrayList<>();
    
    @JsonProperty("audit")
    private AuditInfo audit;
    
    @JsonProperty("evidence")
    private List<Evidence> evidence = new ArrayList<>();

    /**
     * Default constructor for Jackson deserialization
     */
    public DecisionBundle() {
        this.metadata = new Metadata();
        this.audit = new AuditInfo();
    }

    /**
     * Constructor with required metadata
     */
    public DecisionBundle(String name, String description, String jurisdiction, String domain) {
        this.metadata = new Metadata(name, description, jurisdiction, domain);
        this.audit = new AuditInfo();
    }

    // Getters and Setters
    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Metadata getMetadata() {
        return metadata;
    }

    public void setMetadata(Metadata metadata) {
        this.metadata = metadata;
    }

    public List<Rule> getRules() {
        return rules;
    }

    public void setRules(List<Rule> rules) {
        this.rules = rules;
    }

    public List<Decision> getDecisions() {
        return decisions;
    }

    public void setDecisions(List<Decision> decisions) {
        this.decisions = decisions;
    }

    public AuditInfo getAudit() {
        return audit;
    }

    public void setAudit(AuditInfo audit) {
        this.audit = audit;
    }

    public List<Evidence> getEvidence() {
        return evidence;
    }

    public void setEvidence(List<Evidence> evidence) {
        this.evidence = evidence;
    }

    /**
     * Add a rule to the bundle
     */
    public void addRule(Rule rule) {
        if (rule == null) {
            throw new IllegalArgumentException("Rule cannot be null");
        }
        this.rules.add(rule);
    }

    /**
     * Add a decision to the bundle
     */
    public void addDecision(Decision decision) {
        if (decision == null) {
            throw new IllegalArgumentException("Decision cannot be null");
        }
        this.decisions.add(decision);
    }

    /**
     * Add evidence to the bundle
     */
    public void addEvidence(Evidence evidence) {
        if (evidence == null) {
            throw new IllegalArgumentException("Evidence cannot be null");
        }
        this.evidence.add(evidence);
    }

    /**
     * Get a rule by ID
     */
    public Rule getRuleById(String ruleId) {
        return rules.stream()
                .filter(rule -> ruleId.equals(rule.getId()))
                .findFirst()
                .orElse(null);
    }

    /**
     * Get a decision by ID
     */
    public Decision getDecisionById(String decisionId) {
        return decisions.stream()
                .filter(decision -> decisionId.equals(decision.getId()))
                .findFirst()
                .orElse(null);
    }

    /**
     * Validate the bundle structure
     */
    public void validate() throws ValidationException {
        List<String> errors = new ArrayList<>();

        // Validate metadata
        if (metadata == null) {
            errors.add("Metadata cannot be null");
        } else {
            metadata.validate(errors);
        }

        // Validate rules
        for (int i = 0; i < rules.size(); i++) {
            Rule rule = rules.get(i);
            if (rule.getId() == null || rule.getId().trim().isEmpty()) {
                errors.add("Rule at index " + i + " must have an ID");
            }
            if (rule.getType() == null || rule.getType().trim().isEmpty()) {
                errors.add("Rule " + rule.getId() + " must have a type");
            }
            rule.validate(errors);
        }

        // Validate decisions
        for (int i = 0; i < decisions.size(); i++) {
            Decision decision = decisions.get(i);
            if (decision.getId() == null || decision.getId().trim().isEmpty()) {
                errors.add("Decision at index " + i + " must have an ID");
            }
            decision.validate(errors);
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("DecisionBundle validation failed", errors);
        }
    }

    /**
     * Convert bundle to JSON string
     */
    public String toJson() throws GlassBoxException {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.enable(SerializationFeature.INDENT_OUTPUT);
            return mapper.writeValueAsString(this);
        } catch (Exception e) {
            throw new GlassBoxException("Failed to serialize DecisionBundle to JSON", e);
        }
    }

    /**
     * Create DecisionBundle from JSON string
     */
    public static DecisionBundle fromJson(String json) throws GlassBoxException {
        try {
            ObjectMapper mapper = new ObjectMapper();
            DecisionBundle bundle = mapper.readValue(json, DecisionBundle.class);
            bundle.validate();
            return bundle;
        } catch (Exception e) {
            throw new GlassBoxException("Failed to deserialize DecisionBundle from JSON", e);
        }
    }

    /**
     * Metadata class for bundle information
     */
    public static class Metadata {
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("jurisdiction")
        private String jurisdiction;
        
        @JsonProperty("domain")
        private String domain;
        
        @JsonProperty("created_at")
        private String createdAt;
        
        @JsonProperty("updated_at")
        private String updatedAt;
        
        @JsonProperty("created_by")
        private String createdBy;
        
        @JsonProperty("tags")
        private List<String> tags = new ArrayList<>();
        
        @JsonProperty("additional_properties")
        private Map<String, Object> additionalProperties = new HashMap<>();

        public Metadata() {
            // Default constructor
        }

        public Metadata(String name, String description, String jurisdiction, String domain) {
            this.name = name;
            this.description = description;
            this.jurisdiction = jurisdiction;
            this.domain = domain;
            this.createdAt = java.time.Instant.now().toString();
            this.updatedAt = this.createdAt;
        }

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getJurisdiction() { return jurisdiction; }
        public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
        
        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }
        
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        
        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
        
        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
        
        public List<String> getTags() { return tags; }
        public void setTags(List<String> tags) { this.tags = tags; }
        
        public Map<String, Object> getAdditionalProperties() { return additionalProperties; }
        public void setAdditionalProperties(Map<String, Object> additionalProperties) { 
            this.additionalProperties = additionalProperties; 
        }

        public void validate(List<String> errors) {
            if (name == null || name.trim().isEmpty()) {
                errors.add("Metadata name cannot be null or empty");
            }
            if (jurisdiction == null || jurisdiction.trim().isEmpty()) {
                errors.add("Metadata jurisdiction cannot be null or empty");
            }
            if (domain == null || domain.trim().isEmpty()) {
                errors.add("Metadata domain cannot be null or empty");
            }
        }
    }

    /**
     * Audit information class
     */
    public static class AuditInfo {
        @JsonProperty("created_at")
        private String createdAt;
        
        @JsonProperty("created_by")
        private String createdBy;
        
        @JsonProperty("signature")
        private String signature;
        
        @JsonProperty("hash_algorithm")
        private String hashAlgorithm = "SHA-256";
        
        @JsonProperty("checksum")
        private String checksum;

        public AuditInfo() {
            this.createdAt = java.time.Instant.now().toString();
        }

        // Getters and Setters
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        
        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
        
        public String getSignature() { return signature; }
        public void setSignature(String signature) { this.signature = signature; }
        
        public String getHashAlgorithm() { return hashAlgorithm; }
        public void setHashAlgorithm(String hashAlgorithm) { this.hashAlgorithm = hashAlgorithm; }
        
        public String getChecksum() { return checksum; }
        public void setChecksum(String checksum) { this.checksum = checksum; }
    }

    @Override
    public String toString() {
        return "DecisionBundle{" +
                "version='" + version + '\'' +
                ", metadata=" + metadata +
                ", rules=" + rules.size() +
                ", decisions=" + decisions.size() +
                ", evidence=" + evidence.size() +
                '}';
    }
}