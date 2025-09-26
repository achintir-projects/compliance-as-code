import { db } from '@/lib/db';

/**
 * Database initialization utility
 * Ensures all required base entities exist before application startup
 */
export class DatabaseInitializer {
  private static instance: DatabaseInitializer;
  private initialized = false;

  static getInstance(): DatabaseInitializer {
    if (!DatabaseInitializer.instance) {
      DatabaseInitializer.instance = new DatabaseInitializer();
    }
    return DatabaseInitializer.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Starting database initialization...');
      
      // Create system tenant if it doesn't exist
      await this.ensureSystemTenant();
      
      // Create default compliance domain if it doesn't exist
      await this.ensureDefaultComplianceDomain();
      
      // Create default user if it doesn't exist
      await this.ensureDefaultUser();
      
      this.initialized = true;
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async ensureSystemTenant(): Promise<void> {
    try {
      await db.tenant.upsert({
        where: { id: 'system' },
        update: {},
        create: {
          id: 'system',
          name: 'System',
          domain: 'system.local',
          status: 'ACTIVE',
          config: {},
        },
      });
      console.log('System tenant ensured');
    } catch (error) {
      console.error('Error ensuring system tenant:', error);
      throw error;
    }
  }

  private async ensureDefaultComplianceDomain(): Promise<void> {
    try {
      await db.complianceDomain.upsert({
        where: { id: 'default' },
        update: {},
        create: {
          id: 'default',
          name: 'Global Regulatory Compliance',
          description: 'Default compliance domain for global regulatory requirements',
          regulations: JSON.stringify(['AML', 'KYC', 'PSD2', 'Investment', 'Insurance', 'Lending', 'Regulatory']),
          isActive: true,
          metadata: {},
        },
      });
      console.log('Default compliance domain ensured');
    } catch (error) {
      console.error('Error ensuring default compliance domain:', error);
      throw error;
    }
  }

  private async ensureDefaultUser(): Promise<void> {
    try {
      await db.user.upsert({
        where: { email: 'admin@glassbox.ai' },
        update: {},
        create: {
          email: 'admin@glassbox.ai',
          name: 'System Administrator',
          role: 'ADMIN',
          tenantId: 'system',
          status: 'ACTIVE',
        },
      });
      console.log('Default user ensured');
    } catch (error) {
      console.error('Error ensuring default user:', error);
      // Don't throw here as this is not critical for basic functionality
    }
  }

  async isInitialized(): Promise<boolean> {
    return this.initialized;
  }
}

// Export singleton instance
export const dbInitializer = DatabaseInitializer.getInstance();