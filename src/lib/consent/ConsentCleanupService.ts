import { ConsentService } from './ConsentService';

export class ConsentCleanupService {
  private static instance: ConsentCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  static getInstance(): ConsentCleanupService {
    if (!ConsentCleanupService.instance) {
      ConsentCleanupService.instance = new ConsentCleanupService();
    }
    return ConsentCleanupService.instance;
  }

  /**
   * Start the background cleanup service
   */
  start() {
    if (this.cleanupInterval) {
      console.log('Consent cleanup service is already running');
      return;
    }

    console.log('Starting consent cleanup service...');
    
    // Run cleanup immediately on start
    this.runCleanup().catch(console.error);
    
    // Schedule regular cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup().catch(console.error);
    }, this.CLEANUP_INTERVAL_MS);

    console.log(`Consent cleanup service scheduled to run every ${this.CLEANUP_INTERVAL_MS / (60 * 60 * 1000)} hours`);
  }

  /**
   * Stop the background cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Consent cleanup service stopped');
    }
  }

  /**
   * Run the cleanup process
   */
  private async runCleanup() {
    try {
      console.log('Running consent cleanup...');
      
      const revokedConsents = await ConsentService.autoRevokeExpiredConsents();
      
      if (revokedConsents.length > 0) {
        console.log(`Auto-revoked ${revokedConsents.length} expired consents`);
        
        // Log summary of cleanup
        const summary = {
          totalRevoked: revokedConsents.length,
          revokedByType: revokedConsents.reduce((acc, consent) => {
            acc[consent.consentType] = (acc[consent.consentType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          timestamp: new Date().toISOString()
        };
        
        console.log('Cleanup summary:', summary);
      } else {
        console.log('No expired consents found for cleanup');
      }
    } catch (error) {
      console.error('Error during consent cleanup:', error);
    }
  }

  /**
   * Run cleanup manually for a specific tenant
   */
  async runCleanupForTenant(tenantId: string) {
    try {
      console.log(`Running consent cleanup for tenant: ${tenantId}`);
      
      const revokedConsents = await ConsentService.autoRevokeExpiredConsents(tenantId);
      
      console.log(`Auto-revoked ${revokedConsents.length} expired consents for tenant ${tenantId}`);
      
      return {
        success: true,
        revokedCount: revokedConsents.length,
        revokedConsents
      };
    } catch (error) {
      console.error(`Error during consent cleanup for tenant ${tenantId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        revokedCount: 0
      };
    }
  }

  /**
   * Get cleanup service status
   */
  getStatus() {
    return {
      isRunning: this.cleanupInterval !== null,
      intervalMs: this.CLEANUP_INTERVAL_MS,
      nextRun: this.cleanupInterval ? 
        new Date(Date.now() + this.CLEANUP_INTERVAL_MS).toISOString() : 
        null
    };
  }
}