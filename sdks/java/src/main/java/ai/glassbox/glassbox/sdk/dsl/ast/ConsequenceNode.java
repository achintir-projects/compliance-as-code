package com.glassbox.sdk.dsl.ast;

/**
 * AST node for consequences in the DSL.
 * 
 * Represents the THEN part of the rule.
 */
public class ConsequenceNode extends ASTNode {
    
    private String constraintType;
    private ConditionNode constraint;
    private String action;
    private String target;

    public ConsequenceNode() {
        setType("consequence");
    }

    // Getters and Setters
    public String getConstraintType() {
        return constraintType;
    }

    public void setConstraintType(String constraintType) {
        this.constraintType = constraintType;
    }

    public ConditionNode getConstraint() {
        return constraint;
    }

    public void setConstraint(ConditionNode constraint) {
        this.constraint = constraint;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    /**
     * Check if this is a constraint consequence
     */
    public boolean isConstraint() {
        return "constraint".equals(getType()) && constraintType != null;
    }

    /**
     * Check if this is an action consequence
     */
    public boolean isAction() {
        return "action".equals(getType()) && action != null;
    }

    @Override
    public <T> T accept(ASTVisitor<T> visitor) {
        return visitor.visit(this);
    }

    @Override
    public String toString() {
        if (isConstraint()) {
            return "ConsequenceNode{" +
                    "constraintType='" + constraintType + '\'' +
                    ", constraint=" + constraint +
                    '}';
        } else {
            return "ConsequenceNode{" +
                    "action='" + action + '\'' +
                    ", target='" + target + '\'' +
                    '}';
        }
    }
}