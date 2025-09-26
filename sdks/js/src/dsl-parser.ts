/**
 * GlassBox DSL Parser Module
 * 
 * This module provides classes for parsing and evaluating GlassBox Compliance DSL rules
 * according to the GlassBox Standard v1.0 specification.
 */

import { DSLParserError } from './exceptions';

/**
 * Token interface for the DSL parser
 */
interface Token {
  type: string;
  value: string;
  position: number;
}

/**
 * AST Node interface for parsed DSL rules
 */
interface ASTNode {
  type: string;
  [key: string]: any;
}

/**
 * Parser for GlassBox Compliance DSL rules.
 * 
 * This parser implements the BNF grammar defined in the GlassBox Standard v1.0
 * and can parse DSL rules into abstract syntax trees (ASTs).
 */
export class DSLParser {
  private static readonly KEYWORDS = new Set([
    'WHEN', 'IF', 'THEN', 'MUST', 'SHOULD', 'DO', 'AND', 'OR', 'NOT',
    'IN', 'CONTAINS', 'MATCHES', 'BEFORE', 'AFTER', 'WITHIN', 'EXPIRES',
    'BETWEEN', 'REQUIRE', 'ENSURE', 'VALIDATE', 'FLAG', 'ALERT', 'BLOCK',
    'ALLOW', 'LOG', 'NOTIFY', 'TRUE', 'FALSE'
  ]);

  private static readonly OPERATORS = new Set(['=', '!=', '>', '>=', '<', '<=', 'LIKE']);

  private static readonly TIME_UNITS = new Set([
    'SECOND', 'SECONDS', 'MINUTE', 'MINUTES', 'HOUR', 'HOURS',
    'DAY', 'DAYS', 'WEEK', 'WEEKS', 'MONTH', 'MONTHS', 'YEAR', 'YEARS'
  ]);

  private tokens: Token[] = [];
  private currentToken: Token | null = null;
  private tokenIndex = 0;

  /**
   * Parse a DSL rule into an AST.
   * @param dslText - The DSL rule text to parse
   * @returns Dictionary representing the AST
   * @throws DSLParserError - If parsing fails
   */
  parse(dslText: string): ASTNode {
    // Preprocess the text
    dslText = dslText.trim();
    if (!dslText) {
      throw new DSLParserError('Empty DSL rule');
    }

    // Tokenize
    this.tokens = this.tokenize(dslText);
    this.tokenIndex = 0;
    this.currentToken = this.tokens[0] || null;

    // Parse the rule
    try {
      const ast = this.parseRule();

      // Ensure we've consumed all tokens
      if (this.currentToken !== null) {
        throw new DSLParserError(`Unexpected token: ${this.currentToken.value}`);
      }

      return ast;
    } catch (error) {
      if (error instanceof DSLParserError) {
        throw error;
      }
      throw new DSLParserError('Unexpected end of input');
    }
  }

  /**
   * Tokenize the DSL text.
   * @param text - The text to tokenize
   * @returns Array of tokens
   */
  private tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;

    while (pos < text.length) {
      const char = text[pos];

      // Skip whitespace
      if (char.trim() === '') {
        pos++;
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        const number = this.parseNumber(text, pos);
        tokens.push(number);
        pos += number.value.length;
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        const str = this.parseString(text, pos);
        tokens.push(str);
        pos += str.value.length;
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        const identifier = this.parseIdentifier(text, pos);
        tokens.push(identifier);
        pos += identifier.value.length;
        continue;
      }

      // Operators
      if ('=!><'.includes(char)) {
        const op = this.parseOperator(text, pos);
        tokens.push(op);
        pos += op.value.length;
        continue;
      }

      // Special characters
      if ('()[].,@'.includes(char)) {
        tokens.push({
          type: 'symbol',
          value: char,
          position: pos
        });
        pos++;
        continue;
      }

      // Unknown character
      throw new DSLParserError(`Unknown character: ${char}`, 1, pos + 1);
    }

