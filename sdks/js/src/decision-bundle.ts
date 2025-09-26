/**
 * GlassBox DecisionBundle Module
 * 
 * This module provides classes for creating, parsing, and managing GlassBox DecisionBundles
 * according to the GlassBox Standard v1.0 specification.
 */

import { ValidationError } from './exceptions';
import { v4 as uuidv4 } from './uuid';

/**
 * Represents a GlassBox DecisionBundle according to the v1.0 specification.
 * 
 * A DecisionBundle contains compliance rules, decisions, evidence, and audit information
 * for regulatory compliance scenarios.
 */
export class DecisionBundle {
  private readonly data: any;

  /**
   * Initialize a DecisionBundle from a data object.
   * @param bundleData - Object containing the DecisionBundle data
   * @throws ValidationError - If the bundle data is invalid
   */
  constructor(bundleData: any) {
    this.data = bundleData;
    this.validate();
  }

  /**
   * Validate the DecisionBundle structure.
   * @throws ValidationError - If validation fails
   */
  private validate(): void {
    const requiredFields = ['version', 'metadata', 'rules', 'decisions'];
    for (const field of requiredFields) {
      if (!(field in this.data)) {
        throw new ValidationError(`Missing required field: ${field}`, field);
      }
    }

    // Validate version
    if (this.data.version !== '1.0') {
      throw new ValidationError(`Unsupported version: ${this.data.version}`, 'version');
    }

    // Validate metadata
    const metadata = this.data.metadata;
    const requiredMetadata = ['id', 'name', 'description', 'created', 'jurisdiction', 'domain'];
    for (const field of requiredMetadata) {
      if (!(field in metadata)) {
        throw new ValidationError(`Missing required metadata field: ${field}`, `metadata.${field}`);
      }
    }

    // Validate domain
    const validDomains = ['finance', 'health', 'esg', 'general'];
    if (!validDomains.includes(metadata.domain)) {
      throw new ValidationError(`Invalid domain: ${metadata.domain}`, 'metadata.domain');
    }

    // Validate rules
    this.data.rules.forEach((rule: any, index: number) => {
      this.validateRule(rule, index);
    });

    // Validate decisions
    this.data.decisions.forEach((decision: any, index: number) => {
      this.validateDecision(decision, index);
    });
  }

  /**
   * Validate a single rule.
   * @param rule - The rule to validate
   * @param index - The index of the rule in the rules array
   * @throws ValidationError - If validation fails
   */
  private validateRule(rule: any, index: number): void {
    const requiredFields = ['id', 'name', 'type', 'definition'];
    for (const field of requiredFields) {
      if (!(field in rule)) {
        throw new ValidationError(`Missing required rule field: ${field}`, `rules[${index}].${field}`);
      }
    }

    // Validate rule type
    const validTypes = ['dsl', 'expression', 'decision_table', 'decision_tree'];
    if (!validTypes.includes(rule.type)) {
      throw new ValidationError(`Invalid rule type: ${rule.type}`, `rules[${index}].type`);
    }
  }

  /**
   * Validate a single decision.
   * @param decision - The decision to validate
   * @param index - The index of the decision in the decisions array
   * @throws ValidationError - If validation fails
   */
  private validateDecision(decision: any, index: number): void {
    const requiredFields = ['id', 'ruleId', 'input', 'output', 'timestamp'];
    for (const field of requiredFields) {
      if (!(field in decision)) {
        throw new ValidationError(`Missing required decision field: ${field}`, `decisions[${index}].${field}`);
      }
    }

    // Validate output
    if (!('result' in decision.output)) {
      throw new ValidationError('Missing output.result', `decisions[${index}].output.result`);
    }
  }

  /**
   * Get the DecisionBundle version.
   */
  get version(): string {
    return this.data.version;
  }

  /**
   * Get the DecisionBundle metadata.
   */
  get metadata(): any {
    return this.data.metadata;
  }

  /**
   * Get the DecisionBundle rules.
   */
  get rules(): any[] {
    return this.data.rules;
  }

  /**
   * Get the DecisionBundle decisions.
   */
  get decisions(): any[] {
    return this.data.decisions;
  }

  /**
   * Get the DecisionBundle evidence.
   */
  get evidence(): any[] {
    return this.data.evidence || [];
  }

  /**
   * Get the DecisionBundle audit information.
   */
  get audit(): any | null {
    return this.data.audit || null;
  }

  /**
   * Get a rule by its ID.
   * @param ruleId - The ID of the rule to find
   * @returns The rule if found, otherwise null
   */
  getRuleById(ruleId: string): any | null {
    return this.rules.find(rule => rule.id === ruleId) || null;
  }

  /**
   * Get all decisions for a specific rule.
   * @param ruleId - The ID of the rule
   * @returns Array of decisions for the rule
   */
  getDecisionsByRuleId(ruleId: string): any[] {
    return this.decisions.filter(decision => decision.ruleId === ruleId);
  }

  /**
   * Get evidence by its ID.
   * @param evidenceId - The ID of the evidence to find
   * @returns The evidence if found, otherwise null
   */
  getEvidenceById(evidenceId: string): any | null {
    return this.evidence.find(evidence => evidence.id === evidenceId) || null;
  }

