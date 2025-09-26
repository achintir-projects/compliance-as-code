import { ModelCard } from '@/lib/model-cards/ModelCardSystem';
import { DSLRule } from '@/lib/compliance/DSLCompiler';

export interface SBOMComponent {
  name: string;
  version: string;
  type: 'library' | 'framework' | 'tool' | 'platform' | 'application' | 'agent';
  supplier?: string;
  author?: string;
  description?: string;
  license?: string;
  copyright?: string;
  hashes?: {
    algorithm: 'SHA-256' | 'SHA-1' | 'MD5';
    value: string;
  }[];
  purl?: string; // Package URL
  cpe?: string; // Common Platform Enumeration
  modified?: boolean;
  externalReferences?: {
    type: 'website' | 'vcs' | 'documentation' | 'issue-tracker' | 'license';
    url: string;
  }[];
}

export interface SBOMDependency {
  ref: string;
  dependsOn: string[];
  relationship: 'DEPENDS_ON' | 'DEV_DEPENDENCY_OF' | 'OPTIONAL_DEPENDENCY_OF' | 'PROVIDED_DEPENDENCY_OF';
}

export interface SBOMVulnerability {
  id: string;
  source: {
    name: string;
    url: string;
  };
  ratings: {
    score: number;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    method: 'CVSS-v3.1' | 'CVSS-v3.0' | 'CVSS-v2.0' | 'OWASP';
    vector?: string;
  }[];
  description: string;
  published: Date;
  updated: Date;
  affects: {
    ref: string;
    versions: {
      version: string;
      status: 'affected' | 'unaffected' | 'unknown';
    }[];
  }[];
}

export interface SBOMSignature {
  keyId: string;
  algorithm: 'ECDSA' | 'RSA' | 'Ed25519';
  signature: string;
  publicKey: string;
  certificate?: string;
  signedAt: Date;
  signer: {
    name: string;
    email?: string;
  };
}

export interface SBOMDocument {
  bomFormat: 'CycloneDX' | 'SPDX';
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: Date;
    authors: {
      name: string;
      email?: string;
      phone?: string;
    }[];
    component: SBOMComponent;
    manufacture?: {
      name: string;
      url?: string;
    };
    supplier?: {
      name: string;
      url?: string;
    };
    licenses?: {
      expression: string;
    };
    properties?: {
      name: string;
      value: string;
    }[];
  };
  components: SBOMComponent[];
  dependencies?: SBOMDependency[];
  vulnerabilities?: SBOMVulnerability[];
  signature?: SBOMSignature;
}

export interface AgentPackage {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'compliance' | 'risk' | 'fraud' | 'kyc' | 'aml' | 'regulatory';
  modelCard?: ModelCard;
  rules: DSLRule[];
  dependencies: {
    runtime: SBOMComponent[];
    development: SBOMComponent[];
    optional: SBOMComponent[];
  };
  buildInfo: {
    buildDate: Date;
    buildNumber: string;
    commitHash: string;
    buildEnvironment: {
      os: string;
      nodeVersion: string;
      architecture: string;
    };
  };
  deployment: {
    environment: 'development' | 'staging' | 'production';
    endpoint?: string;
    configuration: Record<string, any>;
  };
  security: {
    signed: boolean;
    signature?: SBOMSignature;
    vulnerabilityScanCompleted: boolean;
    lastVulnerabilityScan?: Date;
    complianceChecks: {
      framework: string;
      status: 'pass' | 'fail' | 'warning';
      lastChecked: Date;
    }[];
  };
}

export interface SBOMGenerationOptions {
  format: 'CycloneDX' | 'SPDX' | 'both';
  includeVulnerabilities: boolean;
  includeSignatures: boolean;
  includeDependencies: boolean;
  signingOptions?: {
    privateKey: string;
    publicKey: string;
    signer: {
      name: string;
      email?: string;
    };
  };
}

export class SBOMGenerator {
  private vulnerabilityDatabase: Map<string, SBOMVulnerability> = new Map();
  private componentRegistry: Map<string, SBOMComponent> = new Map();

