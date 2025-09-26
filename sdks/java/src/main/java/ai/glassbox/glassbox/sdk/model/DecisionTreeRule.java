package com.glassbox.sdk.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Represents a decision tree rule.
 * 
 * Decision trees use hierarchical structure to define decision logic with branches.
 */
public class DecisionTreeRule extends Rule {
    
    @JsonProperty("definition")
    private DecisionTreeDefinition definition;

    public DecisionTreeRule() {
        super();
        this.type = "decision_tree";
    }

    public DecisionTreeRule(String id, String name, String description) {
        super(id, name, description, "decision_tree");
        this.definition = new DecisionTreeDefinition();
    }

    // Getters and Setters
    public DecisionTreeDefinition getDefinition() {
        return definition;
    }

    public void setDefinition(DecisionTreeDefinition definition) {
        this.definition = definition;
    }

    @Override
    public void validate(List<String> errors) {
        if (definition == null) {
            errors.add("Decision tree rule '" + id + "' must have a definition");
            return;
        }

        if (definition.getTree() == null) {
            errors.add("Decision tree rule '" + id + "' must have a tree");
            return;
        }

        validateTreeNode(definition.getTree(), errors, "root");
    }

    /**
     * Recursively validate a tree node
     */
    private void validateTreeNode(TreeNode node, List<String> errors, String path) {
        if (node == null) {
            errors.add("Decision tree rule '" + id + "' node at " + path + " is null");
            return;
        }

        if (node.isLeaf()) {
            // Leaf node validation
            if (node.getResult() == null) {
                errors.add("Decision tree rule '" + id + "' leaf node at " + path + " must have a result");
            }
        } else {
            // Internal node validation
            if (node.getCondition() == null) {
                errors.add("Decision tree rule '" + id + "' internal node at " + path + " must have a condition");
            } else {
                Condition condition = node.getCondition();
                if (condition.getField() == null || condition.getField().trim().isEmpty()) {
                    errors.add("Decision tree rule '" + id + "' node at " + path + " must have a condition field");
                }
                if (condition.getOperator() == null || condition.getOperator().trim().isEmpty()) {
                    errors.add("Decision tree rule '" + id + "' node at " + path + " must have a condition operator");
                }
            }

            // Validate branches
            if (node.getTrueBranch() != null) {
                validateTreeNode(node.getTrueBranch(), errors, path + ".true");
            }
            if (node.getFalseBranch() != null) {
                validateTreeNode(node.getFalseBranch(), errors, path + ".false");
            }
        }
    }

    @Override
    public RuleResult execute(ExecutionContext context) {
        try {
            TreeNodeResult result = evaluateTreeNode(definition.getTree(), context);
            return new RuleResult(
                this.id,
                result.isSuccess(),
                result.getReason(),
                result.getConfidence(),
                System.currentTimeMillis()
            );
        } catch (Exception e) {
            return new RuleResult(
                this.id,
                false,
                "Decision tree execution failed: " + e.getMessage(),
                0.0,
                System.currentTimeMillis()
            );
        }
    }

    /**
     * Recursively evaluate a tree node
     */
    private TreeNodeResult evaluateTreeNode(TreeNode node, ExecutionContext context) {
        if (node == null) {
            return new TreeNodeResult(false, "Tree node is null", 0.0);
        }

        if (node.isLeaf()) {
            // Return leaf node result
            return new TreeNodeResult(
                node.getResult(),
                node.getReason() != null ? node.getReason() : "Leaf node reached",
                node.getConfidence() != null ? node.getConfidence() : 1.0
            );
        } else {
            // Evaluate condition and traverse appropriate branch
            boolean conditionResult = evaluateCondition(node.getCondition(), context);
            
            if (conditionResult && node.getTrueBranch() != null) {
                return evaluateTreeNode(node.getTrueBranch(), context);
            } else if (!conditionResult && node.getFalseBranch() != null) {
                return evaluateTreeNode(node.getFalseBranch(), context);
            } else {
                return new TreeNodeResult(
                    false,
                    "No matching branch for condition result: " + conditionResult,
                    0.0
                );
            }
        }
    }

