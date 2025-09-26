# GlassBox AI Compliance DSL Grammar v1.0

## Overview

The GlassBox AI Compliance DSL (Domain-Specific Language) is a minimal, expressive language designed for defining compliance rules in a human-readable format. It enables compliance officers, regulators, and developers to create complex compliance rules without deep programming knowledge.

## Grammar Definition

### 1. Rule Structure

```
rule ::= condition_clause consequence_clause
       | condition_clause action_clause
```

### 2. Condition Clause

```
condition_clause ::= "WHEN" condition
                   | "IF" condition
```

### 3. Condition

```
condition ::= simple_condition
            | compound_condition
            | temporal_condition
```

#### Simple Condition

```
simple_condition ::= variable operator value
                   | variable "IN" list
                   | variable "CONTAINS" value
                   | variable "MATCHES" pattern
```

#### Compound Condition

```
compound_condition ::= condition "AND" condition
                     | condition "OR" condition
                     | "NOT" condition
                     | "(" condition ")"
```

#### Temporal Condition

```
temporal_condition ::= variable "BEFORE" datetime
                     | variable "AFTER" datetime
                     | variable "WITHIN" duration
                     | variable "EXPIRES" "AFTER" duration
```

### 4. Consequence Clause

```
consequence_clause ::= "THEN" consequence
                     | "THEN MUST" consequence
                     | "THEN SHOULD" consequence
```

### 5. Action Clause

```
action_clause ::= "THEN" action
                | "THEN DO" action
```

### 6. Consequence

```
consequence ::= boolean_expression
               | constraint
               | requirement
```

#### Boolean Expression

```
boolean_expression ::= "TRUE"
                     | "FALSE"
                     | variable
                     | "NOT" boolean_expression
                     | boolean_expression "AND" boolean_expression
                     | boolean_expression "OR" boolean_expression
```

#### Constraint

```
constraint ::= variable operator value
              | variable "IN" list
              | variable "BETWEEN" value "AND" value
              | variable "NOT IN" list
```

#### Requirement

```
requirement ::= "REQUIRE" variable
               | "ENSURE" variable
               | "VALIDATE" variable
```

### 7. Action

```
action ::= "FLAG" variable
         | "ALERT" variable
         | "BLOCK" variable
         | "ALLOW" variable
         | "LOG" variable
         | "NOTIFY" variable
```

### 8. Operators

```
operator ::= "=" | "!=" | ">" | ">=" | "<" | "<=" | "LIKE"
```

### 9. Values

```
value ::= string
        | number
        | boolean
        | datetime
        | duration
```

### 10. Lists

```
list ::= "[" value ("," value)* "]"
```

### 11. Patterns

```
pattern ::= regex_pattern
           | wildcard_pattern
```

### 12. Variables

```
variable ::= identifier ("." identifier)*
```

### 13. Identifiers

```
identifier ::= [a-zA-Z_][a-zA-Z0-9_]*
```

### 14. Literals

#### String
```
string ::= '"' [^"]* '"'
         | "'" [^']* "'"
```

#### Number
```
number ::= integer
         | float
```

#### Integer
```
integer ::= [0-9]+
```

#### Float
```
float ::= [0-9]+ "." [0-9]+
        | [0-9]+ "." [0-9]+ [eE] [+-]? [0-9]+
```

#### Boolean
```
boolean ::= "TRUE" | "FALSE"
           | "true" | "false"
```

#### DateTime
```
datetime ::= iso8601_datetime
```

#### Duration
```
duration ::= number unit
            | number unit "AND" number unit
```

#### Units
```
unit ::= "SECOND" | "SECONDS"
        | "MINUTE" | "MINUTES"
        | "HOUR" | "HOURS"
        | "DAY" | "DAYS"
        | "WEEK" | "WEEKS"
        | "MONTH" | "MONTHS"
        | "YEAR" | "YEARS"
```

## BNF Grammar