    return tokens;
  }

  /**
   * Parse a number token.
   * @param text - The text to parse from
   * @param pos - The starting position
   * @returns Number token
   */
  private parseNumber(text: string, pos: number): Token {
    const start = pos;

    // Parse integer part
    while (pos < text.length && /\d/.test(text[pos])) {
      pos++;
    }

    // Parse decimal part
    if (pos < text.length && text[pos] === '.') {
      pos++;
      while (pos < text.length && /\d/.test(text[pos])) {
        pos++;
      }
    }

    // Parse exponent
    if (pos < text.length && /[eE]/.test(text[pos])) {
      pos++;
      if (pos < text.length && /[+-]/.test(text[pos])) {
        pos++;
      }
      while (pos < text.length && /\d/.test(text[pos])) {
        pos++;
      }
    }

    const value = text.slice(start, pos);

    return {
      type: 'number',
      value,
      position: start
    };
  }

  /**
   * Parse a string token.
   * @param text - The text to parse from
   * @param pos - The starting position
   * @returns String token
   */
  private parseString(text: string, pos: number): Token {
    const quoteChar = text[pos];
    const start = pos;
    pos++;

    while (pos < text.length && text[pos] !== quoteChar) {
      if (text[pos] === '\\') {
        pos += 2;
      } else {
        pos++;
      }
    }

    if (pos >= text.length) {
      throw new DSLParserError('Unterminated string', 1, start + 1);
    }

    pos++; // Include closing quote

    return {
      type: 'string',
      value: text.slice(start, pos),
      position: start
    };
  }

  /**
   * Parse an identifier or keyword token.
   * @param text - The text to parse from
   * @param pos - The starting position
   * @returns Identifier or keyword token
   */
  private parseIdentifier(text: string, pos: number): Token {
    const start = pos;

    while (pos < text.length && (/[a-zA-Z0-9_]/.test(text[pos]))) {
      pos++;
    }

    const value = text.slice(start, pos);

    // Check if it's a keyword
    if (DSLParser.KEYWORDS.has(value.toUpperCase())) {
      return {
        type: 'keyword',
        value: value.toUpperCase(),
        position: start
      };
    } else if (DSLParser.TIME_UNITS.has(value.toUpperCase())) {
      return {
        type: 'time_unit',
        value: value.toUpperCase(),
        position: start
      };
    } else {
      return {
        type: 'identifier',
        value,
        position: start
      };
    }
  }

  /**
   * Parse an operator token.
   * @param text - The text to parse from
   * @param pos - The starting position
   * @returns Operator token
   */
  private parseOperator(text: string, pos: number): Token {
    const start = pos;

    // Try to match 2-character operators first
    if (pos + 1 < text.length) {
      const twoChar = text.slice(pos, pos + 2);
      if (DSLParser.OPERATORS.has(twoChar)) {
        return {
          type: 'operator',
          value: twoChar,
          position: start
        };
      }
    }

    // Try 1-character operators
    if (DSLParser.OPERATORS.has(text[pos])) {
      return {
        type: 'operator',
        value: text[pos],
        position: start
      };
    }

    throw new DSLParserError(`Unknown operator: ${text[pos]}`, 1, pos + 1);
  }

  /**
   * Advance to the next token.
   */
  private advance(): void {
    this.tokenIndex++;
    if (this.tokenIndex < this.tokens.length) {
      this.currentToken = this.tokens[this.tokenIndex];
    } else {
      this.currentToken = null;
    }
  }

  /**
   * Expect a specific token type and optionally value.
   * @param tokenType - The expected token type
   * @param value - The expected token value (optional)
   * @returns The expected token
   * @throws DSLParserError - If the expected token is not found
   */
  private expect(tokenType: string, value?: string): Token {
    if (this.currentToken === null) {
      throw new DSLParserError(`Expected ${tokenType}, got end of input`);
    }

    if (this.currentToken.type !== tokenType) {
      throw new DSLParserError(`Expected ${tokenType}, got ${this.currentToken.type}`);
    }

    if (value !== undefined && this.currentToken.value.toUpperCase() !== value.toUpperCase()) {
      throw new DSLParserError(`Expected ${value}, got ${this.currentToken.value}`);
    }

    const token = this.currentToken;
    this.advance();
    return token;
  }

  /**
   * Parse a complete rule.
   * @returns Rule AST node
   */
  private parseRule(): ASTNode {
    // Parse condition clause
    const condition = this.parseConditionClause();

    // Parse consequence or action clause
    if (this.currentToken && this.currentToken.type === 'keyword') {
      if (['THEN', 'MUST', 'SHOULD'].includes(this.currentToken.value)) {
        const consequence = this.parseConsequenceClause();
        return {
          type: 'rule',
          condition,
          consequence
        };
      } else if (this.currentToken.value === 'DO') {
        const action = this.parseActionClause();
        return {
          type: 'rule',
          condition,
          action
        };
      }
    }

    throw new DSLParserError('Expected consequence or action clause');
  }

  /**
   * Parse a condition clause.
   * @returns Condition AST node
   */
  private parseConditionClause(): ASTNode {
    if (this.currentToken && ['WHEN', 'IF'].includes(this.currentToken.value)) {
      this.advance();
      return this.parseCondition();
    } else {
      throw new DSLParserError('Expected WHEN or IF');
    }
  }

  /**
   * Parse a condition.
   * @returns Condition AST node
   */
  private parseCondition(): ASTNode {
    // Try different condition types
    if (this.currentToken && this.currentToken.value === 'NOT') {
      return this.parseCompoundCondition();
    } else if (this.currentToken && this.currentToken.value === '(') {
      return this.parseCompoundCondition();
    } else {
      // Check if it's a temporal condition
      if (this.isTemporalCondition()) {
        return this.parseTemporalCondition();
      } else {
        // Simple condition
        const left = this.parseVariable();

        if (this.currentToken && this.currentToken.type === 'operator') {
          return this.parseSimpleCondition(left);
        } else if (this.currentToken && this.currentToken.value === 'IN') {
          return this.parseListCondition(left);
        } else if (this.currentToken && ['CONTAINS', 'MATCHES'].includes(this.currentToken.value)) {
          return this.parsePatternCondition(left);
        } else {
          // Variable as boolean condition
          return {
            type: 'variable_condition',
            variable: left
          };
        }
      }
    }
  }

  /**
   * Check if the current position looks like a temporal condition.
   * @returns True if it looks like a temporal condition
   */
  private isTemporalCondition(): boolean {
    if (!this.currentToken || this.currentToken.type !== 'identifier') {
      return false;
    }

    // Look ahead for temporal keywords
    for (let i = this.tokenIndex; i < Math.min(this.tokenIndex + 3, this.tokens.length); i++) {
      const token = this.tokens[i];
      if (token.type === 'keyword' && ['BEFORE', 'AFTER', 'WITHIN', 'EXPIRES'].includes(token.value)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parse a simple condition.
   * @param left - The left side of the condition
   * @returns Simple condition AST node
   */
  private parseSimpleCondition(left: ASTNode): ASTNode {
    const operator = this.expect('operator');
    const right = this.parseValue();

    return {
      type: 'simple_condition',
      left,
      operator: operator.value,
      right
    };
  }

  /**
   * Parse a list condition (IN operator).
   * @param left - The variable to check
   * @returns List condition AST node
   */
  private parseListCondition(left: ASTNode): ASTNode {
    this.expect('keyword', 'IN');
    const values = this.parseList();

    return {
      type: 'list_condition',
      variable: left,
      values
    };
  }

  /**
   * Parse a pattern condition (CONTAINS or MATCHES).
   * @param left - The variable to check
   * @returns Pattern condition AST node
   */
  private parsePatternCondition(left: ASTNode): ASTNode {
    const operator = this.expect('keyword');
    const pattern = this.parseValue();

    return {
      type: 'pattern_condition',
      variable: left,
      operator: operator.value,
      pattern
    };
  }

  /**
   * Parse a temporal condition.
   * @returns Temporal condition AST node
   */
  private parseTemporalCondition(): ASTNode {
    const variable = this.parseVariable();
    const operator = this.expect('keyword');

    if (operator.value === 'EXPIRES') {
      this.expect('keyword', 'AFTER');
    }

    const value = this.parseValue();

    return {
      type: 'temporal_condition',
      variable,
      operator: operator.value,
      value
    };
  }

  /**
   * Parse a compound condition.
   * @returns Compound condition AST node
   */
  private parseCompoundCondition(): ASTNode {
    if (this.currentToken && this.currentToken.value === 'NOT') {
      this.advance();
      const condition = this.parseCondition();
      return {
        type: 'not_condition',
        condition
      };
    } else if (this.currentToken && this.currentToken.value === '(') {
      this.advance();
      const condition = this.parseCondition();
      this.expect('symbol', ')');
      return condition;
    } else {
      const left = this.parseCondition();

      if (this.currentToken && ['AND', 'OR'].includes(this.currentToken.value)) {
        const operator = this.expect('keyword');
        const right = this.parseCondition();

        return {
          type: 'compound_condition',
          left,
          operator: operator.value,
          right
        };
      } else {
        return left;
      }
    }
  }

  /**
   * Parse a consequence clause.
   * @returns Consequence AST node
   */
  private parseConsequenceClause(): ASTNode {
    if (this.currentToken && this.currentToken.value === 'THEN') {
      this.advance();

      // Check for MUST or SHOULD
      if (this.currentToken && ['MUST', 'SHOULD'].includes(this.currentToken.value)) {
        this.advance();
      }

      return this.parseConsequence();
    } else {
      throw new DSLParserError('Expected THEN');
    }
  }

  /**
   * Parse an action clause.
   * @returns Action AST node
   */
  private parseActionClause(): ASTNode {
    if (this.currentToken && this.currentToken.value === 'THEN') {
      this.advance();
      this.expect('keyword', 'DO');
      return this.parseAction();
    } else {
      throw new DSLParserError('Expected THEN DO');
    }
  }

  /**
   * Parse a consequence.
   * @returns Consequence AST node
   */
  private parseConsequence(): ASTNode {
    if (this.currentToken && ['REQUIRE', 'ENSURE', 'VALIDATE'].includes(this.currentToken.value)) {
      return this.parseRequirement();
    } else {
      // Try to parse as constraint or boolean expression
      if (this.isConstraint()) {
        return this.parseConstraint();
      } else {
        return this.parseBooleanExpression();
      }
    }
  }

  /**
   * Check if the current position looks like a constraint.
   * @returns True if it looks like a constraint
   */
  private isConstraint(): boolean {
    if (!this.currentToken || this.currentToken.type !== 'identifier') {
      return false;
    }

    // Look ahead for operators or BETWEEN/IN
    for (let i = this.tokenIndex + 1; i < Math.min(this.tokenIndex + 3, this.tokens.length); i++) {
      const token = this.tokens[i];
      if (token.type === 'operator' || ['IN', 'BETWEEN'].includes(token.value)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parse a constraint.
   * @returns Constraint AST node
   */
  private parseConstraint(): ASTNode {
    const variable = this.parseVariable();

    if (this.currentToken && this.currentToken.value === 'IN') {
      this.advance();
      if (this.currentToken && this.currentToken.value === 'NOT') {
        this.advance();
        const values = this.parseList();
        return {
          type: 'not_in_constraint',
          variable,
          values
        };
      } else {
        const values = this.parseList();
        return {
          type: 'in_constraint',
          variable,
          values
        };
      }
    } else if (this.currentToken && this.currentToken.value === 'BETWEEN') {
      this.advance();
      const lower = this.parseValue();
      this.expect('keyword', 'AND');
      const upper = this.parseValue();
      return {
        type: 'between_constraint',
        variable,
        lower,
        upper
      };
    } else {
      const operator = this.expect('operator');
      const value = this.parseValue();
      return {
        type: 'constraint',
        variable,
        operator: operator.value,
        value
      };
    }
  }

  /**
   * Parse a requirement.
   * @returns Requirement AST node
   */
  private parseRequirement(): ASTNode {
    const keyword = this.expect('keyword');
    const variable = this.parseVariable();

    return {
      type: 'requirement',
      keyword: keyword.value,
      variable
    };
  }

  /**
   * Parse a boolean expression.
   * @returns Boolean expression AST node
   */
  private parseBooleanExpression(): ASTNode {
    if (this.currentToken && ['TRUE', 'FALSE'].includes(this.currentToken.value)) {
      const value = this.expect('keyword');
      return {
        type: 'boolean_literal',
        value: value.value === 'TRUE'
      };
    } else if (this.currentToken && this.currentToken.type === 'identifier') {
      const variable = this.parseVariable();
      return {
        type: 'variable_expression',
        variable
      };
    } else if (this.currentToken && this.currentToken.value === 'NOT') {
      this.advance();
      const expression = this.parseBooleanExpression();
      return {
        type: 'not_expression',
        expression
      };
    } else {
      const left = this.parseBooleanExpression();

      if (this.currentToken && ['AND', 'OR'].includes(this.currentToken.value)) {
        const operator = this.expect('keyword');
        const right = this.parseBooleanExpression();

        return {
          type: 'boolean_expression',
          left,
          operator: operator.value,
          right
        };
      } else {
        return left;
      }
    }
  }

  /**
   * Parse an action.
   * @returns Action AST node
   */
  private parseAction(): ASTNode {
    const actionType = this.expect('keyword');
    const variable = this.parseVariable();

    return {
      type: 'action',
      action_type: actionType.value,
      variable
    };
  }

  /**
   * Parse a variable.
   * @returns Variable AST node
   */
  private parseVariable(): ASTNode {
    const parts: string[] = [];

    while (this.currentToken && this.currentToken.type === 'identifier') {
      parts.push(this.currentToken.value);
      this.advance();

      if (this.currentToken && this.currentToken.value === '.') {
        this.advance();
      } else {
        break;
      }
    }

    if (parts.length === 0) {
      throw new DSLParserError('Expected variable');
    }

    return {
      type: 'variable',
      name: parts.join('.')
    };
  }

  /**
   * Parse a value.
   * @returns Value AST node
   */
  private parseValue(): ASTNode {
    if (this.currentToken && this.currentToken.type === 'string') {
      const value = this.currentToken;
      this.advance();
      return {
        type: 'string_value',
        value: value.value.slice(1, -1) // Remove quotes
      };
    } else if (this.currentToken && this.currentToken.type === 'number') {
      const value = this.currentToken;
      this.advance();
      return {
        type: 'number_value',
        value: value.value.includes('.') ? parseFloat(value.value) : parseInt(value.value, 10)
      };
    } else if (this.currentToken && ['TRUE', 'FALSE'].includes(this.currentToken.value)) {
      const value = this.expect('keyword');
      return {
        type: 'boolean_value',
        value: value.value === 'TRUE'
      };
    } else if (this.currentToken && this.currentToken.type === 'identifier') {
      // Could be a variable or datetime
      if (this.looksLikeDatetime(this.currentToken.value)) {
        const value = this.currentToken;
        this.advance();
        return {
          type: 'datetime_value',
          value: value.value
        };
      } else {
        return this.parseVariable();
      }
    } else {
      throw new DSLParserError(`Expected value, got ${this.currentToken?.type || 'nothing'}`);
    }
  }

  /**
   * Check if a string looks like a datetime.
   * @param value - The string to check
   * @returns True if it looks like a datetime
   */
  private looksLikeDatetime(value: string): boolean {
    // Simple check for ISO format
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  }

  /**
   * Parse a list of values.
   * @returns Array of value AST nodes
   */
  private parseList(): ASTNode[] {
    this.expect('symbol', '[');
    const values: ASTNode[] = [];

    while (this.currentToken && this.currentToken.value !== ']') {
      const value = this.parseValue();
      values.push(value);

      if (this.currentToken && this.currentToken.value === ',') {
        this.advance();
      }
    }

    this.expect('symbol', ']');
    return values;
  }
}