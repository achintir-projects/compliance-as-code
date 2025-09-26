package com.glassbox.sdk.dsl;

import com.glassbox.sdk.dsl.ast.ASTNode;
import com.glassbox.sdk.dsl.ast.ConditionNode;
import com.glassbox.sdk.dsl.ast.ConsequenceNode;
import com.glassbox.sdk.dsl.ast.RootNode;
import com.glassbox.sdk.exception.DSLParserException;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parser for GlassBox Compliance DSL.
 * 
 * Parses DSL text into Abstract Syntax Tree (AST) nodes.
 */
public class DSLParser {
    
    // DSL grammar patterns
    private static final Pattern WHEN_PATTERN = Pattern.compile("^WHEN\\s+(.+?)\\s+THEN\\s+(.+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern CONDITION_PATTERN = Pattern.compile("^(.+?)\\s+(MUST|REQUIRE|SHOULD)\\s+(.+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern ACTION_PATTERN = Pattern.compile("^(FLAG|ALERT|BLOCK|ALLOW|LOG|NOTIFY)\\s+(.+)$", Pattern.CASE_INSENSITIVE);
    
    // Operator patterns
    private static final Pattern COMPARISON_PATTERN = Pattern.compile("^([^\\s=<>!]+)\\s*(=|==|!=|<>|>=|<=|>|<|LIKE)\\s*(.+)$");
    private static final Pattern MEMBERSHIP_PATTERN = Pattern.compile("^([^\\s]+)\\s+(IN|NOT IN)\\s*\\[(.+?)\\]$", Pattern.CASE_INSENSITIVE);
    private static final Pattern PATTERN_PATTERN = Pattern.compile("^([^\\s]+)\\s+(MATCHES|CONTAINS)\\s+(.+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern TEMPORAL_PATTERN = Pattern.compile("^([^\\s]+)\\s+(BEFORE|AFTER|WITHIN|EXPIRES)\\s+(.+)$", Pattern.CASE_INSENSITIVE);
    
    // Logical operators
    private static final Pattern LOGICAL_PATTERN = Pattern.compile("(.+?)\\s+(AND|OR|NOT)\\s+(.+)", Pattern.CASE_INSENSITIVE);

    /**
     * Parse DSL text into AST
     */
    public ASTNode parse(String dslText) throws DSLParserException {
        if (dslText == null || dslText.trim().isEmpty()) {
            throw new DSLParserException("DSL text cannot be null or empty", 0, 0, dslText);
        }

        String trimmedText = dslText.trim();
        
        // Parse main WHEN-THEN structure
        Matcher whenMatcher = WHEN_PATTERN.matcher(trimmedText);
        if (!whenMatcher.matches()) {
            throw new DSLParserException("DSL must start with 'WHEN ... THEN ...' structure", 1, 1, dslText);
        }

        String conditionPart = whenMatcher.group(1).trim();
        String consequencePart = whenMatcher.group(2).trim();

        try {
            // Parse condition
            ConditionNode condition = parseCondition(conditionPart);
            
            // Parse consequence
            ConsequenceNode consequence = parseConsequence(consequencePart);
            
            // Create root node
            RootNode rootNode = new RootNode();
            rootNode.setCondition(condition);
            rootNode.setConsequence(consequence);
            rootNode.setOriginalText(dslText);
            
            return rootNode;
        } catch (DSLParserException e) {
            throw e;
        } catch (Exception e) {
            throw new DSLParserException("Failed to parse DSL: " + e.getMessage(), 1, 1, dslText, e);
        }
    }

    /**
     * Parse condition part of DSL
     */
    private ConditionNode parseCondition(String conditionText) throws DSLParserException {
        ConditionNode condition = new ConditionNode();
        condition.setOriginalText(conditionText);

        // Check for logical operators first
        Matcher logicalMatcher = LOGICAL_PATTERN.matcher(conditionText);
        if (logicalMatcher.matches()) {
            condition.setType("logical");
            condition.setOperator(logicalMatcher.group(2).toUpperCase());
            
            // Parse left and right parts recursively
            condition.setLeft(parseCondition(logicalMatcher.group(1).trim()));
            condition.setRight(parseCondition(logicalMatcher.group(3).trim()));
        } else {
            // Parse simple condition
            parseSimpleCondition(condition, conditionText);
        }

        return condition;
    }

    /**
     * Parse simple condition (no logical operators)
     */
    private void parseSimpleCondition(ConditionNode condition, String conditionText) throws DSLParserException {
        // Try different condition patterns
        Matcher comparisonMatcher = COMPARISON_PATTERN.matcher(conditionText);
        if (comparisonMatcher.matches()) {
            condition.setType("comparison");
            condition.setField(comparisonMatcher.group(1).trim());
            condition.setOperator(comparisonMatcher.group(2));
            condition.setValue(parseValue(comparisonMatcher.group(3).trim()));
            return;
        }

        Matcher membershipMatcher = MEMBERSHIP_PATTERN.matcher(conditionText);
        if (membershipMatcher.matches()) {
            condition.setType("membership");
            condition.setField(membershipMatcher.group(1).trim());
            condition.setOperator(membershipMatcher.group(2).toUpperCase());
            
            // Parse list values
            String[] values = membershipMatcher.group(3).split("\\s*,\\s*");
            List<Object> valueList = new ArrayList<>();
            for (String value : values) {
                valueList.add(parseValue(value.trim()));
            }
            condition.setValue(valueList);
            return;
        }

        Matcher patternMatcher = PATTERN_PATTERN.matcher(conditionText);
        if (patternMatcher.matches()) {
            condition.setType("pattern");
            condition.setField(patternMatcher.group(1).trim());
            condition.setOperator(patternMatcher.group(2).toUpperCase());
            condition.setValue(patternMatcher.group(3).trim());
            return;
        }

        Matcher temporalMatcher = TEMPORAL_PATTERN.matcher(conditionText);
        if (temporalMatcher.matches()) {
            condition.setType("temporal");
            condition.setField(temporalMatcher.group(1).trim());
            condition.setOperator(temporalMatcher.group(2).toUpperCase());
            condition.setValue(temporalMatcher.group(3).trim());
            return;
        }

        throw new DSLParserException("Invalid condition format: " + conditionText, 1, 1, conditionText);
    }

    /**
     * Parse consequence part of DSL
     */
    private ConsequenceNode parseConsequence(String consequenceText) throws DSLParserException {
        ConsequenceNode consequence = new ConsequenceNode();
        consequence.setOriginalText(consequenceText);

        // Check for action pattern first
        Matcher actionMatcher = ACTION_PATTERN.matcher(consequenceText);
        if (actionMatcher.matches()) {
            consequence.setType("action");
            consequence.setAction(actionMatcher.group(1).toUpperCase());
            consequence.setTarget(actionMatcher.group(2).trim());
            return;
        }

        // Check for constraint pattern
        Matcher constraintMatcher = CONDITION_PATTERN.matcher(consequenceText);
        if (constraintMatcher.matches()) {
            consequence.setType("constraint");
            consequence.setConstraintType(constraintMatcher.group(2).toUpperCase());
            
            // Parse the constraint as a condition
            String constraintText = constraintMatcher.group(3).trim();
            ConditionNode constraintCondition = parseCondition(constraintText);
            consequence.setConstraint(constraintCondition);
            return;
        }

        throw new DSLParserException("Invalid consequence format: " + consequenceText, 1, 1, consequenceText);
    }

    /**
     * Parse a value from string to appropriate type
     */
    private Object parseValue(String valueStr) {
        if (valueStr == null || valueStr.trim().isEmpty()) {
            return null;
        }

        valueStr = valueStr.trim();

        // Try boolean
        if (valueStr.equalsIgnoreCase("TRUE") || valueStr.equalsIgnoreCase("FALSE")) {
            return Boolean.parseBoolean(valueStr);
        }

        // Try number
        try {
            if (valueStr.contains(".")) {
                return Double.parseDouble(valueStr);
            } else {
                return Long.parseLong(valueStr);
            }
        } catch (NumberFormatException e) {
            // Not a number, continue
        }

        // Try string (remove quotes if present)
        if ((valueStr.startsWith("\"") && valueStr.endsWith("\"")) || 
            (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
            return valueStr.substring(1, valueStr.length() - 1);
        }

        // Return as string
        return valueStr;
    }

    /**
     * Validate DSL syntax without full parsing
     */
    public boolean validateSyntax(String dslText) {
        try {
            parse(dslText);
            return true;
        } catch (DSLParserException e) {
            return false;
        }
    }

    /**
     * Get DSL grammar help
     */
    public String getGrammarHelp() {
        return """
            GlassBox Compliance DSL Grammar:
            
            Basic Structure:
              WHEN <condition> THEN <consequence>
            
            Conditions:
              - Comparison: field operator value
                Examples: user.age >= 18, transaction.amount > 10000
              - Membership: field IN [value1, value2, ...]
                Examples: country IN ['US', 'GB', 'CA'], status NOT IN ['blocked', 'suspended']
              - Pattern: field MATCHES pattern
                Examples: email MATCHES '.*@.*\\..*', name CONTAINS 'John'
              - Temporal: field BEFORE/AFTER/WITHIN/EXPIRES datetime
                Examples: created_at BEFORE '2023-01-01', expires WITHIN '30 days'
            
            Logical Operators:
              - AND: condition1 AND condition2
              - OR: condition1 OR condition2
              - NOT: NOT condition
            
            Consequences:
              - Actions: FLAG/ALERT/BLOCK/ALLOW/LOG/NOTIFY target
                Examples: FLAG transaction, ALERT admin, BLOCK user
              - Constraints: MUST/REQUIRE/SHOULD condition
                Examples: MUST user.is_verified = TRUE, REQUIRE transaction.amount < 10000
            
            Operators:
              - Comparison: =, ==, !=, <>, >, >=, <, <=, LIKE
              - Logical: AND, OR, NOT
              - Membership: IN, NOT IN, CONTAINS, MATCHES
              - Temporal: BEFORE, AFTER, WITHIN, EXPIRES
            """;
    }
}