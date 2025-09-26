package com.glassbox.sdk;

import com.glassbox.sdk.model.DecisionBundle;
import com.glassbox.sdk.model.ExecutionContext;
import com.glassbox.sdk.model.RuleResult;
import com.glassbox.sdk.dsl.DSLParser;
import com.glassbox.sdk.dsl.DSLEvaluator;
import com.glassbox.sdk.dsl.ast.ASTNode;
import com.glassbox.sdk.dsl.DSLResult;

/**
 * Main entry point for the GlassBox SDK.
 * 
 * Provides high-level API for working with DecisionBundles and DSL rules.
 */
public class GlassBox {
    
    private final DSLParser dslParser;
    private final DSLEvaluator dslEvaluator;

    /**
     * Constructor
     */
    public GlassBox() {
        this.dslParser = new DSLParser();
        this.dslEvaluator = new DSLEvaluator();
    }

    /**
     * Parse DSL text into AST
     */
    public ASTNode parseDSL(String dslText) {
        return dslParser.parse(dslText);
    }

    /**
     * Validate DSL syntax
     */
    public boolean validateDSL(String dslText) {
        return dslParser.validateSyntax(dslText);
    }

    /**
     * Evaluate DSL against context
     */
    public DSLResult evaluateDSL(String dslText, ExecutionContext context) {
        ASTNode ast = parseDSL(dslText);
        return dslEvaluator.evaluate(ast, context);
    }

    /**
     * Evaluate DSL AST against context
     */
    public DSLResult evaluateDSL(ASTNode ast, ExecutionContext context) {
        return dslEvaluator.evaluate(ast, context);
    }

    /**
     * Create a new DecisionBundle builder
     */
    public DecisionBundleBuilder createBundle() {
        return DecisionBundleBuilder.create();
    }

    /**
     * Create a new DecisionBundle builder with required fields
     */
    public DecisionBundleBuilder createBundle(String name, String jurisdiction, String domain) {
        return DecisionBundleBuilder.create(name, jurisdiction, domain);
    }

    /**
     * Parse DecisionBundle from JSON
     */
    public DecisionBundle parseBundle(String json) {
        return DecisionBundle.fromJson(json);
    }

    /**
     * Get DSL grammar help
     */
    public String getDSLGrammarHelp() {
        return dslParser.getGrammarHelp();
    }

    /**
     * Get SDK version
     */
    public String getVersion() {
        return "1.0.0";
    }

    /**
     * Get SDK information
     */
    public String getInfo() {
        return String.format(
            "GlassBox SDK for Java v%s\n" +
            "A comprehensive SDK for GlassBox Standard v1.0 compliance management.\n" +
            "Features: DecisionBundle management, DSL parsing and evaluation, multiple rule types.",
            getVersion()
        );
    }

    /**
     * Quick example usage
     */
    public static void main(String[] args) {
        GlassBox glassBox = new GlassBox();
        
        // Example 1: Parse and evaluate DSL
        String dslText = "WHEN user.age >= 18 THEN MUST account.is_active = TRUE";
        
        ExecutionContext context = new ExecutionContext();
        context.setVariable("user.age", 25);
        context.setVariable("account.is_active", true);
        
        try {
            DSLResult result = glassBox.evaluateDSL(dslText, context);
            System.out.println("DSL Result: " + result);
        } catch (Exception e) {
            System.err.println("DSL evaluation failed: " + e.getMessage());
        }

        // Example 2: Create a DecisionBundle
        try {
            DecisionBundle bundle = glassBox.createBundle("GDPR Check", "GDPR", "privacy")
                .setDescription("Verify GDPR compliance for data processing")
                .addTag("privacy")
                .addTag("gdpr")
                .addDSLRule("rule-gdpr-001", "Lawful Basis", "Verify lawful basis for processing", 
                    "WHEN processing_data THEN MUST have_lawful_basis IN ['consent', 'contract']")
                .build();
            
            System.out.println("Created bundle: " + bundle.getMetadata().getName());
            System.out.println("Rules count: " + bundle.getRules().size());
        } catch (Exception e) {
            System.err.println("Bundle creation failed: " + e.getMessage());
        }
    }
}