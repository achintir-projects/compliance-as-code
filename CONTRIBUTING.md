# Contributing to GlassBox AI Standard v1.0

We welcome contributions to GlassBox AI Standard v1.0! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- Java 11+
- Maven 3.6+
- Git

### Setup

1. **Fork the repository**
   ```bash
   # Fork the repository on GitHub
   git clone https://github.com/YOUR_USERNAME/glassbox-standard.git
   cd glassbox-standard
   ```

2. **Set up upstream remote**
   ```bash
   git remote add upstream https://github.com/Glassbox-AI/glassbox-standard.git
   ```

3. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install Python SDK dependencies
   cd sdks/python
   pip install -e .
   pip install -r requirements-dev.txt
   
   # Install JavaScript SDK dependencies
   cd ../js
   npm install
   
   # Install Java SDK dependencies
   cd ../java
   mvn install
   ```

4. **Run tests to verify setup**
   ```bash
   # From root directory
   npm test
   ```

## Development Workflow

### 1. Create a Branch

Create a new branch for your contribution:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-fix-name
```

### 2. Make Changes

- Follow the coding standards outlined below
- Make small, focused changes
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

Run the appropriate test suite:
```bash
# Run all tests
npm test

# Run specific SDK tests
cd sdks/python && pytest
cd ../js && npm test
cd ../java && mvn test

# Run linting
npm run lint
```

### 4. Commit Changes

Write clear, descriptive commit messages:
```bash
git commit -m "feat: add new compliance rule type

- Add support for temporal rules
- Update schema documentation
- Add test cases for temporal evaluation"
```

### 5. Push Branch

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Create a pull request against the `main` branch
- Use the pull request template
- Link to any relevant issues
- Describe your changes clearly

## Pull Request Process

### Pull Request Template

When creating a pull request, please use the provided template:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests have been added/updated
- [ ] All tests pass locally
- [ ] Linting passes

## Checklist
- [ ] Code follows project standards
- [ ] Documentation has been updated
- [ ] No breaking changes (or breaking changes are documented)
- [ ] Commit messages are descriptive

## Related Issues
Closes #123
Related to #456
```

### Review Process

1. **Automated Checks**: All automated checks must pass
2. **Peer Review**: At least one maintainer must review and approve
3. **CI/CD**: Continuous integration runs all tests
4. **Merge**: Maintainer merges the PR

### Merge Requirements

- All automated checks must pass
- At least one approval from a maintainer
- No conflicts with target branch
- Documentation updated (if applicable)

## Coding Standards

### General Principles

- **Readability**: Code should be easy to read and understand
- **Consistency**: Follow existing patterns and conventions
- **Modularity**: Keep functions and classes focused and small
- **Documentation**: Document complex logic and public APIs

### Python SDK Standards

- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Write docstrings for all public methods
- Use meaningful variable and function names

```python
from typing import Dict, Any, Optional

class ComplianceRule:
    """Represents a compliance rule with evaluation logic."""
    
    def __init__(self, rule_id: str, description: str):
        """Initialize a compliance rule.
        
        Args:
            rule_id: Unique identifier for the rule
            description: Human-readable description
        """
        self.rule_id = rule_id
        self.description = description
    
    def evaluate(self, context: Dict[str, Any]) -> bool:
        """Evaluate the rule against given context.
        
        Args:
            context: Dictionary containing evaluation data
            
        Returns:
            True if rule passes, False otherwise
        """
        # Implementation
        pass
```

### JavaScript SDK Standards

- Use ES6+ features and TypeScript
- Follow Airbnb JavaScript Style Guide
- Use JSDoc for documentation
- Prefer const/let over var

```typescript
/**
 * Represents a compliance rule with evaluation logic
 */
export class ComplianceRule {
  private ruleId: string;
  private description: string;

  constructor(ruleId: string, description: string) {
    this.ruleId = ruleId;
    this.description = description;
  }

