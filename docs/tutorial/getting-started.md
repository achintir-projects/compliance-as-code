---
sidebar_position: 2
---

# Getting Started

This section will guide you through setting up your environment and creating your first compliance rule with GlassBox Standard v1.0. By the end of this section, you'll have a working development environment and understand the basic concepts.

## Prerequisites

Before you begin, ensure you have the following:

### System Requirements
- **Operating System**: Windows, macOS, or Linux
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 2GB free disk space
- **Internet Connection**: Required for downloading dependencies

### Software Requirements
- **Python 3.8+**: For the Python SDK (recommended for beginners)
- **Node.js 16+**: For the JavaScript SDK (optional)
- **Java 11+**: For the Java SDK (optional)
- **Git**: For version control and accessing examples
- **Code Editor**: VS Code, IntelliJ IDEA, or similar

### Account Requirements
- **GitHub Account**: For accessing examples and community resources
- **Email Address**: For account creation and notifications (optional)

## Step 1: Setting Up Your Development Environment

### Option A: Using Python (Recommended for Beginners)

#### 1. Install Python
```bash
# Check if Python is installed
python --version

# If not installed, download from https://python.org
# On macOS: brew install python
# On Ubuntu: sudo apt-get install python3
```

#### 2. Create a Virtual Environment
```bash
# Create a project directory
mkdir glassbox-tutorial
cd glassbox-tutorial

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### 3. Install the GlassBox SDK
```bash
# Install the GlassBox Python SDK
pip install glassbox-sdk

# Install additional useful packages
pip install jupyterlab pandas matplotlib
```

#### 4. Verify Installation
```bash
# Verify the SDK is installed
python -c "import glassbox; print(glassbox.__version__)"

# Test the SDK
python -c "
from glassbox import DecisionBundle
print('GlassBox SDK installed successfully!')
"
```

### Option B: Using JavaScript (for Web Developers)

#### 1. Install Node.js
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from https://nodejs.org
```

#### 2. Create a Project Directory
```bash
# Create a project directory
mkdir glassbox-tutorial
cd glassbox-tutorial

# Initialize a Node.js project
npm init -y
```

#### 3. Install the GlassBox SDK
```bash
# Install the GlassBox JavaScript SDK
npm install @glassbox/sdk

# Install additional useful packages
npm install axios dotenv
```

#### 4. Verify Installation
```bash
# Create a test file
echo "const { DecisionBundle } = require('@glassbox/sdk');
console.log('GlassBox SDK installed successfully!');" > test.js

# Run the test
node test.js
```

### Option C: Using Java (for Enterprise Developers)

#### 1. Install Java and Maven
```bash
# Check if Java is installed
java -version
mvn -version

# If not installed, download from https://adoptium.net/
```

#### 2. Create a Maven Project
```bash
# Create a project directory
mkdir glassbox-tutorial
cd glassbox-tutorial

# Create a Maven project
mvn archetype:generate -DgroupId=com.example -DartifactId=glassbox-tutorial -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false

cd glassbox-tutorial
```

#### 3. Add GlassBox Dependency
Edit `pom.xml` to add the GlassBox dependency:

```xml
<dependencies>
    <!-- Add this dependency -->
    <dependency>
        <groupId>ai.glassbox</groupId>
        <artifactId>glassbox-sdk</artifactId>
        <version>1.0.0</version>
    </dependency>
    
    <!-- Other dependencies -->
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.11</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

#### 4. Verify Installation
```bash
# Compile the project
mvn compile

# Create a test file
echo "import ai.glassbox.DecisionBundle;
public class Test {
    public static void main(String[] args) {
        System.out.println(\"GlassBox SDK installed successfully!\");
    }
}" > src/main/java/Test.java

# Run the test
mvn exec:java -Dexec.mainClass="Test"
```

## Step 2: Understanding the Basic Concepts

### What is a DecisionBundle?

A DecisionBundle is a JSON document that contains:
- **Metadata**: Information about the bundle (jurisdiction, domain, author)
- **Rules**: Compliance rules in various formats (DSL, expressions, decision tables)
- **Decisions**: Results of rule evaluations with supporting evidence
- **Evidence**: Supporting documentation and audit trails

### What is the Compliance DSL?

The Compliance DSL is a human-readable language for writing compliance rules. Example:
```
WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE
```

### Key Components

1. **Rules**: Define compliance requirements
2. **Decisions**: Results of evaluating rules against data
3. **Evidence**: Supporting documentation for decisions
4. **Audit**: Complete audit trail of all activities

## Step 3: Your First Compliance Rule

Let's create a simple GDPR compliance rule using the Python SDK.

### Create the Rule

```python
# Create a new file: first_rule.py
from glassbox import DecisionBundle, ComplianceRule, ComplianceDecision
import uuid
from datetime import datetime

# Create a simple compliance rule
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="GDPR Consent Validation",
    description="Verify that consent is properly informed",
    type="dsl",
    definition={
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE",
        "parameters": {
            "user.consent_given": "boolean",
            "user.consent_informed": "boolean"
        }
    },
    severity="high",
    category="consent",
    references=[
        {
            "type": "regulation",
            "id": "GDPR-Article-7",
            "title": "GDPR Article 7: Conditions for consent",
            "url": "https://gdpr-info.eu/art-7-gdpr/"
        }
    ]
)

