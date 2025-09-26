package com.glassbox.sdk.dsl;

import com.glassbox.sdk.dsl.ast.ASTNode;
import com.glassbox.sdk.dsl.ast.ASTVisitor;
import com.glassbox.sdk.dsl.ast.ConditionNode;
import com.glassbox.sdk.dsl.ast.ConsequenceNode;
import com.glassbox.sdk.dsl.ast.RootNode;
import com.glassbox.sdk.model.ExecutionContext;
import com.glassbox.sdk.model.RuleResult;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Evaluator for GlassBox Compliance DSL AST.
 * 
 * Evaluates parsed DSL rules against execution context.
 */
public class DSLEvaluator {
    
    private final ASTVisitor<DSLResult> visitor;

    public DSLEvaluator() {
        this.visitor = new EvaluationVisitor();
    }

    /**
     * Evaluate DSL AST against execution context
     */
    public DSLResult evaluate(ASTNode ast, ExecutionContext context) {
        if (ast == null) {
            return new DSLResult(false, "AST node is null", 0.0);
        }

        try {
            return ast.accept(visitor);
        } catch (Exception e) {
            return new DSLResult(false, "Evaluation failed: " + e.getMessage(), 0.0);
        }
    }

    /**
     * Visitor implementation for DSL evaluation
     */
    private class EvaluationVisitor implements ASTVisitor<DSLResult> {
        
        @Override
        public DSLResult visit(RootNode node) {
            // Evaluate condition first
            DSLResult conditionResult = node.getCondition().accept(this);
            
            if (!conditionResult.isResult()) {
                return conditionResult;
            }
            
            // Evaluate consequence
            DSLResult consequenceResult = node.getConsequence().accept(this);
            
            // Combine results
            boolean overallResult = conditionResult.isResult() && consequenceResult.isResult();
            String reason = conditionResult.getReason() + "; " + consequenceResult.getReason();
            double confidence = (conditionResult.getConfidence() + consequenceResult.getConfidence()) / 2.0;
            
            return new DSLResult(overallResult, reason, confidence);
        }

        @Override
        public DSLResult visit(ConditionNode node) {
            try {
                if (node.isLogical()) {
                    return evaluateLogicalCondition(node);
                } else {
                    return evaluateSimpleCondition(node);
                }
            } catch (Exception e) {
                return new DSLResult(false, "Condition evaluation failed: " + e.getMessage(), 0.0);
            }
        }

        @Override
        public DSLResult visit(ConsequenceNode node) {
            try {
                if (node.isConstraint()) {
                    return evaluateConstraintConsequence(node);
                } else if (node.isAction()) {
                    return evaluateActionConsequence(node);
                } else {
                    return new DSLResult(false, "Unknown consequence type", 0.0);
                }
            } catch (Exception e) {
                return new DSLResult(false, "Consequence evaluation failed: " + e.getMessage(), 0.0);
            }
        }

        /**
         * Evaluate logical condition (AND, OR, NOT)
         */
        private DSLResult evaluateLogicalCondition(ConditionNode node) {
            String operator = node.getOperator();
            
            switch (operator.toUpperCase()) {
                case "AND":
                    DSLResult leftResult = node.getLeft().accept(this);
                    if (!leftResult.isResult()) {
                        return leftResult;
                    }
                    DSLResult rightResult = node.getRight().accept(this);
                    if (!rightResult.isResult()) {
                        return rightResult;
                    }
                    return new DSLResult(true, 
                        "Both conditions satisfied: " + leftResult.getReason() + " AND " + rightResult.getReason(),
                        Math.min(leftResult.getConfidence(), rightResult.getConfidence()));
                    
                case "OR":
                    DSLResult leftOrResult = node.getLeft().accept(this);
                    if (leftOrResult.isResult()) {
                        return leftOrResult;
                    }
                    DSLResult rightOrResult = node.getRight().accept(this);
                    if (rightOrResult.isResult()) {
                        return rightOrResult;
                    }
                    return new DSLResult(false, 
                        "Neither condition satisfied: " + leftOrResult.getReason() + " OR " + rightOrResult.getReason(),
                        Math.max(leftOrResult.getConfidence(), rightOrResult.getConfidence()));
                    
                case "NOT":
                    DSLResult notResult = node.getRight().accept(this);
                    return new DSLResult(!notResult.isResult(),
                        "NOT " + notResult.getReason(),
                        notResult.getConfidence());
                    
                default:
                    return new DSLResult(false, "Unknown logical operator: " + operator, 0.0);
            }
        }

        /**
         * Evaluate simple condition
         */
        private DSLResult evaluateSimpleCondition(ConditionNode node) {
            String field = node.getField();
            Object expectedValue = node.getValue();
            String operator = node.getOperator();
            
            // Get actual value from context
            Object actualValue = context.getVariable(field);
            if (actualValue == null) {
                return new DSLResult(false, "Field '" + field + "' not found in context", 0.0);
            }
            
            // Evaluate based on operator
            boolean result = evaluateComparison(actualValue, expectedValue, operator);
            String reason = String.format("Field '%s' %s %s (actual: %s, expected: %s)",
                field, operator, expectedValue, actualValue, expectedValue);
            
            return new DSLResult(result, reason, 1.0);
        }

