"""
GlassBox DSL Parser Module

This module provides classes for parsing and evaluating GlassBox Compliance DSL rules
according to the GlassBox Standard v1.0 specification.
"""

import re
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Callable
from .exceptions import DSLParserException


class DSLParser:
    """
    Parser for GlassBox Compliance DSL rules.
    
    This parser implements the BNF grammar defined in the GlassBox Standard v1.0
    and can parse DSL rules into abstract syntax trees (ASTs).
    """
    
    # Reserved keywords
    KEYWORDS = {
        'WHEN', 'IF', 'THEN', 'MUST', 'SHOULD', 'DO', 'AND', 'OR', 'NOT',
        'IN', 'CONTAINS', 'MATCHES', 'BEFORE', 'AFTER', 'WITHIN', 'EXPIRES',
        'BETWEEN', 'REQUIRE', 'ENSURE', 'VALIDATE', 'FLAG', 'ALERT', 'BLOCK',
        'ALLOW', 'LOG', 'NOTIFY', 'TRUE', 'FALSE'
    }
    
    # Operators
    OPERATORS = {'=', '!=', '>', '>=', '<', '<=', 'LIKE'}
    
    # Time units
    TIME_UNITS = {
        'SECOND', 'SECONDS', 'MINUTE', 'MINUTES', 'HOUR', 'HOURS',
        'DAY', 'DAYS', 'WEEK', 'WEEKS', 'MONTH', 'MONTHS', 'YEAR', 'YEARS'
    }
    
    def __init__(self):
        """Initialize the DSL parser."""
        self.tokens = []
        self.current_token = None
        self.token_index = 0
    
    def parse(self, dsl_text: str) -> Dict[str, Any]:
        """
        Parse a DSL rule into an AST.
        
        Args:
            dsl_text: The DSL rule text to parse
            
        Returns:
            Dictionary representing the AST
            
        Raises:
            DSLParserException: If parsing fails
        """
        # Preprocess the text
        dsl_text = dsl_text.strip()
        if not dsl_text:
            raise DSLParserException("Empty DSL rule")
        
        # Tokenize
        self.tokens = self._tokenize(dsl_text)
        self.token_index = 0
        self.current_token = self.tokens[0] if self.tokens else None
        
        # Parse the rule
        try:
            ast = self._parse_rule()
            
            # Ensure we've consumed all tokens
            if self.current_token is not None:
                raise DSLParserException(f"Unexpected token: {self.current_token['value']}")
            
            return ast
        except IndexError:
            raise DSLParserException("Unexpected end of input")
    
    def _tokenize(self, text: str) -> List[Dict[str, Any]]:
        """Tokenize the DSL text."""
        tokens = []
        pos = 0
        
        while pos < len(text):
            char = text[pos]
            
            # Skip whitespace
            if char.isspace():
                pos += 1
                continue
            
            # Numbers
            if char.isdigit():
                number = self._parse_number(text, pos)
                tokens.append(number)
                pos += len(number['value'])
                continue
            
            # Strings
            if char in ('"', "'"):
                string = self._parse_string(text, pos)
                tokens.append(string)
                pos += len(string['value'])
                continue
            
            # Identifiers and keywords
            if char.isalpha() or char == '_':
                identifier = self._parse_identifier(text, pos)
                tokens.append(identifier)
                pos += len(identifier['value'])
                continue
            
            # Operators
            if char in ('=', '!', '>', '<'):
                operator = self._parse_operator(text, pos)
                tokens.append(operator)
                pos += len(operator['value'])
                continue
            
            # Special characters
            if char in ('(', ')', '[', ']', ',', '.', '@'):
                tokens.append({
                    'type': 'symbol',
                    'value': char,
                    'position': pos
                })
                pos += 1
                continue
            
            # Unknown character
            raise DSLParserException(f"Unknown character: {char}", line=1, column=pos + 1)
        
        return tokens
    
    def _parse_number(self, text: str, pos: int) -> Dict[str, Any]:
        """Parse a number token."""
        start = pos
        
        # Parse integer part
        while pos < len(text) and text[pos].isdigit():
            pos += 1
        
        # Parse decimal part
        if pos < len(text) and text[pos] == '.':
            pos += 1
            while pos < len(text) and text[pos].isdigit():
                pos += 1
        
        # Parse exponent
        if pos < len(text) and text[pos].lower() == 'e':
            pos += 1
            if pos < len(text) and text[pos] in ('+', '-'):
                pos += 1
            while pos < len(text) and text[pos].isdigit():
                pos += 1
        
        value = text[start:pos]
        
        return {
            'type': 'number',
            'value': value,
            'position': start
        }
    
    def _parse_string(self, text: str, pos: int) -> Dict[str, Any]:
        """Parse a string token."""
        quote_char = text[pos]
        start = pos
        pos += 1
        
        while pos < len(text) and text[pos] != quote_char:
            if text[pos] == '\\':
                pos += 2
            else:
                pos += 1
        
        if pos >= len(text):
            raise DSLParserException("Unterminated string", line=1, column=start + 1)
        
        pos += 1  # Include closing quote
        
        return {
            'type': 'string',
            'value': text[start:pos],
            'position': start
        }
    
    def _parse_identifier(self, text: str, pos: int) -> Dict[str, Any]:
        """Parse an identifier or keyword."""
        start = pos
        
        while pos < len(text) and (text[pos].isalnum() or text[pos] == '_'):
            pos += 1
        
        value = text[start:pos]
        
        # Check if it's a keyword
        if value.upper() in self.KEYWORDS:
            return {
                'type': 'keyword',
                'value': value.upper(),
                'position': start
            }
        elif value.upper() in self.TIME_UNITS:
            return {
                'type': 'time_unit',
                'value': value.upper(),
                'position': start
            }
        else:
            return {
                'type': 'identifier',
                'value': value,
                'position': start
            }
    
    def _parse_operator(self, text: str, pos: int) -> Dict[str, Any]:
        """Parse an operator token."""
        start = pos
        
        # Try to match 2-character operators first
        if pos + 1 < len(text):
            two_char = text[pos:pos + 2]
            if two_char in self.OPERATORS:
                return {
                    'type': 'operator',
                    'value': two_char,
                    'position': start
                }
        
        # Try 1-character operators
        if text[pos] in self.OPERATORS:
            return {
                'type': 'operator',
                'value': text[pos],
                'position': start
            }
        
        raise DSLParserException(f"Unknown operator: {text[pos]}", line=1, column=pos + 1)
    
    def _advance(self):
        """Advance to the next token."""
        self.token_index += 1
        if self.token_index < len(self.tokens):
            self.current_token = self.tokens[self.token_index]
        else:
            self.current_token = None
    
    def _expect(self, token_type: str, value: Optional[str] = None) -> Dict[str, Any]:
        """Expect a specific token type and optionally value."""
        if self.current_token is None:
            raise DSLParserException(f"Expected {token_type}, got end of input")
        
        if self.current_token['type'] != token_type:
            raise DSLParserException(f"Expected {token_type}, got {self.current_token['type']}")
        
        if value is not None and self.current_token['value'].upper() != value.upper():
            raise DSLParserException(f"Expected {value}, got {self.current_token['value']}")
        
        token = self.current_token
        self._advance()
        return token
    
    def _parse_rule(self) -> Dict[str, Any]:
        """Parse a complete rule."""
        # Parse condition clause
        condition = self._parse_condition_clause()
        
        # Parse consequence or action clause
        if self.current_token and self.current_token['type'] == 'keyword':
            if self.current_token['value'] in ['THEN', 'MUST', 'SHOULD']:
                consequence = self._parse_consequence_clause()
                return {
                    'type': 'rule',
                    'condition': condition,
                    'consequence': consequence
                }
            elif self.current_token['value'] == 'DO':
                action = self._parse_action_clause()
                return {
                    'type': 'rule',
                    'condition': condition,
                    'action': action
                }
        
        raise DSLParserException("Expected consequence or action clause")
    
    def _parse_condition_clause(self) -> Dict[str, Any]:
        """Parse a condition clause."""
        if self.current_token and self.current_token['value'] in ['WHEN', 'IF']:
            self._advance()
            return self._parse_condition()
        else:
            raise DSLParserException("Expected WHEN or IF")
    
    def _parse_condition(self) -> Dict[str, Any]:
        """Parse a condition."""
        # Try different condition types
        if self.current_token and self.current_token['value'] == 'NOT':
            return self._parse_compound_condition()
        elif self.current_token and self.current_token['value'] == '(':
            return self._parse_compound_condition()
        else:
            # Check if it's a temporal condition
            if self._is_temporal_condition():
                return self._parse_temporal_condition()
            else:
                # Simple condition
                left = self._parse_variable()
                
                if self.current_token and self.current_token['type'] == 'operator':
                    return self._parse_simple_condition(left)
                elif self.current_token and self.current_token['value'] == 'IN':
                    return self._parse_list_condition(left)
                elif self.current_token and self.current_token['value'] in ['CONTAINS', 'MATCHES']:
                    return self._parse_pattern_condition(left)
                else:
                    # Variable as boolean condition
                    return {
                        'type': 'variable_condition',
                        'variable': left
                    }
    
    def _is_temporal_condition(self) -> bool:
        """Check if the current position looks like a temporal condition."""
        if not self.current_token or self.current_token['type'] != 'identifier':
            return False
        
        # Look ahead for temporal keywords
        for i in range(self.token_index, min(self.token_index + 3, len(self.tokens))):
            token = self.tokens[i]
            if token['type'] == 'keyword' and token['value'] in ['BEFORE', 'AFTER', 'WITHIN', 'EXPIRES']:
                return True
        
        return False
    
    def _parse_simple_condition(self, left: Dict[str, Any]) -> Dict[str, Any]:
        """Parse a simple condition."""
        operator = self._expect('operator')
        right = self._parse_value()
        
        return {
            'type': 'simple_condition',
            'left': left,
            'operator': operator['value'],
            'right': right
        }
    
    def _parse_list_condition(self, left: Dict[str, Any]) -> Dict[str, Any]:
        """Parse a list condition (IN operator)."""
        self._expect('keyword', 'IN')
        values = self._parse_list()
        
        return {
            'type': 'list_condition',
            'variable': left,
            'values': values
        }
    
    def _parse_pattern_condition(self, left: Dict[str, Any]) -> Dict[str, Any]:
        """Parse a pattern condition (CONTAINS or MATCHES)."""
        operator = self._expect('keyword')
        pattern = self._parse_value()
        
        return {
            'type': 'pattern_condition',
            'variable': left,
            'operator': operator['value'],
            'pattern': pattern
        }
    
    def _parse_temporal_condition(self) -> Dict[str, Any]:
        """Parse a temporal condition."""
        variable = self._parse_variable()
        operator = self._expect('keyword')
        
        if operator['value'] == 'EXPIRES':
            self._expect('keyword', 'AFTER')
        
        value = self._parse_value()
        
        return {
            'type': 'temporal_condition',
            'variable': variable,
            'operator': operator['value'],
            'value': value
        }
    
    def _parse_compound_condition(self) -> Dict[str, Any]:
        """Parse a compound condition."""
        if self.current_token and self.current_token['value'] == 'NOT':
            self._advance()
            condition = self._parse_condition()
            return {
                'type': 'not_condition',
                'condition': condition
            }
        elif self.current_token and self.current_token['value'] == '(':
            self._advance()
            condition = self._parse_condition()
            self._expect('symbol', ')')
            return condition
        else:
            left = self._parse_condition()
            
            if self.current_token and self.current_token['value'] in ['AND', 'OR']:
                operator = self._expect('keyword')
                right = self._parse_condition()
                
                return {
                    'type': 'compound_condition',
                    'left': left,
                    'operator': operator['value'],
                    'right': right
                }
            else:
                return left
    
    def _parse_consequence_clause(self) -> Dict[str, Any]:
        """Parse a consequence clause."""
        if self.current_token and self.current_token['value'] == 'THEN':
            self._advance()
            
            # Check for MUST or SHOULD
            if self.current_token and self.current_token['value'] in ['MUST', 'SHOULD']:
                self._advance()
            
            return self._parse_consequence()
        else:
            raise DSLParserException("Expected THEN")
    
    def _parse_action_clause(self) -> Dict[str, Any]:
        """Parse an action clause."""
        if self.current_token and self.current_token['value'] == 'THEN':
            self._advance()
            self._expect('keyword', 'DO')
            return self._parse_action()
        else:
            raise DSLParserException("Expected THEN DO")
    
    def _parse_consequence(self) -> Dict[str, Any]:
        """Parse a consequence."""
        if self.current_token and self.current_token['value'] in ['REQUIRE', 'ENSURE', 'VALIDATE']:
            return self._parse_requirement()
        else:
            # Try to parse as constraint or boolean expression
            if self._is_constraint():
                return self._parse_constraint()
            else:
                return self._parse_boolean_expression()
    
    def _is_constraint(self) -> bool:
        """Check if the current position looks like a constraint."""
        if not self.current_token or self.current_token['type'] != 'identifier':
            return False
        
        # Look ahead for operators or BETWEEN/IN
        for i in range(self.token_index + 1, min(self.token_index + 3, len(self.tokens))):
            token = self.tokens[i]
            if token['type'] == 'operator' or token['value'] in ['IN', 'BETWEEN']:
                return True
        
        return False
    
    def _parse_constraint(self) -> Dict[str, Any]:
        """Parse a constraint."""
        variable = self._parse_variable()
        
        if self.current_token and self.current_token['value'] == 'IN':
            self._advance()
            if self.current_token and self.current_token['value'] == 'NOT':
                self._advance()
                values = self._parse_list()
                return {
                    'type': 'not_in_constraint',
                    'variable': variable,
                    'values': values
                }
            else:
                values = self._parse_list()
                return {
                    'type': 'in_constraint',
                    'variable': variable,
                    'values': values
                }
        elif self.current_token and self.current_token['value'] == 'BETWEEN':
            self._advance()
            lower = self._parse_value()
            self._expect('keyword', 'AND')
            upper = self._parse_value()
            return {
                'type': 'between_constraint',
                'variable': variable,
                'lower': lower,
                'upper': upper
            }
        else:
            operator = self._expect('operator')
            value = self._parse_value()
            return {
                'type': 'constraint',
                'variable': variable,
                'operator': operator['value'],
                'value': value
            }
    
    def _parse_requirement(self) -> Dict[str, Any]:
        """Parse a requirement."""
        keyword = self._expect('keyword')
        variable = self._parse_variable()
        
        return {
            'type': 'requirement',
            'keyword': keyword['value'],
            'variable': variable
        }
    
    def _parse_boolean_expression(self) -> Dict[str, Any]:
        """Parse a boolean expression."""
        if self.current_token and self.current_token['value'] in ['TRUE', 'FALSE']:
            value = self._expect('keyword')
            return {
                'type': 'boolean_literal',
                'value': value['value'] == 'TRUE'
            }
        elif self.current_token and self.current_token['type'] == 'identifier':
            variable = self._parse_variable()
            return {
                'type': 'variable_expression',
                'variable': variable
            }
        elif self.current_token and self.current_token['value'] == 'NOT':
            self._advance()
            expression = self._parse_boolean_expression()
            return {
                'type': 'not_expression',
                'expression': expression
            }
        else:
            left = self._parse_boolean_expression()
            
            if self.current_token and self.current_token['value'] in ['AND', 'OR']:
                operator = self._expect('keyword')
                right = self._parse_boolean_expression()
                
                return {
                    'type': 'boolean_expression',
                    'left': left,
                    'operator': operator['value'],
                    'right': right
                }
            else:
                return left
    
    def _parse_action(self) -> Dict[str, Any]:
        """Parse an action."""
        action_type = self._expect('keyword')
        variable = self._parse_variable()
        
        return {
            'type': 'action',
            'action_type': action_type['value'],
            'variable': variable
        }
    
    def _parse_variable(self) -> Dict[str, Any]:
        """Parse a variable."""
        parts = []
        
        while self.current_token and self.current_token['type'] == 'identifier':
            parts.append(self.current_token['value'])
            self._advance()
            
            if self.current_token and self.current_token['value'] == '.':
                self._advance()
            else:
                break
        
        if not parts:
            raise DSLParserException("Expected variable")
        
        return {
            'type': 'variable',
            'name': '.'.join(parts)
        }
    
    def _parse_value(self) -> Dict[str, Any]:
        """Parse a value."""
        if self.current_token and self.current_token['type'] == 'string':
            value = self.current_token
            self._advance()
            return {
                'type': 'string_value',
                'value': value['value'][1:-1]  # Remove quotes
            }
        elif self.current_token and self.current_token['type'] == 'number':
            value = self.current_token
            self._advance()
            return {
                'type': 'number_value',
                'value': float(value['value']) if '.' in value['value'] else int(value['value'])
            }
        elif self.current_token and self.current_token['value'] in ['TRUE', 'FALSE']:
            value = self._expect('keyword')
            return {
                'type': 'boolean_value',
                'value': value['value'] == 'TRUE'
            }
        elif self.current_token and self.current_token['type'] == 'identifier':
            # Could be a variable or datetime
            if self._looks_like_datetime(self.current_token['value']):
                value = self.current_token
                self._advance()
                return {
                    'type': 'datetime_value',
                    'value': value['value']
                }
            else:
                return self._parse_variable()
        else:
            raise DSLParserException(f"Expected value, got {self.current_token['type'] if self.current_token else 'nothing'}")
    
    def _looks_like_datetime(self, value: str) -> bool:
        """Check if a string looks like a datetime."""
        # Simple check for ISO format
        return re.match(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}', value) is not None
    
    def _parse_list(self) -> List[Dict[str, Any]]:
        """Parse a list of values."""
        self._expect('symbol', '[')
        values = []
        
        while self.current_token and self.current_token['value'] != ']':
            value = self._parse_value()
            values.append(value)
            
            if self.current_token and self.current_token['value'] == ',':
                self._advance()
        
        self._expect('symbol', ']')
        return values