  constructor() {
    this.initializeComponentRegistry();
  }

  async generateSBOM(
    agentPackage: AgentPackage,
    options: SBOMGenerationOptions = {
      format: 'CycloneDX',
      includeVulnerabilities: true,
      includeSignatures: true,
      includeDependencies: true
    }
  ): Promise<{ cycloneDX?: SBOMDocument; spdx?: SBOMDocument }> {
    const results: { cycloneDX?: SBOMDocument; spdx?: SBOMDocument } = {};

    if (options.format === 'CycloneDX' || options.format === 'both') {
      results.cycloneDX = await this.generateCycloneDXSBOM(agentPackage, options);
    }

    if (options.format === 'SPDX' || options.format === 'both') {
      results.spdx = await this.generateSPDXSBOM(agentPackage, options);
    }

    return results;
  }

  private async generateCycloneDXSBOM(
    agentPackage: AgentPackage,
    options: SBOMGenerationOptions
  ): Promise<SBOMDocument> {
    const mainComponent: SBOMComponent = {
      name: agentPackage.name,
      version: agentPackage.version,
      type: 'agent',
      description: agentPackage.description,
      supplier: agentPackage.modelCard?.modelDetails.framework ? 
        { name: agentPackage.modelCard.modelDetails.framework } : undefined,
      hashes: [
        {
          algorithm: 'SHA-256',
          value: this.generateComponentHash(agentPackage)
        }
      ],
      purl: `pkg:aura/${agentPackage.name}@${agentPackage.version}`,
      externalReferences: [
        {
          type: 'documentation',
          url: 'https://docs.aura-ai.com'
        }
      ]
    };

    const allComponents = this.collectAllComponents(agentPackage, options);
    
    const dependencies = options.includeDependencies ? 
      this.generateDependencies(agentPackage) : undefined;

    const vulnerabilities = options.includeVulnerabilities ?
      await this.scanForVulnerabilities(allComponents) : undefined;

    let signature: SBOMSignature | undefined;
    if (options.includeSignatures && options.signingOptions) {
      signature = await this.signSBOM(options.signingOptions);
    }

    return {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      serialNumber: `urn:uuid:${this.generateUUID()}`,
      version: 1,
      metadata: {
        timestamp: new Date(),
        authors: [
          {
            name: 'AURA Compliance System',
            email: 'compliance@aura-ai.com'
          }
        ],
        component: mainComponent,
        properties: [
          {
            name: 'aura:agent:type',
            value: agentPackage.type
          },
          {
            name: 'aura:build:commit',
            value: agentPackage.buildInfo.commitHash
          },
          {
            name: 'aura:build:number',
            value: agentPackage.buildInfo.buildNumber
          }
        ]
      },
      components: allComponents,
      dependencies,
      vulnerabilities,
      signature
    };
  }

  private async generateSPDXSBOM(
    agentPackage: AgentPackage,
    options: SBOMGenerationOptions
  ): Promise<SBOMDocument> {
    const mainComponent: SBOMComponent = {
      name: agentPackage.name,
      version: agentPackage.version,
      type: 'application',
      description: agentPackage.description,
      license: 'Apache-2.0',
      copyright: `Copyright ${new Date().getFullYear()} AURA AI Systems`,
      hashes: [
        {
          algorithm: 'SHA-256',
          value: this.generateComponentHash(agentPackage)
        }
      ]
    };

    const allComponents = this.collectAllComponents(agentPackage, options);

    let signature: SBOMSignature | undefined;
    if (options.includeSignatures && options.signingOptions) {
      signature = await this.signSBOM(options.signingOptions);
    }

    return {
      bomFormat: 'SPDX',
      specVersion: '2.3',
      serialNumber: `SPDXRef-${this.generateUUID()}`,
      version: 1,
      metadata: {
        timestamp: new Date(),
        authors: [
          {
            name: 'AURA Compliance System',
            email: 'compliance@aura-ai.com'
          }
        ],
        component: mainComponent,
        licenses: {
          expression: 'Apache-2.0'
        }
      },
      components: allComponents,
      signature
    };
  }

