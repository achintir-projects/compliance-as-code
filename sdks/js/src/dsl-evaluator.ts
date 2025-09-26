/**
 * GlassBox DSL Evaluator Module
 * 
 * This module provides classes for evaluating GlassBox Compliance DSL ASTs.
 */

/**
 * Evaluation result interface
 */
interface EvaluationResult {
  result: boolean;
  reason: string;
  details?: any;
  confidence?: number;
  error?: string;
}

/**
 * Evaluator for GlassBox Compliance DSL ASTs.
 * 
 * This evaluator takes parsed DSL ASTs and evaluates them against provided context data.
 */
export class DSLEvaluator {
  private functions: Map<string, () => any> = new Map();

  /**
   * Initialize the DSL evaluator.
   */
  constructor() {
    // Built-in functions
    this.functions.set('NOW', () => new Date().toISOString());
    this.functions.set('TODAY', () => new Date().toISOString().split('T')[0]);
  }

  /**
   * Evaluate a DSL AST against context data.
   * @param ast - The parsed DSL AST
   * @param context - Dictionary containing context data
   * @returns Evaluation result with outcome and details
   */
  evaluate(ast: any, context: Record<string, any>): EvaluationResult {
    try {
      if (ast.type === 'rule') {
        const conditionResult = this.evaluateCondition(ast.condition, context);

        if (!conditionResult.result) {
          return {
            result: true, // Rule doesn't apply
            reason: 'Condition not met',
            details: conditionResult
          };
        }

        if (ast.consequence) {
          const consequenceResult = this.evaluateConsequence(ast.consequence, context);
          return {
            result: consequenceResult.result,
            reason: consequenceResult.reason || 'Consequence evaluated',
            details: {
              condition: conditionResult,
              consequence: consequenceResult
            }
          };
        } else if (ast.action) {
          const actionResult = this.evaluateAction(ast.action, context);
          return {
            result: true, // Actions are always executed when condition is met
            reason: `Action executed: ${actionResult.action_type}`,
            details: {
              condition: conditionResult,
              action: actionResult
            }
          };
        }
      }

      return {
        result: false,
        reason: 'Invalid AST structure'
      };

    } catch (error) {
      return {
        result: false,
        reason: `Evaluation error: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Evaluate a condition.
   * @param condition - The condition to evaluate
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateCondition(condition: any, context: Record<string, any>): EvaluationResult {
    switch (condition.type) {
      case 'simple_condition':
        return this.evaluateSimpleCondition(condition, context);
      case 'list_condition':
        return this.evaluateListCondition(condition, context);
      case 'pattern_condition':
        return this.evaluatePatternCondition(condition, context);
      case 'temporal_condition':
        return this.evaluateTemporalCondition(condition, context);
      case 'compound_condition':
        return this.evaluateCompoundCondition(condition, context);
      case 'not_condition':
        return this.evaluateNotCondition(condition, context);
      case 'variable_condition':
        return this.evaluateVariableCondition(condition, context);
      default:
        throw new Error(`Unknown condition type: ${condition.type}`);
    }
  }

  /**
   * Evaluate a simple condition.
   * @param condition - The simple condition
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateSimpleCondition(condition: any, context: Record<string, any>): EvaluationResult {
    const leftValue = this.getValue(condition.left, context);
    const rightValue = this.getValue(condition.right, context);
    const operator = condition.operator;

    const result = this.applyOperator(leftValue, operator, rightValue);

    return {
      result,
      left: leftValue,
      operator,
      right: rightValue
    };
  }

  /**
   * Evaluate a list condition.
   * @param condition - The list condition
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateListCondition(condition: any, context: Record<string, any>): EvaluationResult {
    const variableValue = this.getValue(condition.variable, context);
    const listValues = condition.values.map((v: any) => this.getValue(v, context));

    const result = listValues.includes(variableValue);

    return {
      result,
      variable: variableValue,
      list: listValues
    };
  }

  /**
   * Evaluate a pattern condition.
   * @param condition - The pattern condition
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluatePatternCondition(condition: any, context: Record<string, any>): EvaluationResult {
    const variableValue = String(this.getValue(condition.variable, context));
    const pattern = String(this.getValue(condition.pattern, context));
    const operator = condition.operator;

    let result = false;
    if (operator === 'CONTAINS') {
      result = pattern.includes(variableValue);
    } else if (operator === 'MATCHES') {
      // Simple regex matching
      try {
        const regex = new RegExp(pattern);
        result = regex.test(variableValue);
      } catch {
        result = false;
      }
    }

    return {
      result,
      variable: variableValue,
      pattern,
      operator
    };
  }

  /**
   * Evaluate a temporal condition.
   * @param condition - The temporal condition
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateTemporalCondition(condition: any, context: Record<string, any>): EvaluationResult {
    const variableValue = this.getValue(condition.variable, context);
    const value = this.getValue(condition.value, context);
    const operator = condition.operator;

    // Convert to Date if needed
    let variableDate: Date;
    let valueDate: Date | number;

    if (typeof variableValue === 'string') {
      variableDate = new Date(variableValue);
    } else {
      variableDate = new Date(variableValue);
    }

    if (typeof value === 'string') {
      valueDate = new Date(value);
    } else {
      valueDate = value;
    }

    let result = false;

    if (operator === 'BEFORE') {
      result = variableDate < valueDate;
    } else if (operator === 'AFTER') {
      result = variableDate > valueDate;
    } else if (operator === 'WITHIN') {
      // value should be a duration in seconds
      if (typeof value === 'number') {
        const now = new Date();
        const diff = now.getTime() - variableDate.getTime();
        result = diff <= value * 1000;
      }
    } else if (operator === 'EXPIRES') {
      // value should be a duration in seconds
      if (typeof value === 'number') {
        const now = new Date();
        const expiryTime = variableDate.getTime() + value * 1000;
        result = now.getTime() < expiryTime;
      }
    }

    return {
      result,
      variable: variableValue,
      operator,
      value
    };
  }

  /**
   * Evaluate a compound condition.
   * @param condition - The compound condition
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateCompoundCondition(condition: any, context: Record<string, any>): EvaluationResult {
    const leftResult = this.evaluateCondition(condition.left, context);
    const rightResult = this.evaluateCondition(condition.right, context);
    const operator = condition.operator;

    let result = false;
    if (operator === 'AND') {
      result = leftResult.result && rightResult.result;
    } else if (operator === 'OR') {
      result = leftResult.result || rightResult.result;
    }

    return {
      result,
      left: leftResult,
      right: rightResult,
      operator
    };
  }

  /**
   * Evaluate a NOT condition.
   * @param condition - The NOT condition
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateNotCondition(condition: any, context: Record<string, any>): EvaluationResult {
    const innerResult = this.evaluateCondition(condition.condition, context);
    const result = !innerResult.result;

    return {
      result,
      inner: innerResult
    };
  }

  /**
   * Evaluate a variable condition.
   * @param condition - The variable condition
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateVariableCondition(condition: any, context: Record<string, any>): EvaluationResult {
    const variableValue = this.getValue(condition.variable, context);
    const result = Boolean(variableValue);

    return {
      result,
      variable: variableValue
    };
  }

  /**
   * Evaluate a consequence.
   * @param consequence - The consequence to evaluate
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateConsequence(consequence: any, context: Record<string, any>): EvaluationResult {
    switch (consequence.type) {
      case 'constraint':
        return this.evaluateConstraint(consequence, context);
      case 'in_constraint':
        return this.evaluateInConstraint(consequence, context);
      case 'not_in_constraint':
        return this.evaluateNotInConstraint(consequence, context);
      case 'between_constraint':
        return this.evaluateBetweenConstraint(consequence, context);
      case 'requirement':
        return this.evaluateRequirement(consequence, context);
      case 'boolean_expression':
        return this.evaluateBooleanExpression(consequence, context);
      case 'boolean_literal':
        return {
          result: consequence.value,
          reason: 'Boolean literal'
        };
      case 'variable_expression':
        const value = this.getValue(consequence.variable, context);
        return {
          result: Boolean(value),
          reason: `Variable expression: ${value}`
        };
      default:
        throw new Error(`Unknown consequence type: ${consequence.type}`);
    }
  }

  /**
   * Evaluate a constraint.
   * @param constraint - The constraint to evaluate
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateConstraint(constraint: any, context: Record<string, any>): EvaluationResult {
    const variableValue = this.getValue(constraint.variable, context);
    const value = this.getValue(constraint.value, context);
    const operator = constraint.operator;

    const result = this.applyOperator(variableValue, operator, value);

    return {
      result,
      variable: variableValue,
      operator,
      value
    };
  }

  /**
   * Evaluate an IN constraint.
   * @param constraint - The IN constraint to evaluate
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateInConstraint(constraint: any, context: Record<string, any>): EvaluationResult {
    const variableValue = this.getValue(constraint.variable, context);
    const listValues = constraint.values.map((v: any) => this.getValue(v, context));

    const result = listValues.includes(variableValue);

    return {
      result,
      variable: variableValue,
      list: listValues
    };
  }

  /**
   * Evaluate a NOT IN constraint.
   * @param constraint - The NOT IN constraint to evaluate
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateNotInConstraint(constraint: any, context: Record<string, any>): EvaluationResult {
    const variableValue = this.getValue(constraint.variable, context);
    const listValues = constraint.values.map((v: any) => this.getValue(v, context));

    const result = !listValues.includes(variableValue);

    return {
      result,
      variable: variableValue,
      list: listValues
    };
  }

  /**
   * Evaluate a BETWEEN constraint.
   * @param constraint - The BETWEEN constraint to evaluate
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateBetweenConstraint(constraint: any, context: Record<string, any>): EvaluationResult {
    const variableValue = this.getValue(constraint.variable, context);
    const lower = this.getValue(constraint.lower, context);
    const upper = this.getValue(constraint.upper, context);

    const result = lower <= variableValue && variableValue <= upper;

    return {
      result,
      variable: variableValue,
      lower,
      upper
    };
  }

  /**
   * Evaluate a requirement.
   * @param requirement - The requirement to evaluate
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateRequirement(requirement: any, context: Record<string, any>): EvaluationResult {
    const variableValue = this.getValue(requirement.variable, context);
    const result = Boolean(variableValue);

    return {
      result,
      variable: variableValue,
      requirement: requirement.keyword
    };
  }

  /**
   * Evaluate a boolean expression.
   * @param expression - The boolean expression to evaluate
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateBooleanExpression(expression: any, context: Record<string, any>): EvaluationResult {
    if (expression.type === 'not_expression') {
      const innerResult = this.evaluateBooleanExpression(expression.expression, context);
      const result = !innerResult.result;
      return {
        result,
        inner: innerResult
      };
    } else if (expression.left && expression.right) {
      const leftResult = this.evaluateBooleanExpression(expression.left, context);
      const rightResult = this.evaluateBooleanExpression(expression.right, context);
      const operator = expression.operator;

      let result = false;
      if (operator === 'AND') {
        result = leftResult.result && rightResult.result;
      } else if (operator === 'OR') {
        result = leftResult.result || rightResult.result;
      }

      return {
        result,
        left: leftResult,
        right: rightResult,
        operator
      };
    } else {
      // Simple boolean value or variable
      if ('value' in expression) {
        return {
          result: expression.value,
          reason: 'Boolean literal'
        };
      } else {
        const value = this.getValue(expression.variable, context);
        return {
          result: Boolean(value),
          reason: `Variable expression: ${value}`
        };
      }
    }
  }

  /**
   * Evaluate an action.
   * @param action - The action to evaluate
   * @param context - The context data
   * @returns Evaluation result
   */
  private evaluateAction(action: any, context: Record<string, any>): EvaluationResult {
    const variableValue = this.getValue(action.variable, context);

    return {
      action_type: action.action_type,
      variable: variableValue,
      executed: true
    };
  }

  /**
   * Get the value of a node from context.
   * @param node - The node to evaluate
   * @param context - The context data
   * @returns The evaluated value
   */
  private getValue(node: any, context: Record<string, any>): any {
    switch (node.type) {
      case 'variable':
        return this.getVariableValue(node.name, context);
      case 'string_value':
        return node.value;
      case 'number_value':
        return node.value;
      case 'boolean_value':
        return node.value;
      case 'datetime_value':
        return node.value;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Get a variable value from context using dot notation.
   * @param variableName - The variable name
   * @param context - The context data
   * @returns The variable value
   */
  private getVariableValue(variableName: string, context: Record<string, any>): any {
    const parts = variableName.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * Apply an operator to left and right values.
   * @param left - The left value
   * @param operator - The operator
   * @param right - The right value
   * @returns The result of the operation
   */
  private applyOperator(left: any, operator: string, right: any): boolean {
    try {
      switch (operator) {
        case '=':
          return left == right;
        case '!=':
          return left != right;
        case '>':
          return left > right;
        case '>=':
          return left >= right;
        case '<':
          return left < right;
        case '<=':
          return left <= right;
        case 'LIKE':
          // Simple pattern matching
          const pattern = String(right).replace(/%/g, '.*').replace(/_/g, '.');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(String(left));
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}