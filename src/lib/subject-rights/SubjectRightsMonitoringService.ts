import { SubjectRightsService } from './SubjectRightsService';

export class SubjectRightsMonitoringService {
  private static instance: SubjectRightsMonitoringService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  private constructor() {}

  static getInstance(): SubjectRightsMonitoringService {
    if (!SubjectRightsMonitoringService.instance) {
      SubjectRightsMonitoringService.instance = new SubjectRightsMonitoringService();
    }
    return SubjectRightsMonitoringService.instance;
  }

  /**
   * Start the background monitoring service
   */
  start() {
    if (this.monitoringInterval) {
      console.log('Subject rights monitoring service is already running');
      return;
    }

    console.log('Starting subject rights monitoring service...');
    
    // Run monitoring immediately on start
    this.runMonitoring().catch(console.error);
    
    // Schedule regular monitoring
    this.monitoringInterval = setInterval(() => {
      this.runMonitoring().catch(console.error);
    }, this.MONITORING_INTERVAL_MS);

    console.log(`Subject rights monitoring service scheduled to run every ${this.MONITORING_INTERVAL_MS / (60 * 60 * 1000)} hours`);
  }

  /**
   * Stop the background monitoring service
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Subject rights monitoring service stopped');
    }
  }

  /**
   * Run the monitoring process
   */
  private async runMonitoring() {
    try {
      console.log('Running subject rights monitoring...');
      
      // Check for overdue requests and escalate them
      const escalatedRequests = await SubjectRightsService.checkOverdueRequests();
      
      if (escalatedRequests.length > 0) {
        console.log(`Escalated ${escalatedRequests.length} overdue subject rights requests`);
        
        // Log summary of monitoring
        const summary = {
          totalEscalated: escalatedRequests.length,
          escalatedByType: escalatedRequests.reduce((acc, request) => {
            acc[request.requestType] = (acc[request.requestType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          escalatedByJurisdiction: escalatedRequests.reduce((acc, request) => {
            const jurisdiction = request.jurisdiction || 'Unknown';
            acc[jurisdiction] = (acc[jurisdiction] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          timestamp: new Date().toISOString()
        };
        
        console.log('Monitoring summary:', summary);
      } else {
        console.log('No overdue subject rights requests found');
      }

      // Additional monitoring tasks can be added here
      await this.checkComplianceMetrics();
      await this.generateAlerts();
      
    } catch (error) {
      console.error('Error during subject rights monitoring:', error);
    }
  }

  /**
   * Check compliance metrics and generate reports
   */
  private async checkComplianceMetrics() {
    try {
      // Get statistics for system tenant
      const stats = await SubjectRightsService.getSubjectRightsStats('system');
      
      // Calculate compliance metrics
      const totalRequests = stats.total;
      const completedRequests = stats.byStatus['COMPLETED'] || 0;
      const overdueRequests = stats.overdue;
      
      const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 100;
      const overdueRate = totalRequests > 0 ? (overdueRequests / totalRequests) * 100 : 0;
      
      const avgProcessingTimeHours = stats.avgProcessingTimeMs / (1000 * 60 * 60);
      
      const complianceMetrics = {
        completionRate: Math.round(completionRate * 100) / 100,
        overdueRate: Math.round(overdueRate * 100) / 100,
        avgProcessingTimeHours: Math.round(avgProcessingTimeHours * 100) / 100,
        totalRequests,
        completedRequests,
        overdueRequests,
        timestamp: new Date().toISOString()
      };
      
      console.log('Compliance metrics:', complianceMetrics);
      
      // Alert if metrics are below thresholds
      if (completionRate < 95) {
        console.warn(`Low completion rate detected: ${completionRate}%`);
      }
      
      if (overdueRate > 5) {
        console.warn(`High overdue rate detected: ${overdueRate}%`);
      }
      
      if (avgProcessingTimeHours > 15) {
        console.warn(`High average processing time detected: ${avgProcessingTimeHours} hours`);
      }
      
    } catch (error) {
      console.error('Error checking compliance metrics:', error);
    }
  }

  /**
   * Generate alerts for critical issues
   */
  private async generateAlerts() {
    try {
      // Check for urgent requests that haven't been processed
      const urgentRequests = await SubjectRightsService.getRequestsByTenant('system', {
        priority: 'URGENT',
        status: 'PENDING'
      });

      if (urgentRequests.length > 0) {
        console.warn(`Found ${urgentRequests.length} urgent pending requests requiring immediate attention`);
        
        // Generate detailed alert
        const alert = {
          type: 'URGENT_REQUESTS_PENDING',
          severity: 'HIGH',
          count: urgentRequests.length,
          requests: urgentRequests.map(req => ({
            id: req.id,
            requestType: req.requestType,
            requestedBy: req.requestedBy,
            dueDate: req.dueDate,
            hoursUntilDue: req.dueDate ? 
              Math.ceil((new Date(req.dueDate).getTime() - Date.now()) / (1000 * 60 * 60)) : 
              null
          })),
          timestamp: new Date().toISOString()
        };
        
        console.log('Urgent requests alert:', alert);
      }

      // Check for requests due within 24 hours
      const requestsDueSoon = await SubjectRightsService.getRequestsByTenant('system', {
        status: 'PENDING'
      });

      const criticalRequests = requestsDueSoon.filter(req => {
        if (!req.dueDate) return false;
        const hoursUntilDue = Math.ceil((new Date(req.dueDate).getTime() - Date.now()) / (1000 * 60 * 60));
        return hoursUntilDue <= 24 && hoursUntilDue > 0;
      });

      if (criticalRequests.length > 0) {
        console.warn(`Found ${criticalRequests.length} requests due within 24 hours`);
        
        const alert = {
          type: 'REQUESTS_DUE_SOON',
          severity: 'MEDIUM',
          count: criticalRequests.length,
          requests: criticalRequests.map(req => ({
            id: req.id,
            requestType: req.requestType,
            requestedBy: req.requestedBy,
            dueDate: req.dueDate,
            hoursUntilDue: Math.ceil((new Date(req.dueDate).getTime() - Date.now()) / (1000 * 60 * 60))
          })),
          timestamp: new Date().toISOString()
        };
        
        console.log('Requests due soon alert:', alert);
      }

    } catch (error) {
      console.error('Error generating alerts:', error);
    }
  }

  /**
   * Run monitoring manually for a specific tenant
   */
  async runMonitoringForTenant(tenantId: string) {
    try {
      console.log(`Running subject rights monitoring for tenant: ${tenantId}`);
      
      const escalatedRequests = await SubjectRightsService.checkOverdueRequests(tenantId);
      
      console.log(`Escalated ${escalatedRequests.length} overdue requests for tenant ${tenantId}`);
      
      return {
        success: true,
        escalatedCount: escalatedRequests.length,
        escalatedRequests
      };
    } catch (error) {
      console.error(`Error during subject rights monitoring for tenant ${tenantId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        escalatedCount: 0
      };
    }
  }

  /**
   * Get monitoring service status
   */
  getStatus() {
    return {
      isRunning: this.monitoringInterval !== null,
      intervalMs: this.MONITORING_INTERVAL_MS,
      nextRun: this.monitoringInterval ? 
        new Date(Date.now() + this.MONITORING_INTERVAL_MS).toISOString() : 
        null
    };
  }
}