"""
GlassBox Rule Engine Module

This module provides classes for executing compliance rules and managing
the execution context according to the GlassBox Standard v1.0.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Callable
from .exceptions import RuleExecutionException
from .dsl_parser import DSLParser, DSLEvaluator
from .decision_bundle import DecisionBundle


class ExecutionContext:
    """
    Context for rule execution containing data, variables, and execution state.
    """
    
    def __init__(self, data: Dict[str, Any], variables: Optional[Dict[str, Any]] = None):
        """
        Initialize execution context.
        
        Args:
            data: Input data for rule evaluation
            variables: Additional variables for rule evaluation
        """
        self.data = data
        self.variables = variables or {}
        self.execution_id = str(uuid.uuid4())
        self.timestamp = datetime.now(timezone.utc)
        self.results = []
        self.errors = []
        self.metadata = {}
    
    def get_context_data(self) -> Dict[str, Any]:
        """Get combined context data for evaluation."""
        context = self.data.copy()
        context.update(self.variables)
        context['_execution'] = {
            'id': self.execution_id,
            'timestamp': self.timestamp.isoformat()
        }
        return context
    
    def add_result(self, result: Dict[str, Any]):
        """Add a result to the execution context."""
        self.results.append(result)
    
    def add_error(self, error: Dict[str, Any]):
        """Add an error to the execution context."""
        self.errors.append(error)
    
    def set_metadata(self, key: str, value: Any):
        """Set metadata for the execution context."""
        self.metadata[key] = value
    
    def get_metadata(self, key: str) -> Any:
        """Get metadata from the execution context."""
        return self.metadata.get(key)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the execution context to a dictionary."""
        return {
            'execution_id': self.execution_id,
            'timestamp': self.timestamp.isoformat(),
            'data': self.data,
            'variables': self.variables,
            'results': self.results,
            'errors': self.errors,
            'metadata': self.metadata
        }