print("Created rule:", rule.name)
print("Rule ID:", rule.id)
```

### Create a DecisionBundle

```python
# Add to first_rule.py
# Create a DecisionBundle
bundle = DecisionBundle(
    version="1.0",
    metadata={
        "id": str(uuid.uuid4()),
        "name": "GDPR Compliance Tutorial",
        "description": "Tutorial DecisionBundle for GDPR compliance",
        "created": datetime.now().isoformat(),
        "author": "Tutorial User",
        "jurisdiction": "GDPR",
        "domain": "general",
        "tags": ["tutorial", "gdpr", "consent"]
    },
    rules=[rule],
    decisions=[]
)

print("Created DecisionBundle:", bundle.metadata["name"])
print("Bundle ID:", bundle.metadata["id"])
```

### Create a Decision

```python
# Add to first_rule.py
# Create a compliance decision
decision = ComplianceDecision(
    id=str(uuid.uuid4()),
    ruleId=rule.id,
    input={
        "user.consent_given": True,
        "user.consent_informed": True
    },
    output={
        "result": True,
        "confidence": 1.0,
        "reason": "Consent is properly informed"
    },
    timestamp=datetime.now().isoformat(),
    executor="tutorial-engine",
    context={
        "user_id": "user-123",
        "session_id": "session-456"
    }
)

# Add decision to bundle
bundle.decisions.append(decision)

print("Created decision:", decision.id)
print("Decision result:", decision.output["result"])
```

### Save and Validate the Bundle

```python
# Add to first_rule.py
# Save the DecisionBundle to a file
bundle.save("first_decisionbundle.json")

# Validate the bundle
is_valid = bundle.validate()
print("Bundle validation:", "Valid" if is_valid else "Invalid")

# Print bundle summary
print("\nBundle Summary:")
print(f"- Rules: {len(bundle.rules)}")
print(f"- Decisions: {len(bundle.decisions)}")
print(f"- Jurisdiction: {bundle.metadata['jurisdiction']}")
print(f"- Domain: {bundle.metadata['domain']}")
```

### Run the Complete Example

```bash
# Run the complete example
python first_rule.py
```

Expected output:
```
Created rule: GDPR Consent Validation
Rule ID: 550e8400-e29b-41d4-a716-446655440000
Created DecisionBundle: GDPR Compliance Tutorial
Bundle ID: 550e8400-e29b-41d4-a716-446655440001
Created decision: 550e8400-e29b-41d4-a716-446655440002
Decision result: True
Bundle validation: Valid

Bundle Summary:
- Rules: 1
- Decisions: 1
- Jurisdiction: GDPR
- Domain: general
```

## Step 4: Exploring the Generated DecisionBundle

Let's examine the generated DecisionBundle file:

```bash
# View the generated DecisionBundle
cat first_decisionbundle.json
```

The output should look like this:
```json
{
  "version": "1.0",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "GDPR Compliance Tutorial",
    "description": "Tutorial DecisionBundle for GDPR compliance",
    "created": "2025-01-15T10:30:00.123456",
    "author": "Tutorial User",
    "jurisdiction": "GDPR",
    "domain": "general",
    "tags": ["tutorial", "gdpr", "consent"]
  },
  "rules": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "GDPR Consent Validation",
      "description": "Verify that consent is properly informed",
      "type": "dsl",
      "definition": {
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE",
        "parameters": {
          "user.consent_given": "boolean",
          "user.consent_informed": "boolean"
        }
      },
      "severity": "high",
      "category": "consent",
      "references": [
        {
          "type": "regulation",
          "id": "GDPR-Article-7",
          "title": "GDPR Article 7: Conditions for consent",
          "url": "https://gdpr-info.eu/art-7-gdpr/"
        }
      ]
    }
  ],
  "decisions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "ruleId": "550e8400-e29b-41d4-a716-446655440000",
      "input": {
        "user.consent_given": true,
        "user.consent_informed": true
      },
      "output": {
        "result": true,
        "confidence": 1.0,
        "reason": "Consent is properly informed"
      },
      "timestamp": "2024-01-15T10:30:00.123456",
      "executor": "tutorial-engine",
      "context": {
        "user_id": "user-123",
        "session_id": "session-456"
      }
    }
  ]
}
```

## Step 5: Testing Different Scenarios

Let's test our rule with different input scenarios:

### Create a Test Script

```python
# Create test_scenarios.py
from glassbox import DecisionBundle, ComplianceRule, ComplianceDecision
import uuid
from datetime import datetime

