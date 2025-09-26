import { DSLRule } from '@/lib/compliance/DSLCompiler';
import crypto from 'crypto';

export interface SignedDSLBundle {
  id: string;
  version: string;
  bundleHash: string;
  signature: string;
  publicKey: string;
  certificate?: string;
  signedAt: Date;
  signedBy: string;
  algorithm: 'RSA-SHA256' | 'RSA-SHA384' | 'RSA-SHA512' | 'ECDSA-SHA256' | 'Ed25519';
  bundle: {
    rules: DSLRule[];
    metadata: {
      name: string;
      description: string;
      environment: 'development' | 'staging' | 'production';
      agentId: string;
      createdAt: Date;
      expiresAt?: Date;
    };
  };
}

export interface VerificationResult {
  valid: boolean;
  bundleId: string;
  verifiedAt: Date;
  details: {
    signatureValid: boolean;
    hashValid: boolean;
    certificateValid?: boolean;
    notExpired: boolean;
    notRevoked: boolean;
    trustedSigner: boolean;
  };
  errors: string[];
  warnings: string[];
  metadata: {
    verificationTime: number;
    algorithm: string;
    publicKeyFingerprint: string;
    signerInfo: {
      commonName?: string;
      organization?: string;
      country?: string;
    };
  };
}

export interface CertificateInfo {
  subject: {
    commonName: string;
    organization: string;
    organizationalUnit?: string;
    country: string;
    state?: string;
    locality?: string;
  };
  issuer: {
    commonName: string;
    organization: string;
    country: string;
  };
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  fingerprint: string;
  publicKey: string;
  algorithm: string;
}

export interface TrustAnchor {
  id: string;
  name: string;
  publicKey: string;
  certificate?: string;
  trusted: boolean;
  createdAt: Date;
  expiresAt?: Date;
  metadata: {
    description: string;
    owner: string;
    contact: string;
    usage: 'code-signing' | 'tls' | 'email' | 'document-signing';
  };
}

export class DigitalSignatureVerifier {
  private trustAnchors: Map<string, TrustAnchor> = new Map();
  private verificationCache: Map<string, VerificationResult> = new Map();
  private revokedCertificates: Set<string> = new Set();

  constructor() {
    this.initializeDefaultTrustAnchors();
  }