```
<rule> ::= <condition_clause> <consequence_clause>
         | <condition_clause> <action_clause>

<condition_clause> ::= "WHEN" <condition>
                     | "IF" <condition>

<condition> ::= <simple_condition>
              | <compound_condition>
              | <temporal_condition>

<simple_condition> ::= <variable> <operator> <value>
                     | <variable> "IN" <list>
                     | <variable> "CONTAINS" <value>
                     | <variable> "MATCHES" <pattern>

<compound_condition> ::= <condition> "AND" <condition>
                       | <condition> "OR" <condition>
                       | "NOT" <condition>
                       | "(" <condition> ")"

<temporal_condition> ::= <variable> "BEFORE" <datetime>
                      | <variable> "AFTER" <datetime>
                      | <variable> "WITHIN" <duration>
                      | <variable> "EXPIRES" "AFTER" <duration>

<consequence_clause> ::= "THEN" <consequence>
                       | "THEN MUST" <consequence>
                       | "THEN SHOULD" <consequence>

<action_clause> ::= "THEN" <action>
                  | "THEN DO" <action>

<consequence> ::= <boolean_expression>
                 | <constraint>
                 | <requirement>

<boolean_expression> ::= "TRUE"
                       | "FALSE"
                       | <variable>
                       | "NOT" <boolean_expression>
                       | <boolean_expression> "AND" <boolean_expression>
                       | <boolean_expression> "OR" <boolean_expression>

<constraint> ::= <variable> <operator> <value>
               | <variable> "IN" <list>
               | <variable> "BETWEEN" <value> "AND" <value>
               | <variable> "NOT IN" <list>

<requirement> ::= "REQUIRE" <variable>
                 | "ENSURE" <variable>
                 | "VALIDATE" <variable>

<action> ::= "FLAG" <variable>
            | "ALERT" <variable>
            | "BLOCK" <variable>
            | "ALLOW" <variable>
            | "LOG" <variable>
            | "NOTIFY" <variable>

<operator> ::= "=" | "!=" | ">" | ">=" | "<" | "<=" | "LIKE"

<value> ::= <string>
          | <number>
          | <boolean>
          | <datetime>
          | <duration>

<list> ::= "[" <value> ("," <value>)* "]"

<pattern> ::= <regex_pattern>
             | <wildcard_pattern>

<variable> ::= <identifier> ("." <identifier>)*

<identifier> ::= [a-zA-Z_][a-zA-Z0-9_]*

<string> ::= '"' [^"]* '"'
           | "'" [^']* "'"

<number> ::= <integer>
           | <float>

<integer> ::= [0-9]+

<float> ::= [0-9]+ "." [0-9]+
          | [0-9]+ "." [0-9]+ [eE] [+-]? [0-9]+

<boolean> ::= "TRUE" | "FALSE"
             | "true" | "false"

<datetime> ::= <iso8601_datetime>

<duration> ::= <number> <unit>
              | <number> <unit> "AND" <number> <unit>

<unit> ::= "SECOND" | "SECONDS"
          | "MINUTE" | "MINUTES"
          | "HOUR" | "HOURS"
          | "DAY" | "DAYS"
          | "WEEK" | "WEEKS"
          | "MONTH" | "MONTHS"
          | "YEAR" | "YEARS"
```

## Example Rules

### Basic Rule
```
WHEN user.age >= 18 THEN MUST account.is_active = TRUE
```

### Complex Condition
```
WHEN transaction.amount > 10000 AND transaction.country IN ["IR", "KP", "SY"] THEN MUST FLAG transaction as_high_risk
```

### Temporal Rule
```
WHEN consent.given BEFORE 2025-01-01T00:00:00Z THEN MUST consent.expires AFTER 2025-12-31T23:59:59Z
```

### Pattern Matching
```
WHEN email MATCHES ".*@bank\.com" THEN MUST user.is_verified = TRUE
```

### Duration Rule
```
WHEN session.last_activity WITHIN 30 MINUTES THEN MUST session.is_active = TRUE
```

## Reserved Keywords

The following keywords are reserved and cannot be used as variable names:

```
WHEN, IF, THEN, MUST, SHOULD, DO, AND, OR, NOT, IN, CONTAINS, MATCHES, BEFORE, AFTER, WITHIN, EXPIRES, BETWEEN, REQUIRE, ENSURE, VALIDATE, FLAG, ALERT, BLOCK, ALLOW, LOG, NOTIFY, TRUE, FALSE
```

## Data Types

### String
Text values enclosed in single or double quotes.

### Number
Integer or floating-point values.

### Boolean
TRUE or FALSE values.

### DateTime
ISO 8601 formatted datetime strings.

### Duration
Time duration with units (e.g., "30 MINUTES", "1 DAY AND 6 HOURS").

### List
Array of values enclosed in square brackets.

### Pattern
Regular expression or wildcard pattern for string matching.

## Implementation Notes

### Case Sensitivity
- Keywords are case-insensitive (WHEN, when, When are equivalent)
- Variable names are case-sensitive
- String values are case-sensitive unless specified otherwise

### Comments
Comments are not supported in the current version.

### Error Handling
- Syntax errors should be reported with line and column information
- Semantic errors should include descriptive messages
- Undefined variables should be treated as errors

### Evaluation Order
- Conditions are evaluated left-to-right
- AND operators have higher precedence than OR operators
- Parentheses can be used to override default precedence

## Extensibility

The grammar is designed to be extensible for future versions:

1. **New Operators**: Additional comparison and logical operators can be added
2. **New Actions**: More action types can be introduced
3. **New Data Types**: Additional data types can be supported
4. **New Condition Types**: More complex condition types can be added

## Version History

### v1.0 (2025-01-15)
- Initial release
- Basic rule structure with conditions and consequences
- Support for simple and compound conditions
- Temporal condition support
- Action and consequence clauses
- Basic data types and operators