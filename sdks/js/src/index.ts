/**
 * GlassBox JavaScript/TypeScript SDK v1.0
 * 
 * A comprehensive JavaScript/TypeScript SDK for working with GlassBox DecisionBundles and Compliance DSL.
 * This SDK provides tools for creating, parsing, validating, and executing compliance rules
 * and decisions according to the GlassBox Standard v1.0.
 * 
 * @author GlassBox Compliance Team
 * @version 1.0.0
 * @license MIT
 */

// Exceptions
export * from './exceptions';

// Core modules
export { DecisionBundle, DecisionBundleBuilder } from './decision-bundle';
export { DSLParser } from './dsl-parser';
export { DSLEvaluator } from './dsl-evaluator';

// Version info
export const SDK_VERSION = '1.0.0';
export const SDK_AUTHOR = 'GlassBox Compliance Team';

// Re-export commonly used types and interfaces
export type {
  EvaluationResult
} from './dsl-evaluator';