export interface AgentPackage {
  getName(): string;
  getVersion(): string;
  initialize(): Promise<void>;
  execute(context: AgentExecutionContext): Promise<any>;
}

export interface AgentExecutionContext {
  task: string;
  data: any;
  metadata?: any;
  tenantId: string;
}

export interface AgentPackageConfig {
  name: string;
  version: string;
  type: string;
  tenantId: string;
  config: any;
  enabled: boolean;
}

export interface AgentPackageManifest {
  name: string;
  version: string;
  description: string;
  type: string;
  capabilities: string[];
  dependencies?: string[];
  configSchema?: any;
  author: string;
  license: string;
}

export class AgentPackageManager {
  private packages: Map<string, AgentPackage> = new Map();
  private manifests: Map<string, AgentPackageManifest> = new Map();

  async registerPackage(packageInstance: AgentPackage, manifest: AgentPackageManifest): Promise<void> {
    const packageKey = `${manifest.name}@${manifest.version}`;
    
    // Initialize the package
    await packageInstance.initialize();
    
    // Store package and manifest
    this.packages.set(packageKey, packageInstance);
    this.manifests.set(packageKey, manifest);
    
    console.log(`Registered agent package: ${packageKey}`);
  }

  async executePackage(
    packageName: string,
    version: string,
    context: AgentExecutionContext
  ): Promise<any> {
    const packageKey = `${packageName}@${version}`;
    const packageInstance = this.packages.get(packageKey);
    
    if (!packageInstance) {
      throw new Error(`Agent package not found: ${packageKey}`);
    }
    
    return await packageInstance.execute(context);
  }

  getPackageManifest(packageName: string, version: string): AgentPackageManifest | undefined {
    const packageKey = `${packageName}@${version}`;
    return this.manifests.get(packageKey);
  }

  getAllPackages(): Array<{ manifest: AgentPackageManifest; package: AgentPackage }> {
    const result: Array<{ manifest: AgentPackageManifest; package: AgentPackage }> = [];
    
    for (const [packageKey, packageInstance] of this.packages) {
      const manifest = this.manifests.get(packageKey);
      if (manifest) {
        result.push({ manifest, package: packageInstance });
      }
    }
    
    return result;
  }

  async unregisterPackage(packageName: string, version: string): Promise<void> {
    const packageKey = `${packageName}@${version}`;
    
    this.packages.delete(packageKey);
    this.manifests.delete(packageKey);
    
    console.log(`Unregistered agent package: ${packageKey}`);
  }
}

// Global agent package manager instance
export const agentPackageManager = new AgentPackageManager();