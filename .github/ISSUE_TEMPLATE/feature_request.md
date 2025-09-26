---
name: Feature Request
description: Suggest a new feature for GlassBox Standard
title: '[FEATURE] '
labels: ['enhancement']
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a new feature! Please provide as much detail as possible to help us understand your request.

  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: Is your feature request related to a problem? Please describe.
      placeholder: I'm frustrated when...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe the solution you'd like
      placeholder: I would like...
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Describe any alternative solutions or features you've considered
      placeholder: I have considered...

  - type: dropdown
    id: area
    attributes:
      label: Area
      description: What area of GlassBox Standard would this feature affect?
      options:
        - Python SDK
        - JavaScript SDK
        - Java SDK
        - Core Specification
        - Documentation
        - Examples
        - Testing
        - Build/CI
        - Multiple Areas
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      description: How important is this feature to you?
      options:
        - Critical - Blocking adoption
        - High - Major improvement needed
        - Medium - Nice to have
        - Low - Minor enhancement
    validations:
      required: true

  - type: textarea
    id: use_cases
    attributes:
      label: Use Cases
      description: Describe specific use cases this feature would enable
      placeholder: |
        1. As a compliance officer, I need to...
        2. As a developer, I want to...
        3. As a regulator, I require...

  - type: textarea
    id: examples
    attributes:
      label: Examples
      description: Provide examples of how this feature would be used
      placeholder: |
        Example 1: ...
        Example 2: ...

  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Any other context, screenshots, or examples about the feature request
      placeholder: Add any other context or screenshots here...

  - type: checkboxes
    id: terms
    attributes:
      label: Checklist
      description: Please confirm the following
      options:
        - label: I have read the [Contributing Guidelines](https://github.com/Glassbox-AI/glassbox-standard/blob/main/CONTRIBUTING.md)
          required: true
        - label: I have searched existing issues for duplicates
          required: true
        - label: I am willing to help implement this feature
          required: false
        - label: I am willing to help test this feature
          required: false
