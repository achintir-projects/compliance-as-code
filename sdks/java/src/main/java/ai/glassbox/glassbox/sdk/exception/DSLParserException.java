package com.glassbox.sdk.exception;

/**
 * Exception thrown when DSL parsing fails.
 */
public class DSLParserException extends GlassBoxException {
    
    private final int lineNumber;
    private final int columnNumber;
    private final String dslText;

    /**
     * Constructor with message and position
     */
    public DSLParserException(String message, int lineNumber, int columnNumber) {
        super(message, "DSL_PARSER_ERROR");
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
        this.dslText = null;
    }

    /**
     * Constructor with message, position, and DSL text
     */
    public DSLParserException(String message, int lineNumber, int columnNumber, String dslText) {
        super(message, "DSL_PARSER_ERROR", dslText);
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
        this.dslText = dslText;
    }

    /**
     * Constructor with message, cause, and position
     */
    public DSLParserException(String message, Throwable cause, int lineNumber, int columnNumber) {
        super(message, cause, "DSL_PARSER_ERROR", null);
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
        this.dslText = null;
    }

    /**
     * Constructor with message, cause, position, and DSL text
     */
    public DSLParserException(String message, Throwable cause, int lineNumber, int columnNumber, String dslText) {
        super(message, cause, "DSL_PARSER_ERROR", dslText);
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
        this.dslText = dslText;
    }

    // Getters
    public int getLineNumber() {
        return lineNumber;
    }

    public int getColumnNumber() {
        return columnNumber;
    }

    public String getDslText() {
        return dslText;
    }

    /**
     * Get formatted error message with position
     */
    public String getFormattedMessage() {
        return String.format("%s at line %d, column %d", getMessage(), lineNumber, columnNumber);
    }

    @Override
    public String toString() {
        return "DSLParserException{" +
                "errorCode='" + getErrorCode() + '\'' +
                ", message='" + getMessage() + '\'' +
                ", lineNumber=" + lineNumber +
                ", columnNumber=" + columnNumber +
                ", dslText='" + (dslText != null ? dslText.substring(0, Math.min(50, dslText.length())) + "..." : "null") + '\'' +
                '}';
    }
}