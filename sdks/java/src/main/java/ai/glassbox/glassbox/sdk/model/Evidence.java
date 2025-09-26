package com.glassbox.sdk.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * Represents evidence in a DecisionBundle.
 * 
 * Evidence provides proof and support for compliance decisions with cryptographic verification.
 */
public class Evidence {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("type")
    private String type;
    
    @JsonProperty("content")
    private Object content;
    
    @JsonProperty("source")
    private String source;
    
    @JsonProperty("timestamp")
    private String timestamp;
    
    @JsonProperty("hash")
    private String hash;
    
    @JsonProperty("signature")
    private String signature;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    /**
     * Default constructor
     */
    public Evidence() {
        this.timestamp = java.time.Instant.now().toString();
    }

    /**
     * Constructor with required fields
     */
    public Evidence(String id, String type, Object content, String source) {
        this.id = id;
        this.type = type;
        this.content = content;
        this.source = source;
        this.timestamp = java.time.Instant.now().toString();
        this.hash = calculateHash();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Object getContent() {
        return content;
    }

    public void setContent(Object content) {
        this.content = content;
        this.hash = calculateHash(); // Recalculate hash when content changes
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    /**
     * Calculate SHA-256 hash of the evidence content
     */
    public String calculateHash() {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            String contentString = content != null ? content.toString() : "";
            byte[] hashBytes = digest.digest(contentString.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            
            // Convert to hexadecimal string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Verify the integrity of the evidence
     */
    public boolean verifyIntegrity() {
        if (hash == null) {
            return false;
        }
        String calculatedHash = calculateHash();
        return hash.equals(calculatedHash);
    }

    /**
     * Validate the evidence structure
     */
    public void validate(List<String> errors) {
        if (id == null || id.trim().isEmpty()) {
            errors.add("Evidence must have an ID");
        }
        if (type == null || type.trim().isEmpty()) {
            errors.add("Evidence '" + id + "' must have a type");
        }
        if (content == null) {
            errors.add("Evidence '" + id + "' must have content");
        }
        if (source == null || source.trim().isEmpty()) {
            errors.add("Evidence '" + id + "' must have a source");
        }
        if (timestamp == null || timestamp.trim().isEmpty()) {
            errors.add("Evidence '" + id + "' must have a timestamp");
        }
    }

    @Override
    public String toString() {
        return "Evidence{" +
                "id='" + id + '\'' +
                ", type='" + type + '\'' +
                ", source='" + source + '\'' +
                ", timestamp='" + timestamp + '\'' +
                ", hash='" + (hash != null ? hash.substring(0, 8) + "..." : "null") + '\'' +
                '}';
    }
}