package com.glassbox.sdk.dsl.ast;

/**
 * Visitor interface for AST nodes.
 * 
 * Implements the visitor pattern for AST traversal and processing.
 */
public interface ASTVisitor<T> {
    
    T visit(RootNode node);
    T visit(ConditionNode node);
    T visit(ConsequenceNode node);
}