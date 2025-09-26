package com.glassbox.sdk.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.glassbox.sdk.dsl.DSLParser;
import com.glassbox.sdk.dsl.DSLEvaluator;
import com.glassbox.sdk.dsl.ast.ASTNode;

import java.util.List;
import java.util.Map;

/**
 * Represents a DSL (Domain-Specific Language) rule.
 * 
 * DSL rules use human-readable language to define compliance conditions and consequences.
 */
public class DSLRule extends Rule {
    
    @JsonProperty("definition")
    private DSLDefinition definition;

    public DSLRule() {
        super();
        this.type = "dsl";
    }

    public DSLRule(String id, String name, String description, String dslText) {
        super(id, name, description, "dsl");
        this.definition = new DSLDefinition();
        this.definition.setDsl(dslText);
    }

    // Getters and Setters
    public DSLDefinition getDefinition() {
        return definition;
    }

    public void setDefinition(DSLDefinition definition) {
        this.definition = definition;
    }

    @Override
    public void validate(List<String> errors) {
        if (definition == null) {
            errors.add("DSL rule '" + id + "' must have a definition");
            return;
        }

        if (definition.getDsl() == null || definition.getDsl().trim().isEmpty()) {
            errors.add("DSL rule '" + id + "' must have DSL text");
        }

        // Validate DSL syntax
        try {
            DSLParser parser = new DSLParser();
            ASTNode ast = parser.parse(definition.getDsl());
            if (ast == null) {
                errors.add("DSL rule '" + id + "' failed to parse");
            }
        } catch (Exception e) {
            errors.add("DSL rule '" + id + "' has syntax error: " + e.getMessage());
        }

        // Validate parameters if present
        if (definition.getParameters() != null) {
            for (Map.Entry<String, String> entry : definition.getParameters().entrySet()) {
                String paramName = entry.getKey();
                String paramType = entry.getValue();
                if (paramName == null || paramName.trim().isEmpty()) {
                    errors.add("DSL rule '" + id + "' has parameter with empty name");
                }
                if (paramType == null || paramType.trim().isEmpty()) {
                    errors.add("DSL rule '" + id + "' parameter '" + paramName + "' has empty type");
                }
            }
        }
    }

    @Override
    public RuleResult execute(ExecutionContext context) {
        try {
            DSLParser parser = new DSLParser();
            DSLEvaluator evaluator = new DSLEvaluator();
            
            ASTNode ast = parser.parse(definition.getDsl());
            DSLResult dslResult = evaluator.evaluate(ast, context);
            
            return new RuleResult(
                this.id,
                dslResult.isResult(),
                dslResult.getReason(),
                dslResult.getConfidence(),
                System.currentTimeMillis()
            );
        } catch (Exception e) {
            return new RuleResult(
                this.id,
                false,
                "DSL execution failed: " + e.getMessage(),
                0.0,
                System.currentTimeMillis()
            );
        }
    }

    /**
     * DSL definition class
     */
    public static class DSLDefinition {
        @JsonProperty("dsl")
        private String dsl;
        
        @JsonProperty("parameters")
        private Map<String, String> parameters;
        
        @JsonProperty("description")
        private String description;

        // Getters and Setters
        public String getDsl() {
            return dsl;
        }

        public void setDsl(String dsl) {
            this.dsl = dsl;
        }

        public Map<String, String> getParameters() {
            return parameters;
        }

        public void setParameters(Map<String, String> parameters) {
            this.parameters = parameters;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}