package com.glassbox.sdk.exception;

import java.util.List;

/**
 * Exception thrown when validation fails.
 */
public class ValidationException extends GlassBoxException {
    
    private final List<String> validationErrors;

    /**
     * Constructor with message and validation errors
     */
    public ValidationException(String message, List<String> validationErrors) {
        super(message, "VALIDATION_ERROR", validationErrors);
        this.validationErrors = validationErrors;
    }

    /**
     * Constructor with message, cause, and validation errors
     */
    public ValidationException(String message, Throwable cause, List<String> validationErrors) {
        super(message, cause, "VALIDATION_ERROR", validationErrors);
        this.validationErrors = validationErrors;
    }

    // Getters
    public List<String> getValidationErrors() {
        return validationErrors;
    }

    /**
     * Get formatted error message
     */
    public String getFormattedErrors() {
        if (validationErrors == null || validationErrors.isEmpty()) {
            return getMessage();
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append(getMessage()).append(":\n");
        for (String error : validationErrors) {
            sb.append("  - ").append(error).append("\n");
        }
        return sb.toString();
    }

    @Override
    public String toString() {
        return "ValidationException{" +
                "errorCode='" + getErrorCode() + '\'' +
                ", message='" + getMessage() + '\'' +
                ", validationErrors=" + validationErrors +
                '}';
    }
}