  async signDSLBundle(
    bundle: {
      rules: DSLRule[];
      metadata: {
        name: string;
        description: string;
        environment: 'development' | 'staging' | 'production';
        agentId: string;
        expiresAt?: Date;
      };
    },
    signingOptions: {
      privateKey: string;
      publicKey: string;
      certificate?: string;
      signedBy: string;
      algorithm?: 'RSA-SHA256' | 'RSA-SHA384' | 'RSA-SHA512' | 'ECDSA-SHA256' | 'Ed25519';
    }
  ): Promise<SignedDSLBundle> {
    const algorithm = signingOptions.algorithm || 'RSA-SHA256';
    
    // Generate bundle hash
    const bundleData = JSON.stringify(bundle);
    const bundleHash = crypto.createHash('sha256').update(bundleData).digest('hex');
    
    // Create signature
    const signature = this.createSignature(bundleHash, signingOptions.privateKey, algorithm);
    
    const signedBundle: SignedDSLBundle = {
      id: `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: '1.0',
      bundleHash,
      signature,
      publicKey: signingOptions.publicKey,
      certificate: signingOptions.certificate,
      signedAt: new Date(),
      signedBy: signingOptions.signedBy,
      algorithm,
      bundle
    };

    return signedBundle;
  }

  async verifyDSLBundle(signedBundle: SignedDSLBundle): Promise<VerificationResult> {
    const startTime = Date.now();
    const bundleId = signedBundle.id;
    
    // Check cache first
    const cachedResult = this.verificationCache.get(bundleId);
    if (cachedResult && Date.now() - cachedResult.verifiedAt.getTime() < 300000) { // 5 minutes cache
      return cachedResult;
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const details = {
      signatureValid: false,
      hashValid: false,
      certificateValid: undefined as boolean | undefined,
      notExpired: false,
      notRevoked: false,
      trustedSigner: false
    };

    try {
      // 1. Verify bundle hash integrity
      const currentBundleHash = crypto.createHash('sha256')
        .update(JSON.stringify(signedBundle.bundle))
        .digest('hex');
      
      details.hashValid = currentBundleHash === signedBundle.bundleHash;
      if (!details.hashValid) {
        errors.push('Bundle hash integrity check failed');
      }

      // 2. Verify signature
      details.signatureValid = this.verifySignature(
        signedBundle.bundleHash,
        signedBundle.signature,
        signedBundle.publicKey,
        signedBundle.algorithm
      );
      
      if (!details.signatureValid) {
        errors.push('Digital signature verification failed');
      }

      // 3. Check expiration
      const now = new Date();
      details.notExpired = !signedBundle.bundle.metadata.expiresAt || 
        signedBundle.bundle.metadata.expiresAt > now;
      
      if (!details.notExpired) {
        errors.push('Bundle has expired');
      }

      // 4. Check certificate if present
      if (signedBundle.certificate) {
        const certInfo = this.parseCertificate(signedBundle.certificate);
        details.certificateValid = this.validateCertificate(certInfo);
        
        if (!details.certificateValid) {
          errors.push('Certificate validation failed');
        }

        // Check if certificate is revoked
        const certFingerprint = certInfo.fingerprint;
        details.notRevoked = !this.revokedCertificates.has(certFingerprint);
        
        if (!details.notRevoked) {
          errors.push('Certificate has been revoked');
        }

        // Check trust anchor
        details.trustedSigner = this.isTrustedSigner(certInfo);
        
        if (!details.trustedSigner) {
          warnings.push('Signer is not a trusted anchor');
        }
      } else {
        // Fallback to public key trust
        details.trustedSigner = this.isTrustedPublicKey(signedBundle.publicKey);
        
        if (!details.trustedSigner) {
          warnings.push('Public key is not in trust anchors');
        }
      }

    } catch (error) {
      errors.push(`Verification error: ${error.message}`);
    }

    const verificationTime = Date.now() - startTime;
    const publicKeyFingerprint = this.generatePublicKeyFingerprint(signedBundle.publicKey);
    
    const result: VerificationResult = {
      valid: errors.length === 0,
      bundleId,
      verifiedAt: new Date(),
      details,
      errors,
      warnings,
      metadata: {
        verificationTime,
        algorithm: signedBundle.algorithm,
        publicKeyFingerprint,
        signerInfo: this.extractSignerInfo(signedBundle.certificate, signedBundle.signedBy)
      }
    };

    // Cache the result
    this.verificationCache.set(bundleId, result);

    return result;
  }

  private createSignature(data: string, privateKey: string, algorithm: string): string {
    const sign = crypto.createSign(algorithm.replace('-', ''));
    sign.update(data);
    return sign.sign(privateKey, 'hex');
  }

  private verifySignature(data: string, signature: string, publicKey: string, algorithm: string): boolean {
    try {
      const verify = crypto.createVerify(algorithm.replace('-', ''));
      verify.update(data);
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  private parseCertificate(certificatePem: string): CertificateInfo {
    // This is a simplified certificate parser
    // In practice, you would use a proper certificate library like node-forge
    
    const cert = crypto.createCertificate(certificatePem);
    
    return {
      subject: {
        commonName: cert.subject.CN || 'Unknown',
        organization: cert.subject.O || 'Unknown',
        organizationalUnit: cert.subject.OU,
        country: cert.subject.C || 'Unknown',
        state: cert.subject.ST,
        locality: cert.subject.L
      },
      issuer: {
        commonName: cert.issuer.CN || 'Unknown',
        organization: cert.issuer.O || 'Unknown',
        country: cert.issuer.C || 'Unknown'
      },
      validFrom: new Date(cert.valid_from),
      validTo: new Date(cert.valid_to),
      serialNumber: cert.serialNumber,
      fingerprint: cert.fingerprint256,
      publicKey: cert.publicKey.export({ type: 'spki', format: 'pem' }),
      algorithm: cert.publicKey.asymmetricKeyType
    };
  }

  private validateCertificate(certInfo: CertificateInfo): boolean {
    const now = new Date();
    
    // Check validity period
    if (certInfo.validFrom > now || certInfo.validTo < now) {
      return false;
    }
    
    // Check basic certificate structure
    if (!certInfo.subject.commonName || !certInfo.issuer.commonName) {
      return false;
    }
    
    return true;
  }

  private isTrustedSigner(certInfo: CertificateInfo): boolean {
    // Check if the certificate is in our trust anchors
    for (const anchor of this.trustAnchors.values()) {
      if (anchor.certificate && anchor.certificate === certInfo.fingerprint) {
        return true;
      }
    }
    
    return false;
  }

  private isTrustedPublicKey(publicKey: string): boolean {
    // Check if the public key is in our trust anchors
    const fingerprint = this.generatePublicKeyFingerprint(publicKey);
    return this.trustAnchors.has(fingerprint);
  }

  private generatePublicKeyFingerprint(publicKey: string): string {
    return crypto.createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .substring(0, 16);
  }

  private extractSignerInfo(certificate?: string, signedBy?: string): VerificationResult['metadata']['signerInfo'] {
    if (certificate) {
      try {
        const certInfo = this.parseCertificate(certificate);
        return {
          commonName: certInfo.subject.commonName,
          organization: certInfo.subject.organization,
          country: certInfo.subject.country
        };
      } catch (error) {
        // Fall back to signedBy
      }
    }
    
    return {
      commonName: signedBy || 'Unknown'
    };
  }

  // Trust Anchor Management
  addTrustAnchor(anchor: TrustAnchor): void {
    const fingerprint = this.generatePublicKeyFingerprint(anchor.publicKey);
    this.trustAnchors.set(fingerprint, anchor);
  }

  removeTrustAnchor(publicKey: string): boolean {
    const fingerprint = this.generatePublicKeyFingerprint(publicKey);
    return this.trustAnchors.delete(fingerprint);
  }

  getTrustAnchors(): TrustAnchor[] {
    return Array.from(this.trustAnchors.values());
  }

  isTrustedAnchor(publicKey: string): boolean {
    const fingerprint = this.generatePublicKeyFingerprint(publicKey);
    return this.trustAnchors.has(fingerprint) && this.trustAnchors.get(fingerprint)!.trusted;
  }

  // Certificate Revocation
  revokeCertificate(certificateFingerprint: string): void {
    this.revokedCertificates.add(certificateFingerprint);
  }

  unrevokeCertificate(certificateFingerprint: string): boolean {
    return this.revokedCertificates.delete(certificateFingerprint);
  }

  getRevokedCertificates(): string[] {
    return Array.from(this.revokedCertificates);
  }

  // Bundle Verification for Agent Startup
  async verifyAgentStartupBundles(bundles: SignedDSLBundle[]): Promise<{
    allValid: boolean;
    results: VerificationResult[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      warnings: number;
    };
    recommendations: string[];
  }> {
    const results: VerificationResult[] = [];
    let validCount = 0;
    let warningCount = 0;
    const recommendations: string[] = [];

    // Verify all bundles
    for (const bundle of bundles) {
      const result = await this.verifyDSLBundle(bundle);
      results.push(result);
      
      if (result.valid) {
        validCount++;
      }
      
      if (result.warnings.length > 0) {
        warningCount++;
      }
    }

    const allValid = results.every(r => r.valid);
    const invalidCount = results.length - validCount;

    // Generate recommendations
    if (!allValid) {
      recommendations.push('Invalid bundles detected. Agent startup blocked for security reasons.');
      recommendations.push('Review and fix signature issues before proceeding.');
    }

    if (warningCount > 0) {
      recommendations.push(`${warningCount} bundle(s) have warnings. Review recommended.`);
    }

    if (results.length === 0) {
      recommendations.push('No DSL bundles found. Consider if this is expected.');
    }

    return {
      allValid,
      results,
      summary: {
        total: results.length,
        valid: validCount,
        invalid: invalidCount,
        warnings: warningCount
      },
      recommendations
    };
  }

  // Generate verification report
  generateVerificationReport(results: VerificationResult[]): string {
    const validCount = results.filter(r => r.valid).length;
    const invalidCount = results.length - validCount;
    
    let report = `# DSL Bundle Verification Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Total Bundles**: ${results.length}\n`;
    report += `**Valid**: ${validCount}\n`;
    report += `**Invalid**: ${invalidCount}\n\n`;

    // Summary
    if (invalidCount === 0) {
      report += `## ✅ All bundles verified successfully\n\n`;
    } else {
      report += `## ❌ ${invalidCount} bundle(s) failed verification\n\n`;
    }

    // Detailed results
    report += `## Detailed Results\n\n`;
    
    for (const result of results) {
      const status = result.valid ? '✅' : '❌';
      report += `### ${status} Bundle: ${result.bundleId}\n`;
      report += `- **Verified**: ${result.verifiedAt.toISOString()}\n`;
      report += `- **Algorithm**: ${result.metadata.algorithm}\n`;
      report += `- **Public Key Fingerprint**: ${result.metadata.publicKeyFingerprint}\n`;
      report += `- **Signer**: ${result.metadata.signerInfo.commonName}\n\n`;
      
      if (result.errors.length > 0) {
        report += `**Errors**:\n`;
        for (const error of result.errors) {
          report += `- ${error}\n`;
        }
        report += `\n`;
      }
      
      if (result.warnings.length > 0) {
        report += `**Warnings**:\n`;
        for (const warning of result.warnings) {
          report += `- ${warning}\n`;
        }
        report += `\n`;
      }
      
      report += `**Details**:\n`;
      report += `- Signature Valid: ${result.details.signatureValid ? '✅' : '❌'}\n`;
      report += `- Hash Valid: ${result.details.hashValid ? '✅' : '❌'}\n`;
      if (result.details.certificateValid !== undefined) {
        report += `- Certificate Valid: ${result.details.certificateValid ? '✅' : '❌'}\n`;
      }
      report += `- Not Expired: ${result.details.notExpired ? '✅' : '❌'}\n`;
      report += `- Not Revoked: ${result.details.notRevoked ? '✅' : '❌'}\n`;
      report += `- Trusted Signer: ${result.details.trustedSigner ? '✅' : '❌'}\n`;
      report += `- Verification Time: ${result.metadata.verificationTime}ms\n\n`;
    }

    return report;
  }

  // Export/Import trust anchors
  exportTrustAnchors(): string {
    const anchors = Array.from(this.trustAnchors.values());
    return JSON.stringify(anchors, null, 2);
  }

  importTrustAnchors(jsonData: string): void {
    const anchors: TrustAnchor[] = JSON.parse(jsonData);
    for (const anchor of anchors) {
      this.addTrustAnchor(anchor);
    }
  }

  // Clear verification cache
  clearVerificationCache(): void {
    this.verificationCache.clear();
  }

  // Get verification statistics
  getVerificationStats(): {
    totalVerifications: number;
    cacheSize: number;
    trustAnchorCount: number;
    revokedCertificateCount: number;
  } {
    return {
      totalVerifications: this.verificationCache.size,
      cacheSize: this.verificationCache.size,
      trustAnchorCount: this.trustAnchors.size,
      revokedCertificateCount: this.revokedCertificates.size
    };
  }

  private initializeDefaultTrustAnchors(): void {
    // Initialize with some default trust anchors for development
    // In production, these would be properly configured
    
    const devAnchor: TrustAnchor = {
      id: 'dev_anchor_1',
      name: 'Development Signing Key',
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
      trusted: true,
      createdAt: new Date(),
      metadata: {
        description: 'Development environment signing key',
        owner: 'Development Team',
        contact: 'dev@example.com',
        usage: 'code-signing'
      }
    };

    this.addTrustAnchor(devAnchor);
  }
}