  private collectAllComponents(
    agentPackage: AgentPackage,
    options: SBOMGenerationOptions
  ): SBOMComponent[] {
    const components: SBOMComponent[] = [];

    // Add runtime dependencies
    if (options.includeDependencies) {
      components.push(...agentPackage.dependencies.runtime);
      
      // Add development dependencies if needed
      if (options.format === 'SPDX') {
        components.push(...agentPackage.dependencies.development);
      }
      
      // Add optional dependencies
      components.push(...agentPackage.dependencies.optional);
    }

    // Add framework components
    if (agentPackage.modelCard?.modelDetails.framework) {
      components.push({
        name: agentPackage.modelCard.modelDetails.framework,
        version: agentPackage.modelCard.version,
        type: 'framework',
        description: `${agentPackage.modelCard.modelDetails.framework} framework`,
        purl: `pkg:npm/${agentPackage.modelCard.modelDetails.framework}@${agentPackage.modelCard.version}`
      });
    }

    // Add Node.js runtime
    components.push({
      name: 'Node.js',
      version: agentPackage.buildInfo.buildEnvironment.nodeVersion,
      type: 'platform',
      description: 'Node.js runtime environment',
      purl: `pkg:generic/nodejs@${agentPackage.buildInfo.buildEnvironment.nodeVersion}`
    });

    return components;
  }

  private generateDependencies(agentPackage: AgentPackage): SBOMDependency[] {
    const dependencies: SBOMDependency[] = [];
    
    // Main package dependencies
    for (const dep of agentPackage.dependencies.runtime) {
      dependencies.push({
        ref: `pkg:aura/${agentPackage.name}@${agentPackage.version}`,
        dependsOn: [dep.purl || `${dep.name}@${dep.version}`],
        relationship: 'DEPENDS_ON'
      });
    }

    return dependencies;
  }

  private async scanForVulnerabilities(components: SBOMComponent[]): Promise<SBOMVulnerability[]> {
    const vulnerabilities: SBOMVulnerability[] = [];

    for (const component of components) {
      const componentVulns = await this.checkComponentVulnerabilities(component);
      vulnerabilities.push(...componentVulns);
    }

    return vulnerabilities;
  }