        /**
         * Evaluate constraint consequence
         */
        private DSLResult evaluateConstraintConsequence(ConsequenceNode node) {
            DSLResult constraintResult = node.getConstraint().accept(this);
            
            String constraintType = node.getConstraintType();
            String reason;
            boolean result;
            
            switch (constraintType.toUpperCase()) {
                case "MUST":
                    result = constraintResult.isResult();
                    reason = constraintResult.isResult() ? 
                        "Required constraint satisfied: " + constraintResult.getReason() :
                        "Required constraint failed: " + constraintResult.getReason();
                    break;
                    
                case "REQUIRE":
                    result = constraintResult.isResult();
                    reason = constraintResult.isResult() ?
                        "Requirement met: " + constraintResult.getReason() :
                        "Requirement not met: " + constraintResult.getReason();
                    break;
                    
                case "SHOULD":
                    result = constraintResult.isResult();
                    reason = constraintResult.isResult() ?
                        "Recommendation followed: " + constraintResult.getReason() :
                        "Recommendation ignored: " + constraintResult.getReason();
                    break;
                    
                default:
                    return new DSLResult(false, "Unknown constraint type: " + constraintType, 0.0);
            }
            
            return new DSLResult(result, reason, constraintResult.getConfidence());
        }

        /**
         * Evaluate action consequence
         */
        private DSLResult evaluateActionConsequence(ConsequenceNode node) {
            String action = node.getAction();
            String target = node.getTarget();
            
            // For now, actions always succeed (they would be handled by the rule engine)
            String reason = String.format("Action '%s' on target '%s' would be executed", action, target);
            
            return new DSLResult(true, reason, 1.0);
        }

        /**
         * Evaluate comparison between actual and expected values
         */
        private boolean evaluateComparison(Object actual, Object expected, String operator) {
            if (actual == null || expected == null) {
                return false;
            }

            try {
                switch (operator.toUpperCase()) {
                    case "=":
                    case "==":
                        return actual.equals(expected);
                        
                    case "!=":
                    case "<>":
                        return !actual.equals(expected);
                        
                    case ">":
                        return compareNumbers(actual, expected) > 0;
                        
                    case ">=":
                        return compareNumbers(actual, expected) >= 0;
                        
                    case "<":
                        return compareNumbers(actual, expected) < 0;
                        
                    case "<=":
                        return compareNumbers(actual, expected) <= 0;
                        
                    case "LIKE":
                        return likeCompare(actual.toString(), expected.toString());
                        
                    case "IN":
                        if (expected instanceof List) {
                            return ((List<?>) expected).contains(actual);
                        }
                        return false;
                        
                    case "NOT IN":
                        if (expected instanceof List) {
                            return !((List<?>) expected).contains(actual);
                        }
                        return false;
                        
                    case "CONTAINS":
                        return actual.toString().contains(expected.toString());
                        
                    case "MATCHES":
                        return Pattern.matches(expected.toString(), actual.toString());
                        
                    case "BEFORE":
                        return compareDates(actual, expected) < 0;
                        
                    case "AFTER":
                        return compareDates(actual, expected) > 0;
                        
                    case "WITHIN":
                        return isWithinTimeframe(actual, expected);
                        
                    case "EXPIRES":
                        return isExpired(actual, expected);
                        
                    default:
                        return false;
                }
            } catch (Exception e) {
                return false;
            }
        }

        /**
         * Compare two objects as numbers
         */
        private int compareNumbers(Object a, Object b) {
            double numA = toDouble(a);
            double numB = toDouble(b);
            return Double.compare(numA, numB);
        }

        /**
         * Convert object to double
         */
        private double toDouble(Object obj) {
            if (obj instanceof Number) {
                return ((Number) obj).doubleValue();
            }
            return Double.parseDouble(obj.toString());
        }

        /**
         * SQL LIKE pattern matching
         */
        private boolean likeCompare(String str, String pattern) {
            String regex = pattern.replace("%", ".*").replace("_", ".");
            return Pattern.matches(regex, str);
        }

        /**
         * Compare two date strings
         */
        private int compareDates(Object a, Object b) {
            Instant dateA = parseDate(a.toString());
            Instant dateB = parseDate(b.toString());
            return dateA.compareTo(dateB);
        }

        /**
         * Parse date string to Instant
         */
        private Instant parseDate(String dateStr) {
            try {
                return Instant.parse(dateStr);
            } catch (Exception e) {
                // Try common formats
                DateTimeFormatter[] formatters = {
                    DateTimeFormatter.ISO_INSTANT,
                    DateTimeFormatter.ISO_DATE_TIME,
                    DateTimeFormatter.ISO_DATE
                };
                
                for (DateTimeFormatter formatter : formatters) {
                    try {
                        return formatter.parse(dateStr, Instant::from);
                    } catch (Exception ignored) {
                        // Try next format
                    }
                }
                
                throw new IllegalArgumentException("Unable to parse date: " + dateStr);
            }
        }

        /**
         * Check if date is within timeframe
         */
        private boolean isWithinTimeframe(Object date, Object timeframe) {
            Instant targetDate = parseDate(date.toString());
            Instant now = Instant.now();
            
            String timeframeStr = timeframe.toString().toLowerCase();
            if (timeframeStr.endsWith("days")) {
                long days = Long.parseLong(timeframeStr.replace("days", "").trim());
                return targetDate.isAfter(now.minus(days, ChronoUnit.DAYS));
            } else if (timeframeStr.endsWith("hours")) {
                long hours = Long.parseLong(timeframeStr.replace("hours", "").trim());
                return targetDate.isAfter(now.minus(hours, ChronoUnit.HOURS));
            } else if (timeframeStr.endsWith("minutes")) {
                long minutes = Long.parseLong(timeframeStr.replace("minutes", "").trim());
                return targetDate.isAfter(now.minus(minutes, ChronoUnit.MINUTES));
            }
            
            return false;
        }

        /**
         * Check if date is expired
         */
        private boolean isExpired(Object date, Object reference) {
            Instant targetDate = parseDate(date.toString());
            Instant referenceDate = parseDate(reference.toString());
            return targetDate.isBefore(referenceDate);
        }
    }
}