  /**
   * Convert the DecisionBundle to a plain object.
   * @returns A copy of the DecisionBundle data
   */
  toObject(): any {
    return { ...this.data };
  }

  /**
   * Convert the DecisionBundle to a JSON string.
   * @param indent - The indentation level for pretty printing
   * @returns JSON string representation
   */
  toJSON(indent?: number): string {
    return JSON.stringify(this.data, null, indent);
  }

  /**
   * Load a DecisionBundle from a JSON string.
   * @param jsonString - The JSON string to parse
   * @returns A new DecisionBundle instance
   * @throws ValidationError - If the JSON is invalid
   */
  static fromJSON(jsonString: string): DecisionBundle {
    try {
      const data = JSON.parse(jsonString);
      return new DecisionBundle(data);
    } catch (error) {
      throw new ValidationError(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Builder class for creating DecisionBundles programmatically.
 */
export class DecisionBundleBuilder {
  private bundle: any;

  /**
   * Initialize a new DecisionBundle builder.
   */
  constructor() {
    this.bundle = {
      version: '1.0',
      metadata: {
        id: uuidv4(),
        name: '',
        description: '',
        created: new Date().toISOString(),
        jurisdiction: '',
        domain: 'general',
        tags: []
      },
      rules: [],
      decisions: [],
      evidence: [],
      audit: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: '1.0',
        trail: []
      }
    };
  }

  /**
   * Set the DecisionBundle name.
   * @param name - The name of the DecisionBundle
   * @returns The builder instance for chaining
   */
  setName(name: string): DecisionBundleBuilder {
    this.bundle.metadata.name = name;
    return this;
  }

  /**
   * Set the DecisionBundle description.
   * @param description - The description of the DecisionBundle
   * @returns The builder instance for chaining
   */
  setDescription(description: string): DecisionBundleBuilder {
    this.bundle.metadata.description = description;
    return this;
  }

  /**
   * Set the DecisionBundle jurisdiction.
   * @param jurisdiction - The jurisdiction of the DecisionBundle
   * @returns The builder instance for chaining
   */
  setJurisdiction(jurisdiction: string): DecisionBundleBuilder {
    this.bundle.metadata.jurisdiction = jurisdiction;
    return this;
  }

  /**
   * Set the DecisionBundle domain.
   * @param domain - The domain of the DecisionBundle
   * @returns The builder instance for chaining
   * @throws ValidationError - If the domain is invalid
   */
  setDomain(domain: string): DecisionBundleBuilder {
    const validDomains = ['finance', 'health', 'esg', 'general'];
    if (!validDomains.includes(domain)) {
      throw new ValidationError(`Invalid domain: ${domain}`);
    }
    this.bundle.metadata.domain = domain;
    return this;
  }

  /**
   * Set the DecisionBundle author.
   * @param author - The author of the DecisionBundle
   * @returns The builder instance for chaining
   */
  setAuthor(author: string): DecisionBundleBuilder {
    this.bundle.metadata.author = author;
    return this;
  }

  /**
   * Add a tag to the DecisionBundle.
   * @param tag - The tag to add
   * @returns The builder instance for chaining
   */
  addTag(tag: string): DecisionBundleBuilder {
    if (!this.bundle.metadata.tags.includes(tag)) {
      this.bundle.metadata.tags.push(tag);
    }
    return this;
  }

  /**
   * Add a rule to the DecisionBundle.
   * @param rule - The rule to add
   * @returns The builder instance for chaining
   */
  addRule(rule: any): DecisionBundleBuilder {
    this.bundle.rules.push(rule);
    this.addAuditTrail('rule_added', `Added rule: ${rule.id || 'unknown'}`);
    return this;
  }

  /**
   * Add a decision to the DecisionBundle.
   * @param decision - The decision to add
   * @returns The builder instance for chaining
   */
  addDecision(decision: any): DecisionBundleBuilder {
    this.bundle.decisions.push(decision);
    this.addAuditTrail('decision_added', `Added decision: ${decision.id || 'unknown'}`);
    return this;
  }

  /**
   * Add evidence to the DecisionBundle.
   * @param evidence - The evidence to add
   * @returns The builder instance for chaining
   */
  addEvidence(evidence: any): DecisionBundleBuilder {
    this.bundle.evidence.push(evidence);
    this.addAuditTrail('evidence_added', `Added evidence: ${evidence.id || 'unknown'}`);
    return this;
  }

  /**
   * Add an entry to the audit trail.
   * @param action - The action performed
   * @param details - Details of the action
   */
  private addAuditTrail(action: string, details: string): void {
    this.bundle.audit.modified = new Date().toISOString();
    this.bundle.audit.trail.push({
      timestamp: new Date().toISOString(),
      action,
      user: 'builder',
      details: { reason: details }
    });
  }

  /**
   * Build and return the DecisionBundle.
   * @returns A new DecisionBundle instance
   */
  build(): DecisionBundle {
    return new DecisionBundle({ ...this.bundle });
  }

  /**
   * Get the bundle as a plain object without validation.
   * @returns A copy of the bundle data
   */
  toObject(): any {
    return { ...this.bundle };
  }
}