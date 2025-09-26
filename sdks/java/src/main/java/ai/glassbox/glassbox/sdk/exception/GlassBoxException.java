package com.glassbox.sdk.exception;

/**
 * Base exception class for all GlassBox SDK exceptions.
 */
public class GlassBoxException extends RuntimeException {
    
    private final String errorCode;
    private final Object details;

    /**
     * Constructor with message
     */
    public GlassBoxException(String message) {
        super(message);
        this.errorCode = "GLASSBOX_ERROR";
        this.details = null;
    }

    /**
     * Constructor with message and cause
     */
    public GlassBoxException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "GLASSBOX_ERROR";
        this.details = null;
    }

    /**
     * Constructor with message and error code
     */
    public GlassBoxException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.details = null;
    }

    /**
     * Constructor with message, error code, and details
     */
    public GlassBoxException(String message, String errorCode, Object details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details;
    }

    /**
     * Constructor with message, cause, error code, and details
     */
    public GlassBoxException(String message, Throwable cause, String errorCode, Object details) {
        super(message, cause);
        this.errorCode = errorCode;
        this.details = details;
    }

    // Getters
    public String getErrorCode() {
        return errorCode;
    }

    public Object getDetails() {
        return details;
    }

    @Override
    public String toString() {
        return "GlassBoxException{" +
                "errorCode='" + errorCode + '\'' +
                ", message='" + getMessage() + '\'' +
                ", details=" + details +
                ", cause=" + getCause() +
                '}';
    }
}