class RuleEngine:
    """
    Engine for executing compliance rules from DecisionBundles.
    
    This engine can execute different types of rules (DSL, expression, decision table)
    and manage the execution lifecycle.
    """
    
    def __init__(self):
        """Initialize the rule engine."""
        self.dsl_parser = DSLParser()
        self.dsl_evaluator = DSLEvaluator()
        self.custom_handlers = {}
        self.cache = {}
    
    def register_handler(self, rule_type: str, handler: Callable):
        """
        Register a custom handler for a rule type.
        
        Args:
            rule_type: The rule type (e.g., 'custom', 'external')
            handler: Function that handles the rule execution
        """
        self.custom_handlers[rule_type] = handler
    
    def execute_bundle(self, bundle: DecisionBundle, context: ExecutionContext) -> Dict[str, Any]:
        """
        Execute all rules in a DecisionBundle.
        
        Args:
            bundle: The DecisionBundle to execute
            context: The execution context
            
        Returns:
            Execution results summary
        """
        results = {
            'bundle_id': bundle.metadata['id'],
            'bundle_name': bundle.metadata['name'],
            'execution_id': context.execution_id,
            'timestamp': context.timestamp.isoformat(),
            'rules_executed': 0,
            'rules_passed': 0,
            'rules_failed': 0,
            'rule_results': [],
            'overall_result': True
        }
        
        for rule in bundle.rules:
            try:
                rule_result = self.execute_rule(rule, context)
                results['rule_results'].append(rule_result)
                results['rules_executed'] += 1
                
                if rule_result['result']:
                    results['rules_passed'] += 1
                else:
                    results['rules_failed'] += 1
                    results['overall_result'] = False
                
            except Exception as e:
                error_result = {
                    'rule_id': rule.get('id', 'unknown'),
                    'rule_name': rule.get('name', 'unknown'),
                    'result': False,
                    'error': str(e),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                results['rule_results'].append(error_result)
                results['rules_executed'] += 1
                results['rules_failed'] += 1
                results['overall_result'] = False
                
                context.add_error({
                    'rule_id': rule.get('id', 'unknown'),
                    'error': str(e),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
        
        return results
    
    def execute_rule(self, rule: Dict[str, Any], context: ExecutionContext) -> Dict[str, Any]:
        """
        Execute a single rule.
        
        Args:
            rule: The rule to execute
            context: The execution context
            
        Returns:
            Rule execution result
        """
        rule_id = rule.get('id', 'unknown')
        rule_name = rule.get('name', 'unknown')
        rule_type = rule.get('type', 'unknown')
        
        result = {
            'rule_id': rule_id,
            'rule_name': rule_name,
            'rule_type': rule_type,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'result': False,
            'reason': '',
            'details': {},
            'confidence': 1.0
        }
        
        try:
            # Check cache first
            cache_key = self._get_cache_key(rule, context)
            if cache_key in self.cache:
                cached_result = self.cache[cache_key]
                result.update(cached_result)
                result['cached'] = True
                return result
            
            # Execute based on rule type
            if rule_type == 'dsl':
                execution_result = self._execute_dsl_rule(rule, context)
            elif rule_type == 'expression':
                execution_result = self._execute_expression_rule(rule, context)
            elif rule_type == 'decision_table':
                execution_result = self._execute_decision_table_rule(rule, context)
            elif rule_type == 'decision_tree':
                execution_result = self._execute_decision_tree_rule(rule, context)
            elif rule_type in self.custom_handlers:
                execution_result = self.custom_handlers[rule_type](rule, context)
            else:
                raise RuleExecutionException(f"Unsupported rule type: {rule_type}", rule_id)
            
            result.update(execution_result)
            
            # Cache the result
            self.cache[cache_key] = execution_result.copy()
            
            # Add to context results
            context.add_result(result)
            
            return result
            
        except Exception as e:
            error_msg = f"Rule execution failed: {str(e)}"
            result['reason'] = error_msg
            result['error'] = error_msg
            
            raise RuleExecutionException(error_msg, rule_id, context.to_dict())
    
    def _execute_dsl_rule(self, rule: Dict[str, Any], context: ExecutionContext) -> Dict[str, Any]:
        """Execute a DSL rule."""
        definition = rule.get('definition', {})
        dsl_text = definition.get('dsl', '')
        
        if not dsl_text:
            raise RuleExecutionException("DSL rule missing DSL text", rule.get('id'))
        
        # Parse DSL
        try:
            ast = self.dsl_parser.parse(dsl_text)
        except Exception as e:
            raise RuleExecutionException(f"DSL parsing failed: {str(e)}", rule.get('id'))
        
        # Evaluate DSL
        context_data = context.get_context_data()
        evaluation_result = self.dsl_evaluator.evaluate(ast, context_data)
        
        return {
            'result': evaluation_result['result'],
            'reason': evaluation_result.get('reason', 'DSL evaluation completed'),
            'details': {
                'dsl_text': dsl_text,
                'ast': ast,
                'evaluation': evaluation_result,
                'parameters': definition.get('parameters', {})
            },
            'confidence': evaluation_result.get('confidence', 1.0)
        }
    
    def _execute_expression_rule(self, rule: Dict[str, Any], context: ExecutionContext) -> Dict[str, Any]:
        """Execute an expression rule."""
        definition = rule.get('definition', {})
        expression = definition.get('expression', '')
        variables = definition.get('variables', {})
        
        if not expression:
            raise RuleExecutionException("Expression rule missing expression", rule.get('id'))
        
        # Simple expression evaluation (could be enhanced with a proper expression parser)
        try:
            context_data = context.get_context_data()
            
            # Replace variables with values
            eval_expression = expression
            for var_name, var_type in variables.items():
                if var_name in context_data:
                    value = context_data[var_name]
                    if var_type == 'boolean':
                        eval_expression = eval_expression.replace(var_name, str(value).lower())
                    else:
                        eval_expression = eval_expression.replace(var_name, str(value))
            
            # Evaluate the expression
            result = eval(eval_expression, {'__builtins__': {}}, {})
            
            return {
                'result': bool(result),
                'reason': f"Expression evaluated to: {result}",
                'details': {
                    'expression': expression,
                    'evaluated_expression': eval_expression,
                    'variables': variables
                }
            }
            
        except Exception as e:
            raise RuleExecutionException(f"Expression evaluation failed: {str(e)}", rule.get('id'))
    
    def _execute_decision_table_rule(self, rule: Dict[str, Any], context: ExecutionContext) -> Dict[str, Any]:
        """Execute a decision table rule."""
        definition = rule.get('definition', {})
        table = definition.get('table', {})
        
        if not table:
            raise RuleExecutionException("Decision table rule missing table", rule.get('id'))
        
        conditions = table.get('conditions', [])
        actions = table.get('actions', [])
        
        context_data = context.get_context_data()
        
        # Evaluate conditions
        all_conditions_met = True
        condition_results = []
        
        for condition in conditions:
            field = condition.get('field', '')
            operator = condition.get('operator', '')
            value = condition.get('value', '')
            
            # Get field value from context
            field_value = self._get_nested_value(field, context_data)
            
            # Evaluate condition
            condition_met = self._evaluate_condition(field_value, operator, value)
            condition_results.append({
                'field': field,
                'operator': operator,
                'value': value,
                'field_value': field_value,
                'met': condition_met
            })
            
            if not condition_met:
                all_conditions_met = False
        
        # Execute actions if conditions are met
        action_results = []
        if all_conditions_met:
            for action in actions:
                action_type = action.get('result', False)
                reason = action.get('reason', 'Decision table action')
                
                action_results.append({
                    'type': action_type,
                    'reason': reason
                })
        
        return {
            'result': all_conditions_met,
            'reason': 'Decision table conditions met' if all_conditions_met else 'Decision table conditions not met',
            'details': {
                'conditions': condition_results,
                'actions': action_results,
                'table': table
            }
        }
    
    def _execute_decision_tree_rule(self, rule: Dict[str, Any], context: ExecutionContext) -> Dict[str, Any]:
        """Execute a decision tree rule."""
        definition = rule.get('definition', {})
        tree = definition.get('tree', {})
        
        if not tree:
            raise RuleExecutionException("Decision tree rule missing tree", rule.get('id'))
        
        context_data = context.get_context_data()
        
        # Traverse the decision tree
        result = self._traverse_decision_tree(tree, context_data)
        
        return {
            'result': result.get('result', False),
            'reason': result.get('reason', 'Decision tree traversal completed'),
            'details': {
                'tree': tree,
                'path': result.get('path', []),
                'final_node': result.get('final_node')
            }
        }
    
    def _traverse_decision_tree(self, node: Dict[str, Any], context_data: Dict[str, Any], path: Optional[List[str]] = None) -> Dict[str, Any]:
        """Recursively traverse a decision tree."""
        if path is None:
            path = []
        
        # Check if this is a leaf node
        if 'result' in node:
            return {
                'result': node['result'],
                'reason': node.get('reason', 'Leaf node reached'),
                'path': path,
                'final_node': node
            }
        
        # Get condition
        condition = node.get('condition', {})
        field = condition.get('field', '')
        operator = condition.get('operator', '')
        value = condition.get('value', '')
        
        # Evaluate condition
        field_value = self._get_nested_value(field, context_data)
        condition_met = self._evaluate_condition(field_value, operator, value)
        
        # Choose next node
        next_node_key = 'true_branch' if condition_met else 'false_branch'
        next_node = node.get(next_node_key)
        
        if not next_node:
            return {
                'result': False,
                'reason': f"No {next_node_key} found at node",
                'path': path,
                'final_node': node
            }
        
        # Add current node to path
        current_path = path.copy()
        current_path.append(f"Condition: {field} {operator} {value} = {condition_met}")
        
        # Recurse
        return self._traverse_decision_tree(next_node, context_data, current_path)
    
    def _get_nested_value(self, field_path: str, data: Dict[str, Any]) -> Any:
        """Get a nested value from data using dot notation."""
        parts = field_path.split('.')
        value = data
        
        for part in parts:
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return None
        
        return value
    
    def _evaluate_condition(self, field_value: Any, operator: str, value: Any) -> bool:
        """Evaluate a condition with the given operator."""
        try:
            if operator == '=':
                return field_value == value
            elif operator == '!=':
                return field_value != value
            elif operator == '>':
                return field_value > value
            elif operator == '>=':
                return field_value >= value
            elif operator == '<':
                return field_value < value
            elif operator == '<=':
                return field_value <= value
            elif operator == 'contains':
                return str(value) in str(field_value)
            elif operator == 'exceeds':
                return field_value > value
            else:
                return False
        except (TypeError, ValueError):
            return False
    
    def _get_cache_key(self, rule: Dict[str, Any], context: ExecutionContext) -> str:
        """Generate a cache key for a rule execution."""
        # Simple cache key based on rule ID and context data hash
        import hashlib
        
        rule_id = rule.get('id', 'unknown')
        context_str = str(sorted(context.get_context_data().items()))
        
        key_data = f"{rule_id}:{context_str}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def clear_cache(self):
        """Clear the execution cache."""
        self.cache.clear()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            'cache_size': len(self.cache),
            'cache_enabled': True
        }