class DSLEvaluator:
    """
    Evaluator for GlassBox Compliance DSL ASTs.
    
    This evaluator takes parsed DSL ASTs and evaluates them against provided context data.
    """
    
    def __init__(self):
        """Initialize the DSL evaluator."""
        self.functions = {
            # Built-in functions can be added here
            'NOW': lambda: datetime.now(timezone.utc),
            'TODAY': lambda: datetime.now(timezone.utc).date(),
        }
    
    def evaluate(self, ast: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a DSL AST against context data.
        
        Args:
            ast: The parsed DSL AST
            context: Dictionary containing context data
            
        Returns:
            Evaluation result with outcome and details
        """
        try:
            if ast['type'] == 'rule':
                condition_result = self._evaluate_condition(ast['condition'], context)
                
                if not condition_result['result']:
                    return {
                        'result': True,  # Rule doesn't apply
                        'reason': 'Condition not met',
                        'details': condition_result
                    }
                
                if 'consequence' in ast:
                    consequence_result = self._evaluate_consequence(ast['consequence'], context)
                    return {
                        'result': consequence_result['result'],
                        'reason': consequence_result.get('reason', 'Consequence evaluated'),
                        'details': {
                            'condition': condition_result,
                            'consequence': consequence_result
                        }
                    }
                elif 'action' in ast:
                    action_result = self._evaluate_action(ast['action'], context)
                    return {
                        'result': True,  # Actions are always executed when condition is met
                        'reason': f"Action executed: {action_result['action_type']}",
                        'details': {
                            'condition': condition_result,
                            'action': action_result
                        }
                    }
            
            return {
                'result': False,
                'reason': 'Invalid AST structure'
            }
        
        except Exception as e:
            return {
                'result': False,
                'reason': f'Evaluation error: {str(e)}',
                'error': str(e)
            }
    
    def _evaluate_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a condition."""
        if condition['type'] == 'simple_condition':
            return self._evaluate_simple_condition(condition, context)
        elif condition['type'] == 'list_condition':
            return self._evaluate_list_condition(condition, context)
        elif condition['type'] == 'pattern_condition':
            return self._evaluate_pattern_condition(condition, context)
        elif condition['type'] == 'temporal_condition':
            return self._evaluate_temporal_condition(condition, context)
        elif condition['type'] == 'compound_condition':
            return self._evaluate_compound_condition(condition, context)
        elif condition['type'] == 'not_condition':
            return self._evaluate_not_condition(condition, context)
        elif condition['type'] == 'variable_condition':
            return self._evaluate_variable_condition(condition, context)
        else:
            raise ValueError(f"Unknown condition type: {condition['type']}")
    
    def _evaluate_simple_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a simple condition."""
        left_value = self._get_value(condition['left'], context)
        right_value = self._get_value(condition['right'], context)
        operator = condition['operator']
        
        result = self._apply_operator(left_value, operator, right_value)
        
        return {
            'result': result,
            'left': left_value,
            'operator': operator,
            'right': right_value
        }
    
    def _evaluate_list_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a list condition."""
        variable_value = self._get_value(condition['variable'], context)
        list_values = [self._get_value(v, context) for v in condition['values']]
        
        result = variable_value in list_values
        
        return {
            'result': result,
            'variable': variable_value,
            'list': list_values
        }
    
    def _evaluate_pattern_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a pattern condition."""
        variable_value = str(self._get_value(condition['variable'], context))
        pattern = str(self._get_value(condition['pattern'], context))
        operator = condition['operator']
        
        if operator == 'CONTAINS':
            result = pattern in variable_value
        elif operator == 'MATCHES':
            # Simple regex matching (could be enhanced)
            import re
            try:
                result = bool(re.search(pattern, variable_value))
            except re.error:
                result = False
        else:
            result = False
        
        return {
            'result': result,
            'variable': variable_value,
            'pattern': pattern,
            'operator': operator
        }
    
    def _evaluate_temporal_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a temporal condition."""
        variable_value = self._get_value(condition['variable'], context)
        value = self._get_value(condition['value'], context)
        operator = condition['operator']
        
        # Convert to datetime if needed
        if isinstance(variable_value, str):
            try:
                variable_value = datetime.fromisoformat(variable_value.replace('Z', '+00:00'))
            except ValueError:
                pass
        
        if isinstance(value, str):
            try:
                value = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                pass
        
        result = False
        
        if operator == 'BEFORE':
            result = variable_value < value
        elif operator == 'AFTER':
            result = variable_value > value
        elif operator == 'WITHIN':
            # value should be a duration
            if isinstance(value, (int, float)):
                duration = timedelta(seconds=value)
                now = datetime.now(timezone.utc)
                result = (now - variable_value) <= duration
        elif operator == 'EXPIRES':
            # value should be a duration
            if isinstance(value, (int, float)):
                duration = timedelta(seconds=value)
                now = datetime.now(timezone.utc)
                result = variable_value > (now + duration)
        
        return {
            'result': result,
            'variable': variable_value,
            'operator': operator,
            'value': value
        }
    
    def _evaluate_compound_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a compound condition."""
        left_result = self._evaluate_condition(condition['left'], context)
        right_result = self._evaluate_condition(condition['right'], context)
        operator = condition['operator']
        
        if operator == 'AND':
            result = left_result['result'] and right_result['result']
        elif operator == 'OR':
            result = left_result['result'] or right_result['result']
        else:
            result = False
        
        return {
            'result': result,
            'left': left_result,
            'right': right_result,
            'operator': operator
        }
    
    def _evaluate_not_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a NOT condition."""
        inner_result = self._evaluate_condition(condition['condition'], context)
        result = not inner_result['result']
        
        return {
            'result': result,
            'inner': inner_result
        }
    
    def _evaluate_variable_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a variable condition."""
        variable_value = self._get_value(condition['variable'], context)
        result = bool(variable_value)
        
        return {
            'result': result,
            'variable': variable_value
        }
    
    def _evaluate_consequence(self, consequence: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a consequence."""
        if consequence['type'] == 'constraint':
            return self._evaluate_constraint(consequence, context)
        elif consequence['type'] == 'in_constraint':
            return self._evaluate_in_constraint(consequence, context)
        elif consequence['type'] == 'not_in_constraint':
            return self._evaluate_not_in_constraint(consequence, context)
        elif consequence['type'] == 'between_constraint':
            return self._evaluate_between_constraint(consequence, context)
        elif consequence['type'] == 'requirement':
            return self._evaluate_requirement(consequence, context)
        elif consequence['type'] == 'boolean_expression':
            return self._evaluate_boolean_expression(consequence, context)
        elif consequence['type'] == 'boolean_literal':
            return {
                'result': consequence['value'],
                'reason': 'Boolean literal'
            }
        elif consequence['type'] == 'variable_expression':
            value = self._get_value(consequence['variable'], context)
            return {
                'result': bool(value),
                'reason': f'Variable expression: {value}'
            }
        else:
            raise ValueError(f"Unknown consequence type: {consequence['type']}")
    
    def _evaluate_constraint(self, constraint: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a constraint."""
        variable_value = self._get_value(constraint['variable'], context)
        value = self._get_value(constraint['value'], context)
        operator = constraint['operator']
        
        result = self._apply_operator(variable_value, operator, value)
        
        return {
            'result': result,
            'variable': variable_value,
            'operator': operator,
            'value': value
        }
    
    def _evaluate_in_constraint(self, constraint: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate an IN constraint."""
        variable_value = self._get_value(constraint['variable'], context)
        list_values = [self._get_value(v, context) for v in constraint['values']]
        
        result = variable_value in list_values
        
        return {
            'result': result,
            'variable': variable_value,
            'list': list_values
        }
    
    def _evaluate_not_in_constraint(self, constraint: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a NOT IN constraint."""
        variable_value = self._get_value(constraint['variable'], context)
        list_values = [self._get_value(v, context) for v in constraint['values']]
        
        result = variable_value not in list_values
        
        return {
            'result': result,
            'variable': variable_value,
            'list': list_values
        }
    
    def _evaluate_between_constraint(self, constraint: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a BETWEEN constraint."""
        variable_value = self._get_value(constraint['variable'], context)
        lower = self._get_value(constraint['lower'], context)
        upper = self._get_value(constraint['upper'], context)
        
        result = lower <= variable_value <= upper
        
        return {
            'result': result,
            'variable': variable_value,
            'lower': lower,
            'upper': upper
        }
    
    def _evaluate_requirement(self, requirement: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a requirement."""
        variable_value = self._get_value(requirement['variable'], context)
        result = bool(variable_value)
        
        return {
            'result': result,
            'variable': variable_value,
            'requirement': requirement['keyword']
        }
    
    def _evaluate_boolean_expression(self, expression: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a boolean expression."""
        if expression['type'] == 'not_expression':
            inner_result = self._evaluate_boolean_expression(expression['expression'], context)
            result = not inner_result['result']
            return {
                'result': result,
                'inner': inner_result
            }
        elif 'left' in expression and 'right' in expression:
            left_result = self._evaluate_boolean_expression(expression['left'], context)
            right_result = self._evaluate_boolean_expression(expression['right'], context)
            operator = expression['operator']
            
            if operator == 'AND':
                result = left_result['result'] and right_result['result']
            elif operator == 'OR':
                result = left_result['result'] or right_result['result']
            else:
                result = False
            
            return {
                'result': result,
                'left': left_result,
                'right': right_result,
                'operator': operator
            }
        else:
            # Simple boolean value or variable
            if 'value' in expression:
                return {
                    'result': expression['value'],
                    'reason': 'Boolean literal'
                }
            else:
                value = self._get_value(expression['variable'], context)
                return {
                    'result': bool(value),
                    'reason': f'Variable expression: {value}'
                }
    
    def _evaluate_action(self, action: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate an action."""
        variable_value = self._get_value(action['variable'], context)
        
        return {
            'action_type': action['action_type'],
            'variable': variable_value,
            'executed': True
        }
    
    def _get_value(self, node: Dict[str, Any], context: Dict[str, Any]) -> Any:
        """Get the value of a node from context."""
        if node['type'] == 'variable':
            return self._get_variable_value(node['name'], context)
        elif node['type'] == 'string_value':
            return node['value']
        elif node['type'] == 'number_value':
            return node['value']
        elif node['type'] == 'boolean_value':
            return node['value']
        elif node['type'] == 'datetime_value':
            return node['value']
        else:
            raise ValueError(f"Unknown node type: {node['type']}")
    
    def _get_variable_value(self, variable_name: str, context: Dict[str, Any]) -> Any:
        """Get a variable value from context using dot notation."""
        parts = variable_name.split('.')
        value = context
        
        for part in parts:
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return None
        
        return value
    
    def _apply_operator(self, left: Any, operator: str, right: Any) -> bool:
        """Apply an operator to left and right values."""
        try:
            if operator == '=':
                return left == right
            elif operator == '!=':
                return left != right
            elif operator == '>':
                return left > right
            elif operator == '>=':
                return left >= right
            elif operator == '<':
                return left < right
            elif operator == '<=':
                return left <= right
            elif operator == 'LIKE':
                # Simple pattern matching
                import re
                pattern = right.replace('%', '.*').replace('_', '.')
                return bool(re.match(f'^{pattern}$', str(left)))
            else:
                return False
        except (TypeError, ValueError):
            return False