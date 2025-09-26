package com.glassbox.sdk.dsl.ast;

/**
 * Base class for all AST nodes in the DSL.
 */
public abstract class ASTNode {
    
    private String type;
    private String originalText;

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    /**
     * Accept a visitor for double-dispatch pattern
     */
    public abstract <T> T accept(ASTVisitor<T> visitor);

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{" +
                "type='" + type + '\'' +
                ", originalText='" + (originalText != null ? originalText.substring(0, Math.min(50, originalText.length())) + "..." : "null") + '\'' +
                '}';
    }
}