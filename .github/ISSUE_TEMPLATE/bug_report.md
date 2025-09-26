---
name: Bug Report
description: Report a bug to help us improve GlassBox Standard
title: '[BUG] '
labels: ['bug']
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report! Please provide as much detail as possible to help us understand and reproduce the issue.

  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: A clear and concise description of what the bug is
      placeholder: Describe the bug...
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction Steps
      description: Steps to reproduce the behavior
      placeholder: |
        1. Set up the environment with...
        2. Run the following command...
        3. See error...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: A clear and concise description of what you expected to happen
      placeholder: What should have happened?
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: A clear and concise description of what actually happened
      placeholder: What actually happened?
    validations:
      required: true

  - type: textarea
    id: error
    attributes:
      label: Error Messages
      description: Any error messages or stack traces
      placeholder: Paste error messages here...
      render: shell

  - type: dropdown
    id: sdk
    attributes:
      label: Affected SDK
      description: Which SDK is affected by this bug?
      options:
        - Python SDK
        - JavaScript SDK
        - Java SDK
        - Multiple SDKs
        - Core Specification
        - Documentation
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      description: How severe is this bug?
      options:
        - Critical - Blocks usage
        - High - Major functionality broken
        - Medium - Partial functionality broken
        - Low - Minor issue or inconvenience
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: Version
      description: What version of GlassBox Standard are you using?
      placeholder: v1.0.0
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Information about your environment
      placeholder: |
        OS: Ubuntu 20.04
        Python: 3.9.0
        Node.js: 18.0.0
        Java: 11.0.15
        Maven: 3.8.6

  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Any other context about the problem
      placeholder: Add any other context about the problem here...

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
        - label: I have provided all requested information
          required: true
        - label: I am willing to help fix this issue
          required: false
