package com.glassbox.sdk.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.util.List;
import java.util.Map;

/**
 * Represents an expression rule using boolean expressions.
 * 
 * Expression rules use simple boolean expressions for compliance checks.
 */
public class ExpressionRule extends Rule {
    
    @JsonProperty("definition")
    private ExpressionDefinition definition;

    public ExpressionRule() {
        super();
        this.type = "expression";
    }

    public ExpressionRule(String id, String name, String description, String expression) {
        super(id, name, description, "expression");
        this.definition = new ExpressionDefinition();
        this.definition.setExpression(expression);
    }

    // Getters and Setters
    public ExpressionDefinition getDefinition() {
        return definition;
    }

    public void setDefinition(ExpressionDefinition definition) {
        this.definition = definition;
    }

    @Override
    public void validate(List<String> errors) {
        if (definition == null) {
            errors.add("Expression rule '" + id + "' must have a definition");
            return;
        }

        if (definition.getExpression() == null || definition.getExpression().trim().isEmpty()) {
            errors.add("Expression rule '" + id + "' must have an expression");
        }

        // Validate expression syntax
        try {
            ScriptEngine engine = new ScriptEngineManager().getEngineByName("js");
            if (engine == null) {
                errors.add("Expression rule '" + id + "': JavaScript engine not available");
                return;
            }
            
            // Test with empty context to check syntax
            engine.eval("try { " + definition.getExpression() + "; } catch(e) { throw e; }");
        } catch (ScriptException e) {
            errors.add("Expression rule '" + id + "' has syntax error: " + e.getMessage());
        }

        // Validate variables if present
        if (definition.getVariables() != null) {
            for (Map.Entry<String, String> entry : definition.getVariables().entrySet()) {
                String varName = entry.getKey();
                String varType = entry.getValue();
                if (varName == null || varName.trim().isEmpty()) {
                    errors.add("Expression rule '" + id + "' has variable with empty name");
                }
                if (varType == null || varType.trim().isEmpty()) {
                    errors.add("Expression rule '" + id + "' variable '" + varName + "' has empty type");
                }
            }
        }
    }

    @Override
    public RuleResult execute(ExecutionContext context) {
        try {
            ScriptEngine engine = new ScriptEngineManager().getEngineByName("js");
            if (engine == null) {
                return new RuleResult(
                    this.id,
                    false,
                    "JavaScript engine not available",
                    0.0,
                    System.currentTimeMillis()
                );
            }

            // Set up context variables
            if (definition.getVariables() != null) {
                for (Map.Entry<String, String> entry : definition.getVariables().entrySet()) {
                    String varName = entry.getKey();
                    Object value = context.getVariable(varName);
                    if (value != null) {
                        engine.put(varName, value);
                    }
                }
            }

            // Evaluate expression
            Object result = engine.eval(definition.getExpression());
            boolean booleanResult = Boolean.TRUE.equals(result);

            return new RuleResult(
                this.id,
                booleanResult,
                booleanResult ? "Expression evaluated to true" : "Expression evaluated to false",
                1.0,
                System.currentTimeMillis()
            );
        } catch (Exception e) {
            return new RuleResult(
                this.id,
                false,
                "Expression execution failed: " + e.getMessage(),
                0.0,
                System.currentTimeMillis()
            );
        }
    }

    /**
     * Expression definition class
     */
    public static class ExpressionDefinition {
        @JsonProperty("expression")
        private String expression;
        
        @JsonProperty("variables")
        private Map<String, String> variables;
        
        @JsonProperty("description")
        private String description;

        // Getters and Setters
        public String getExpression() {
            return expression;
        }

        public void setExpression(String expression) {
            this.expression = expression;
        }

        public Map<String, String> getVariables() {
            return variables;
        }

        public void setVariables(Map<String, String> variables) {
            this.variables = variables;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}