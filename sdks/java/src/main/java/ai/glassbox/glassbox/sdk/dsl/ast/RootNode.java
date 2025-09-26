package com.glassbox.sdk.dsl.ast;

/**
 * Root node of the DSL AST.
 * 
 * Represents the complete WHEN-THEN structure.
 */
public class RootNode extends ASTNode {
    
    private ConditionNode condition;
    private ConsequenceNode consequence;

    public RootNode() {
        setType("root");
    }

    // Getters and Setters
    public ConditionNode getCondition() {
        return condition;
    }

    public void setCondition(ConditionNode condition) {
        this.condition = condition;
    }

    public ConsequenceNode getConsequence() {
        return consequence;
    }

    public void setConsequence(ConsequenceNode consequence) {
        this.consequence = consequence;
    }

    @Override
    public <T> T accept(ASTVisitor<T> visitor) {
        return visitor.visit(this);
    }

    @Override
    public String toString() {
        return "RootNode{" +
                "condition=" + condition +
                ", consequence=" + consequence +
                '}';
    }
}