  private async checkComponentVulnerabilities(component: SBOMComponent): Promise<SBOMVulnerability[]> {
    // This is a simplified vulnerability check
    // In practice, you would integrate with services like:
    // - GitHub Advisory Database
    // - OWASP Dependency-Check
    // - Snyk
    // - Trivy
    
    const vulnerabilities: SBOMVulnerability[] = [];
    
    // Simulate some known vulnerabilities for demonstration
    const knownVulnerabilities = [
      {
        componentPattern: /express/i,
        vuln: {
          id: 'CVE-2023-1234',
          source: { name: 'NVD', url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-1234' },
          ratings: [{
            score: 7.5,
            severity: 'high' as const,
            method: 'CVSS-v3.1' as const,
            vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N'
          }],
          description: 'High severity vulnerability in Express.js',
          published: new Date('2023-01-01'),
          updated: new Date('2023-01-15')
        }
      },
      {
        componentPattern: /react/i,
        vuln: {
          id: 'CVE-2023-5678',
          source: { name: 'NVD', url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-5678' },
          ratings: [{
            score: 5.4,
            severity: 'medium' as const,
            method: 'CVSS-v3.1' as const,
            vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N'
          }],
          description: 'Medium severity vulnerability in React',
          published: new Date('2023-02-01'),
          updated: new Date('2023-02-10')
        }
      }
    ];

    for (const { componentPattern, vuln } of knownVulnerabilities) {
      if (componentPattern.test(component.name)) {
        vulnerabilities.push({
          ...vuln,
          affects: [{
            ref: component.purl || `${component.name}@${component.version}`,
            versions: [{
              version: component.version,
              status: 'affected' as const
            }]
          }]
        });
      }
    }

    return vulnerabilities;
  }

  private async signSBOM(signingOptions: {
    privateKey: string;
    publicKey: string;
    signer: {
      name: string;
      email?: string;
    };
  }): Promise<SBOMSignature> {
    // Create a simple signature (in practice, use sigstore/cosign)
    const data = JSON.stringify(signingOptions);
    const signature = Buffer.from(data).toString('base64'); // Simplified signature
    
    return {
      keyId: this.generateUUID(),
      algorithm: 'RSA',
      signature,
      publicKey: signingOptions.publicKey,
      signedAt: new Date(),
      signer: signingOptions.signer
    };
  }

  private generateComponentHash(agentPackage: AgentPackage): string {
    const data = JSON.stringify({
      name: agentPackage.name,
      version: agentPackage.version,
      buildDate: agentPackage.buildInfo.buildDate,
      commitHash: agentPackage.buildInfo.commitHash,
      rules: agentPackage.rules.length
    });
    
    // Simple hash generation (in practice, use proper crypto)
    return Buffer.from(data).toString('base64').substring(0, 64);
  }

  private generateUUID(): string {
    // Simple UUID generation (in practice, use proper UUID library)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Component Registry Management
  registerComponent(component: SBOMComponent): void {
    const key = `${component.name}@${component.version}`;
    this.componentRegistry.set(key, component);
  }

  getComponent(name: string, version: string): SBOMComponent | undefined {
    const key = `${name}@${version}`;
    return this.componentRegistry.get(key);
  }

  getAllComponents(): SBOMComponent[] {
    return Array.from(this.componentRegistry.values());
  }

  // Vulnerability Database Management
  addVulnerability(vulnerability: SBOMVulnerability): void {
    this.vulnerabilityDatabase.set(vulnerability.id, vulnerability);
  }

  getVulnerability(id: string): SBOMVulnerability | undefined {
    return this.vulnerabilityDatabase.get(id);
  }

  getVulnerabilitiesForComponent(componentName: string, componentVersion: string): SBOMVulnerability[] {
    return Array.from(this.vulnerabilityDatabase.values()).filter(vuln =>
      vuln.affects.some(affect =>
        affect.ref.includes(componentName) &&
        affect.versions.some(v => v.version === componentVersion && v.status === 'affected')
      )
    );
  }

  // SBOM Validation
  async validateSBOM(sbom: SBOMDocument): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    compliance: {
      spdx: boolean;
      cycloneDX: boolean;
      ntia: boolean;
    };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const compliance = {
      spdx: false,
      cycloneDX: false,
      ntia: false
    };

    // Basic validation
    if (!sbom.metadata?.component) {
      errors.push('Missing main component in SBOM metadata');
    }

    if (!sbom.metadata?.timestamp) {
      errors.push('Missing timestamp in SBOM metadata');
    }

    // Format-specific validation
    if (sbom.bomFormat === 'CycloneDX') {
      compliance.cycloneDX = this.validateCycloneDX(sbom);
    } else if (sbom.bomFormat === 'SPDX') {
      compliance.spdx = this.validateSPDX(sbom);
    }

    // NTIA minimum elements validation
    compliance.ntia = this.validateNTIAMinimumElements(sbom);

    // Signature validation
    if (sbom.signature) {
      const signatureValid = await this.validateSignature(sbom);
      if (!signatureValid) {
        errors.push('Invalid SBOM signature');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      compliance
    };
  }

  private validateCycloneDX(sbom: SBOMDocument): boolean {
    return sbom.bomFormat === 'CycloneDX' && 
           sbom.specVersion.startsWith('1.') &&
           !!sbom.metadata?.component;
  }

  private validateSPDX(sbom: SBOMDocument): boolean {
    return sbom.bomFormat === 'SPDX' && 
           sbom.specVersion.startsWith('2.') &&
           !!sbom.metadata?.component;
  }

  private validateNTIAMinimumElements(sbom: SBOMDocument): boolean {
    const component = sbom.metadata?.component;
    if (!component) return false;

    // NTIA minimum elements:
    // 1. All component names
    // 2. All component versions
    // 3. All component identifiers
    // 4. Supplier name
    // 5. Component relationship
    
    const hasName = !!component.name;
    const hasVersion = !!component.version;
    const hasIdentifier = !!(component.purl || component.cpe);
    const hasSupplier = !!component.supplier;
    const hasRelationships = sbom.dependencies && sbom.dependencies.length > 0;

    return hasName && hasVersion && hasIdentifier && (hasSupplier || hasRelationships);
  }

  private async validateSignature(sbom: SBOMDocument): Promise<boolean> {
    if (!sbom.signature) return true; // No signature to validate

    // Simplified signature validation
    // In practice, use sigstore/cosign for proper validation
    try {
      // Basic validation - just check if signature exists and has required fields
      return !!sbom.signature.signature && 
             !!sbom.signature.publicKey && 
             !!sbom.signature.keyId;
    } catch (error) {
      return false;
    }
  }

  // Export/Import SBOM
  exportSBOM(sbom: SBOMDocument, format: 'json' | 'xml' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(sbom, null, 2);
    }

    // XML export would require a proper XML library
    throw new Error('XML export not implemented');
  }

  importSBOM(jsonData: string): SBOMDocument {
    return JSON.parse(jsonData);
  }

  // Generate compliance report
  generateComplianceReport(sbom: SBOMDocument): string {
    const vulnCount = sbom.vulnerabilities?.length || 0;
    const criticalVulns = sbom.vulnerabilities?.filter(v => 
      v.ratings.some(r => r.severity === 'critical')
    ).length || 0;
    const highVulns = sbom.vulnerabilities?.filter(v => 
      v.ratings.some(r => r.severity === 'high')
    ).length || 0;

    let report = `# SBOM Compliance Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Format**: ${sbom.bomFormat} v${sbom.specVersion}\n`;
    report += `**Component**: ${sbom.metadata?.component?.name}@${sbom.metadata?.component?.version}\n\n`;

    report += `## Security Summary\n`;
    report += `- **Total Vulnerabilities**: ${vulnCount}\n`;
    report += `- **Critical**: ${criticalVulns}\n`;
    report += `- **High**: ${highVulns}\n`;
    report += `- **Signed**: ${sbom.signature ? '✅' : '❌'}\n\n`;

    if (vulnCount > 0) {
      report += `## Vulnerabilities\n\n`;
      for (const vuln of sbom.vulnerabilities || []) {
        const severity = vuln.ratings[0]?.severity || 'unknown';
        report += `### ${vuln.id} (${severity.toUpperCase()})\n`;
        report += `- **Description**: ${vuln.description}\n`;
        report += `- **Published**: ${vuln.published.toISOString()}\n`;
        report += `- **Score**: ${vuln.ratings[0]?.score}\n\n`;
      }
    }

    return report;
  }

  private initializeComponentRegistry(): void {
    // Initialize with common components
    const commonComponents: SBOMComponent[] = [
      {
        name: 'next',
        version: '14.0.0',
        type: 'framework',
        description: 'React framework for production',
        license: 'MIT',
        purl: 'pkg:npm/next@14.0.0'
      },
      {
        name: 'react',
        version: '18.2.0',
        type: 'library',
        description: 'React JavaScript library',
        license: 'MIT',
        purl: 'pkg:npm/react@18.2.0'
      },
      {
        name: 'typescript',
        version: '5.0.0',
        type: 'library',
        description: 'TypeScript programming language',
        license: 'Apache-2.0',
        purl: 'pkg:npm/typescript@5.0.0'
      },
      {
        name: 'zod',
        version: '3.22.0',
        type: 'library',
        description: 'TypeScript-first schema validation',
        license: 'MIT',
        purl: 'pkg:npm/zod@3.22.0'
      }
    ];

    for (const component of commonComponents) {
      this.registerComponent(component);
    }
  }
}