  /**
   * Evaluate the rule against given context
   * @param context - Object containing evaluation data
   * @returns True if rule passes, False otherwise
   */
  evaluate(context: Record<string, any>): boolean {
    // Implementation
    return true;
  }
}
```

### Java SDK Standards

- Follow Java Code Conventions
- Use JavaDoc for documentation
- Prefer immutable objects where possible
- Use meaningful package names

```java
package ai.glassbox.sdk;

/**
 * Represents a compliance rule with evaluation logic
 */
public class ComplianceRule {
    private final String ruleId;
    private final String description;

    /**
     * Initialize a compliance rule
     * @param ruleId Unique identifier for the rule
     * @param description Human-readable description
     */
    public ComplianceRule(String ruleId, String description) {
        this.ruleId = ruleId;
        this.description = description;
    }

    /**
     * Evaluate the rule against given context
     * @param context Object containing evaluation data
     * @return True if rule passes, False otherwise
     */
    public boolean evaluate(ExecutionContext context) {
        // Implementation
        return true;
    }
}
```

## Testing

### Test Coverage Requirements

- **Minimum Coverage**: 90% for all SDKs
- **Critical Path**: 100% coverage for core functionality
- **Edge Cases**: Include tests for edge cases and error conditions

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── performance/    # Performance tests
└── fixtures/       # Test data and fixtures
```

### Writing Tests

#### Python Tests
```python
import pytest
from glassbox import ComplianceRule

def test_compliance_rule_evaluation():
    """Test that compliance rule evaluates correctly."""
    rule = ComplianceRule("test_rule", "Test rule")
    context = {"value": 100}
    
    result = rule.evaluate(context)
    assert isinstance(result, bool)
```

#### JavaScript Tests
```typescript
import { ComplianceRule } from '../src/index';

describe('ComplianceRule', () => {
  test('should evaluate correctly', () => {
    const rule = new ComplianceRule('test_rule', 'Test rule');
    const context = { value: 100 };
    
    const result = rule.evaluate(context);
    expect(typeof result).toBe('boolean');
  });
});
```

#### Java Tests
```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import ai.glassbox.sdk.ComplianceRule;

class ComplianceRuleTest {
    @Test
    void shouldEvaluateCorrectly() {
        ComplianceRule rule = new ComplianceRule("test_rule", "Test rule");
        ExecutionContext context = new ExecutionContext();
        context.setVariable("value", 100);
        
        boolean result = rule.evaluate(context);
        assertTrue(result);
    }
}
```

## Documentation

### Documentation Requirements

- **API Documentation**: Document all public APIs
- **Examples**: Provide working examples for all features
- **Guides**: Write comprehensive guides for complex topics
- **Changelog**: Keep changelog updated for all changes

### Documentation Structure

```
docs/
├── api/              # API reference
├── guides/           # How-to guides
├── tutorials/        # Step-by-step tutorials
├── examples/         # Code examples
└── reference/        # Technical reference
```

### Writing Documentation

- Use clear, concise language
- Include code examples
- Provide context and motivation
- Link to related topics

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Environment**: OS, SDK version, runtime version
2. **Steps to Reproduce**: Clear reproduction steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Error Messages**: Any error messages or stack traces
6. **Additional Context**: Any other relevant information

### Feature Requests

For feature requests, please include:

1. **Problem Statement**: What problem you're trying to solve
2. **Proposed Solution**: How you think it should be solved
3. **Alternatives**: Any alternative solutions considered
4. **Use Cases**: Specific use cases this would enable

### Issue Templates

Use the provided issue templates:

- **Bug Report**: `.github/ISSUE_TEMPLATE/bug_report.md`
- **Feature Request**: `.github/ISSUE_TEMPLATE/feature_request.md`

## Community Guidelines

### Communication

- Be respectful and constructive
- Focus on technical discussions
- Help others when you can
- Share knowledge and experience

### Getting Help

- **Documentation**: Check the documentation first
- **Issues**: Search existing issues
- **Discussions**: Ask questions in GitHub Discussions
- **Discord**: Join our community Discord server

## Recognition

Contributors will be recognized in:

- **Release Notes**: Major contributors acknowledged
- **Contributors File**: Maintained list of contributors
- **Community**: Shoutouts in community channels

Thank you for contributing to GlassBox AI Standard v1.0!