# Create the same rule as before
rule = ComplianceRule(
    id=str(uuid.uuid4()),
    name="GDPR Consent Validation",
    description="Verify that consent is properly informed",
    type="dsl",
    definition={
        "dsl": "WHEN user.consent_given = TRUE THEN MUST user.consent_informed = TRUE",
        "parameters": {
            "user.consent_given": "boolean",
            "user.consent_informed": "boolean"
        }
    },
    severity="high",
    category="consent"
)

# Test scenarios
scenarios = [
    {
        "name": "Valid Consent",
        "input": {"user.consent_given": True, "user.consent_informed": True},
        "expected": True
    },
    {
        "name": "Invalid Consent - Not Informed",
        "input": {"user.consent_given": True, "user.consent_informed": False},
        "expected": False
    },
    {
        "name": "No Consent Given",
        "input": {"user.consent_given": False, "user.consent_informed": False},
        "expected": True  # Rule doesn't apply when consent is not given
    }
]

# Test each scenario
for scenario in scenarios:
    decision = ComplianceDecision(
        id=str(uuid.uuid4()),
        ruleId=rule.id,
        input=scenario["input"],
        output={
            "result": scenario["expected"],
            "confidence": 1.0,
            "reason": f"Scenario: {scenario['name']}"
        },
        timestamp=datetime.now().isoformat(),
        executor="test-engine"
    )
    
    print(f"Scenario: {scenario['name']}")
    print(f"Input: {scenario['input']}")
    print(f"Expected: {scenario['expected']}")
    print(f"Decision ID: {decision.id}")
    print("-" * 50)
```

### Run the Test Scenarios

```bash
python test_scenarios.py
```

Expected output:
```
Scenario: Valid Consent
Input: {'user.consent_given': True, 'user.consent_informed': True}
Expected: True
Decision ID: 550e8400-e29b-41d4-a716-446655440003
--------------------------------------------------
Scenario: Invalid Consent - Not Informed
Input: {'user.consent_given': True, 'user.consent_informed': False}
Expected: False
Decision ID: 550e8400-e29b-41d4-a716-446655440004
--------------------------------------------------
Scenario: No Consent Given
Input: {'user.consent_given': False, 'user.consent_informed': False}
Expected: True
Decision ID: 550e8400-e29b-41d4-a716-446655440005
--------------------------------------------------
```

## Step 6: Working with the Regulator Sandbox

Let's explore how to use the Regulator Sandbox for testing our DecisionBundles.

### Sandbox Setup

The Regulator Sandbox provides a secure environment for testing compliance rules. While the full sandbox requires special access, we can simulate its functionality locally.

### Create a Sandbox Simulation

```python
# Create sandbox_simulation.py
from glassbox import DecisionBundle
import json

class RegulatorSandbox:
    def __init__(self):
        self.bundles = []
        self.rules = []
        self.decisions = []
    
    def ingest_bundle(self, bundle):
        """Ingest a DecisionBundle into the sandbox"""
        if bundle.validate():
            self.bundles.append(bundle)
            self.rules.extend(bundle.rules)
            self.decisions.extend(bundle.decisions)
            return True
        else:
            return False
    
    def query_by_jurisdiction(self, jurisdiction):
        """Query bundles by jurisdiction"""
        return [bundle for bundle in self.bundles 
                if bundle.metadata.get('jurisdiction') == jurisdiction]
    
    def query_by_rule_type(self, rule_type):
        """Query rules by type"""
        return [rule for rule in self.rules if rule.type == rule_type]
    
    def get_compliance_summary(self):
        """Get compliance summary"""
        total_decisions = len(self.decisions)
        passed_decisions = sum(1 for d in self.decisions if d.output.get('result', False))
        
        return {
            "total_decisions": total_decisions,
            "passed_decisions": passed_decisions,
            "failed_decisions": total_decisions - passed_decisions,
            "compliance_rate": (passed_decisions / total_decisions * 100) if total_decisions > 0 else 0
        }