    /**
     * Evaluate a condition
     */
    private boolean evaluateCondition(Condition condition, ExecutionContext context) {
        Object fieldValue = context.getVariable(condition.getField());
        if (fieldValue == null) {
            return false;
        }

        String operator = condition.getOperator();
        Object conditionValue = condition.getValue();

        try {
            switch (operator.toLowerCase()) {
                case "=":
                case "==":
                    return fieldValue.equals(conditionValue);
                case "!=":
                case "<>":
                    return !fieldValue.equals(conditionValue);
                case ">":
                    if (fieldValue instanceof Number && conditionValue instanceof Number) {
                        return ((Number) fieldValue).doubleValue() > ((Number) conditionValue).doubleValue();
                    }
                    return false;
                case ">=":
                    if (fieldValue instanceof Number && conditionValue instanceof Number) {
                        return ((Number) fieldValue).doubleValue() >= ((Number) conditionValue).doubleValue();
                    }
                    return false;
                case "<":
                    if (fieldValue instanceof Number && conditionValue instanceof Number) {
                        return ((Number) fieldValue).doubleValue() < ((Number) conditionValue).doubleValue();
                    }
                    return false;
                case "<=":
                    if (fieldValue instanceof Number && conditionValue instanceof Number) {
                        return ((Number) fieldValue).doubleValue() <= ((Number) conditionValue).doubleValue();
                    }
                    return false;
                case "in":
                    if (conditionValue instanceof List) {
                        return ((List<?>) conditionValue).contains(fieldValue);
                    }
                    return false;
                case "not in":
                    if (conditionValue instanceof List) {
                        return !((List<?>) conditionValue).contains(fieldValue);
                    }
                    return false;
                default:
                    return false;
            }
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Decision tree definition class
     */
    public static class DecisionTreeDefinition {
        @JsonProperty("tree")
        private TreeNode tree;
        
        @JsonProperty("description")
        private String description;

        // Getters and Setters
        public TreeNode getTree() {
            return tree;
        }

        public void setTree(TreeNode tree) {
            this.tree = tree;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    /**
     * Tree node class
     */
    public static class TreeNode {
        @JsonProperty("condition")
        private Condition condition;
        
        @JsonProperty("true_branch")
        private TreeNode trueBranch;
        
        @JsonProperty("false_branch")
        private TreeNode falseBranch;
        
        @JsonProperty("result")
        private Boolean result;
        
        @JsonProperty("reason")
        private String reason;
        
        @JsonProperty("confidence")
        private Double confidence;

        // Getters and Setters
        public Condition getCondition() {
            return condition;
        }

        public void setCondition(Condition condition) {
            this.condition = condition;
        }

        public TreeNode getTrueBranch() {
            return trueBranch;
        }

        public void setTrueBranch(TreeNode trueBranch) {
            this.trueBranch = trueBranch;
        }

        public TreeNode getFalseBranch() {
            return falseBranch;
        }

        public void setFalseBranch(TreeNode falseBranch) {
            this.falseBranch = falseBranch;
        }

        public Boolean getResult() {
            return result;
        }

        public void setResult(Boolean result) {
            this.result = result;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public Double getConfidence() {
            return confidence;
        }

        public void setConfidence(Double confidence) {
            this.confidence = confidence;
        }

        /**
         * Check if this is a leaf node (has result instead of condition)
         */
        public boolean isLeaf() {
            return result != null;
        }
    }

    /**
     * Condition class (same as in DecisionTableRule)
     */
    public static class Condition {
        @JsonProperty("field")
        private String field;
        
        @JsonProperty("operator")
        private String operator;
        
        @JsonProperty("value")
        private Object value;

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
    }

    /**
     * Tree node result class for internal use
     */
    private static class TreeNodeResult {
        private final boolean success;
        private final String reason;
        private final double confidence;

        public TreeNodeResult(boolean success, String reason, double confidence) {
            this.success = success;
            this.reason = reason;
            this.confidence = confidence;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getReason() {
            return reason;
        }

        public double getConfidence() {
            return confidence;
        }
    }
}