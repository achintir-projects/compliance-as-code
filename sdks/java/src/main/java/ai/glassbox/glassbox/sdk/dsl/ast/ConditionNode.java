package com.glassbox.sdk.dsl.ast;

/**
 * AST node for conditions in the DSL.
 * 
 * Represents the WHEN part of the rule.
 */
public class ConditionNode extends ASTNode {
    
    private String field;
    private String operator;
    private Object value;
    private ConditionNode left;
    private ConditionNode right;

    public ConditionNode() {
        setType("condition");
    }

    // Getters and Setters
    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public ConditionNode getLeft() {
        return left;
    }

    public void setLeft(ConditionNode left) {
        this.left = left;
    }

    public ConditionNode getRight() {
        return right;
    }

    public void setRight(ConditionNode right) {
        this.right = right;
    }

    /**
     * Check if this is a logical condition (AND, OR, NOT)
     */
    public boolean isLogical() {
        return "logical".equals(getType()) && operator != null;
    }

    /**
     * Check if this is a leaf condition (no sub-conditions)
     */
    public boolean isLeaf() {
        return left == null && right == null;
    }

    @Override
    public <T> T accept(ASTVisitor<T> visitor) {
        return visitor.visit(this);
    }

    @Override
    public String toString() {
        if (isLogical()) {
            return "ConditionNode{" +
                    "operator='" + operator + '\'' +
                    ", left=" + left +
                    ", right=" + right +
                    '}';
        } else {
            return "ConditionNode{" +
                    "field='" + field + '\'' +
                    ", operator='" + operator + '\'' +
                    ", value=" + value +
                    '}';
        }
    }
}