# Load our previously created bundle
try:
    with open('first_decisionbundle.json', 'r') as f:
        bundle_data = json.load(f)
        bundle = DecisionBundle.from_dict(bundle_data)
except FileNotFoundError:
    print("DecisionBundle file not found. Please run first_rule.py first.")
    exit(1)

# Create sandbox instance
sandbox = RegulatorSandbox()

# Ingest the bundle
if sandbox.ingest_bundle(bundle):
    print("DecisionBundle ingested successfully!")
else:
    print("Failed to ingest DecisionBundle.")
    exit(1)

# Query the sandbox
gdpr_bundles = sandbox.query_by_jurisdiction("GDPR")
dsl_rules = sandbox.query_by_rule_type("dsl")
summary = sandbox.get_compliance_summary()

print("\nSandbox Query Results:")
print(f"GDPR Bundles: {len(gdpr_bundles)}")
print(f"DSL Rules: {len(dsl_rules)}")
print(f"Compliance Summary: {summary}")
```

### Run the Sandbox Simulation

```bash
python sandbox_simulation.py
```

Expected output:
```
DecisionBundle ingested successfully!

Sandbox Query Results:
GDPR Bundles: 1
DSL Rules: 1
Compliance Summary: {'total_decisions': 1, 'passed_decisions': 1, 'failed_decisions': 0, 'compliance_rate': 100.0}
```

## Step 7: Next Steps

### What You've Accomplished

Congratulations! You've successfully:
1. ✅ Set up your development environment
2. ✅ Created your first compliance rule
3. ✅ Built a complete DecisionBundle
4. ✅ Tested different compliance scenarios
5. ✅ Simulated regulator sandbox functionality

### What's Next

Continue your learning journey with these next steps:

#### Immediate Next Steps
1. **Explore More Examples**: Check out the [Examples](../examples/overview.md) section
2. **Learn Advanced DSL Features**: Read about [Advanced DSL Patterns](creating-rules.md)
3. **Try Different Domains**: Experiment with financial, healthcare, or ESG rules

#### Medium-term Goals
1. **Build a Complete Solution**: Create a compliance solution for your domain
2. **Integrate with Real Systems**: Connect with existing compliance systems
3. **Deploy to Production**: Deploy your compliance solution to production

#### Long-term Goals
1. **Contribute to the Community**: Share your examples and improvements
2. **Become an Expert**: Master advanced features and best practices
3. **Help Others**: Mentor new users and contribute to documentation

### Resources for Continued Learning

#### Documentation
- [DecisionBundle Specification](../specs/decisionbundle/overview.md)
- [Compliance DSL Reference](../specs/compliance-dsl/overview.md)
- [API Documentation](../developers/integration.md)

#### Community
- [GitHub Repository](https://github.com/glassbox-ai/glassbox-standard)
- [Discussion Forums](https://github.com/glassbox-ai/glassbox-standard/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/glassbox)

#### Training
- [Video Tutorials](https://glassbox.ai/tutorials)
- [Workshops and Webinars](https://glassbox.ai/events)
- [Certification Programs](https://glassbox.ai/certification)

## Troubleshooting Common Issues

### Installation Issues
**Problem**: `pip install glassbox-sdk` fails
**Solution**: 
```bash
# Update pip first
pip install --upgrade pip

# Try installing with --no-cache-dir
pip install --no-cache-dir glassbox-sdk

# If still fails, check Python version (requires 3.8+)
python --version
```

### Import Issues
**Problem**: `import glassbox` fails
**Solution**:
```bash
# Check if the package is installed
pip list | grep glassbox

# If not installed, install it
pip install glassbox-sdk

# If installed but not found, check Python path
python -c "import sys; print(sys.path)"
```

### Validation Issues
**Problem**: DecisionBundle validation fails
**Solution**:
```python
# Check what's missing
bundle.validate(debug=True)

# Common issues:
# - Missing required fields in metadata
# - Invalid UUID format
# - Invalid date-time format
# - Missing required fields in rules or decisions
```

### Rule Execution Issues
**Problem**: Rules don't execute as expected
**Solution**:
```python
# Check rule definition
print(rule.definition)

# Test with simple input
simple_input = {"user.consent_given": True, "user.consent_informed": True}
print(f"Testing with input: {simple_input}")

# Check for syntax errors in DSL rules
if rule.type == "dsl":
    print(f"DSL rule: {rule.definition['dsl']}")
```

---

**Congratulations! You've completed the Getting Started section. You're now ready to dive deeper into GlassBox Standard!**