package com.glassbox.sdk.examples;

import com.glassbox.sdk.GlassBox;
import com.glassbox.sdk.model.DecisionBundle;
import com.glassbox.sdk.model.ExecutionContext;
import com.glassbox.sdk.model.RuleResult;
import com.glassbox.sdk.dsl.DSLResult;
import com.glassbox.sdk.dsl.ast.ASTNode;

/**
 * Quick start example demonstrating GlassBox SDK usage.
 */
public class QuickStart {
    
    public static void main(String[] args) {
        System.out.println("=== GlassBox SDK Quick Start ===\n");
        
        // Initialize the SDK
        GlassBox glassBox = new GlassBox();
        System.out.println("GlassBox SDK Version: " + glassBox.getVersion());
        System.out.println();
        
        // Example 1: Parse and evaluate DSL
        System.out.println("1. DSL Parsing and Evaluation");
        System.out.println("================================");
        
        String dslText = "WHEN user.age >= 18 THEN MUST account.is_active = TRUE";
        System.out.println("DSL: " + dslText);
        
        // Create execution context
        ExecutionContext context = new ExecutionContext();
        context.setVariable("user.age", 25);
        context.setVariable("account.is_active", true);
        context.setVariable("user.name", "John Doe");
        
        System.out.println("Context: user.age=25, account.is_active=true");
        
        try {
            // Parse DSL
            ASTNode ast = glassBox.parseDSL(dslText);
            System.out.println("✓ DSL parsed successfully");
            
            // Evaluate DSL
            DSLResult result = glassBox.evaluateDSL(ast, context);
            System.out.println("Result: " + (result.isResult() ? "PASS" : "FAIL"));
            System.out.println("Reason: " + result.getReason());
            System.out.println("Confidence: " + result.getConfidence());
            
        } catch (Exception e) {
            System.err.println("✗ DSL evaluation failed: " + e.getMessage());
        }
        
        System.out.println();
        
        // Example 2: Create a DecisionBundle
        System.out.println("2. DecisionBundle Creation");
        System.out.println("============================");
        
        try {
            DecisionBundle bundle = glassBox.createBundle("GDPR Compliance Check", "GDPR", "privacy")
                .setDescription("Verify GDPR compliance for data processing")
                .addTag("privacy")
                .addTag("gdpr")
                .addTag("compliance")
                .addDSLRule("rule-gdpr-001", "Lawful Basis", 
                    "Verify lawful basis for data processing",
                    "WHEN processing_personal_data THEN MUST have_lawful_basis IN ['consent', 'contract', 'legal_obligation']")
                .addDSLRule("rule-gdpr-002", "Data Minimization", 
                    "Ensure data minimization principle",
                    "WHEN collecting_data THEN MUST data_fields ESSENTIAL_FOR purpose")
                .build();
            
            System.out.println("✓ DecisionBundle created successfully");
            System.out.println("Name: " + bundle.getMetadata().getName());
            System.out.println("Jurisdiction: " + bundle.getMetadata().getJurisdiction());
            System.out.println("Domain: " + bundle.getMetadata().getDomain());
            System.out.println("Rules: " + bundle.getRules().size());
            System.out.println("Tags: " + bundle.getMetadata().getTags());
            
            // Export to JSON
            String json = bundle.toJson();
            System.out.println("JSON length: " + json.length() + " characters");
            
            // Parse back from JSON
            DecisionBundle parsedBundle = DecisionBundle.fromJson(json);
            System.out.println("✓ JSON parsing successful");
            System.out.println("Parsed bundle name: " + parsedBundle.getMetadata().getName());
            
        } catch (Exception e) {
            System.err.println("✗ DecisionBundle creation failed: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println();
        
        // Example 3: Complex DSL with multiple conditions
        System.out.println("3. Complex DSL Example");
        System.out.println("=======================");
        
        String complexDSL = "WHEN transaction.amount > 10000 AND transaction.country IN ['IR', 'KP', 'SY'] THEN MUST FLAG transaction as_suspicious AND ALERT compliance_team";
        System.out.println("DSL: " + complexDSL);
        
        ExecutionContext fraudContext = new ExecutionContext();
        fraudContext.setVariable("transaction.amount", 15000);
        fraudContext.setVariable("transaction.country", "IR");
        fraudContext.setVariable("transaction.id", "TXN001");
        
        System.out.println("Context: transaction.amount=15000, transaction.country='IR'");
        
        try {
            DSLResult fraudResult = glassBox.evaluateDSL(complexDSL, fraudContext);
            System.out.println("Result: " + (fraudResult.isResult() ? "PASS" : "FAIL"));
            System.out.println("Reason: " + fraudResult.getReason());
            System.out.println("Confidence: " + fraudResult.getConfidence());
            
        } catch (Exception e) {
            System.err.println("✗ Complex DSL evaluation failed: " + e.getMessage());
        }
        
        System.out.println();
        
        // Example 4: DSL Validation
        System.out.println("4. DSL Validation");
        System.out.println("==================");
        
        String[] testDSLs = {
            "WHEN user.age >= 18 THEN MUST account.active = TRUE",  // Valid
            "WHEN user.age >= 18 THEN account.active = TRUE",       // Invalid - missing MUST
            "user.age >= 18",                                       // Invalid - missing WHEN/THEN
            "WHEN condition THEN consequence"                        // Valid structure
        };
        
        for (String testDSL : testDSLs) {
            boolean isValid = glassBox.validateDSL(testDSL);
            System.out.println("DSL: \"" + testDSL + "\" -> " + (isValid ? "✓ Valid" : "✗ Invalid"));
        }
        
        System.out.println();
        
        // Example 5: Get grammar help
        System.out.println("5. DSL Grammar Help");
        System.out.println("====================");
        System.out.println(glassBox.getDSLGrammarHelp());
        
        System.out.println("\n=== Quick Start Complete ===");
    }
}