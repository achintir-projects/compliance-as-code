package com.glassbox.sdk.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * Represents a decision table rule.
 * 
 * Decision tables use tabular format to define conditions and actions for compliance checks.
 */
public class DecisionTableRule extends Rule {
    
    @JsonProperty("definition")
    private DecisionTableDefinition definition;

    public DecisionTableRule() {
        super();
        this.type = "decision_table";
    }

    public DecisionTableRule(String id, String name, String description) {
        super(id, name, description, "decision_table");
        this.definition = new DecisionTableDefinition();
    }

    // Getters and Setters
    public DecisionTableDefinition getDefinition() {
        return definition;
    }

    public void setDefinition(DecisionTableDefinition definition) {
        this.definition = definition;
    }

    @Override
    public void validate(List<String> errors) {
        if (definition == null) {
            errors.add("Decision table rule '" + id + "' must have a definition");
            return;
        }

        if (definition.getTable() == null) {
            errors.add("Decision table rule '" + id + "' must have a table");
            return;
        }

        DecisionTable table = definition.getTable();
        
        // Validate conditions
        if (table.getConditions() == null || table.getConditions().isEmpty()) {
            errors.add("Decision table rule '" + id + "' must have at least one condition");
        } else {
            for (int i = 0; i < table.getConditions().size(); i++) {
                Condition condition = table.getConditions().get(i);
                if (condition.getField() == null || condition.getField().trim().isEmpty()) {
                    errors.add("Decision table rule '" + id + "' condition " + i + " must have a field");
                }
                if (condition.getOperator() == null || condition.getOperator().trim().isEmpty()) {
                    errors.add("Decision table rule '" + id + "' condition " + i + " must have an operator");
                }
            }
        }

        // Validate actions
        if (table.getActions() == null || table.getActions().isEmpty()) {
            errors.add("Decision table rule '" + id + "' must have at least one action");
        } else {
            for (int i = 0; i < table.getActions().size(); i++) {
                Action action = table.getActions().get(i);
                if (action.getResult() == null) {
                    errors.add("Decision table rule '" + id + "' action " + i + " must have a result");
                }
            }
        }
    }

    @Override
    public RuleResult execute(ExecutionContext context) {
        try {
            DecisionTable table = definition.getTable();
            
            // Check all conditions
            boolean allConditionsMatch = true;
            for (Condition condition : table.getConditions()) {
                if (!evaluateCondition(condition, context)) {
                    allConditionsMatch = false;
                    break;
                }
            }

            // If all conditions match, return the first action result
            if (allConditionsMatch && !table.getActions().isEmpty()) {
                Action action = table.getActions().get(0);
                return new RuleResult(
                    this.id,
                    action.isResult(),
                    action.getReason() != null ? action.getReason() : "Decision table conditions matched",
                    1.0,
                    System.currentTimeMillis()
                );
            }

            // No matching conditions
            return new RuleResult(
                this.id,
                false,
                "Decision table conditions not matched",
                1.0,
                System.currentTimeMillis()
            );
        } catch (Exception e) {
            return new RuleResult(
                this.id,
                false,
                "Decision table execution failed: " + e.getMessage(),
                0.0,
                System.currentTimeMillis()
            );
        }
    }

    /**
     * Evaluate a single condition
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
     * Decision table definition class
     */
    public static class DecisionTableDefinition {
        @JsonProperty("table")
        private DecisionTable table;
        
        @JsonProperty("description")
        private String description;

        // Getters and Setters
        public DecisionTable getTable() {
            return table;
        }

        public void setTable(DecisionTable table) {
            this.table = table;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    /**
     * Decision table class
     */
    public static class DecisionTable {
        @JsonProperty("conditions")
        private List<Condition> conditions;
        
        @JsonProperty("actions")
        private List<Action> actions;

        // Getters and Setters
        public List<Condition> getConditions() {
            return conditions;
        }

        public void setConditions(List<Condition> conditions) {
            this.conditions = conditions;
        }

        public List<Action> getActions() {
            return actions;
        }

        public void setActions(List<Action> actions) {
            this.actions = actions;
        }
    }

    /**
     * Condition class
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
     * Action class
     */
    public static class Action {
        @JsonProperty("result")
        private Boolean result;
        
        @JsonProperty("reason")
        private String reason;
        
        @JsonProperty("confidence")
        private Double confidence = 1.0;

        // Getters and Setters
        public Boolean isResult() {
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
    }
}