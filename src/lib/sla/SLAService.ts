import { db } from '@/lib/db';
import { 
  ComplianceSLA, 
  SLACategory, 
  SLATimeframe, 
  SLAStatus,
  ViolationSeverity,
  ViolationStatus,
  ComplianceDashboard,
  WidgetType
} from '@prisma/client';

export interface SLAMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: SLAStatus;
  trend: 'up' | 'down' | 'stable';
}

export interface SLAComplianceSummary {
  overallScore: number;
  compliantCount: number;
  warningCount: number;
  criticalCount: number;
  violationCount: number;
  totalSLAs: number;
  categoryBreakdown: Record<SLACategory, {
    score: number;
    count: number;
    status: SLAStatus;
  }>;
  recentViolations: Array<{
    id: string;
    slaName: string;
    severity: ViolationSeverity;
    description: string;
    createdAt: Date;
  }>;
}

export interface DashboardWidgetConfig {
  type: WidgetType;
  title: string;
  dataSource: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  refreshInterval?: number;
}

export class SLAService {
  async createSLA(
    name: string,
    description: string,
    category: SLACategory,
    targetValue: number,
    warningThreshold: number,
    criticalThreshold: number,
    timeframe: SLATimeframe,
    tenantId: string
  ): Promise<ComplianceSLA> {
    return await db.complianceSLA.create({
      data: {
        name,
        description,
        category,
        targetValue,
        warningThreshold,
        criticalThreshold,
        timeframe,
        tenantId
      }
    });
  }

  async measureSLA(
    slaId: string,
    metricName: string,
    actualValue: number,
    measurementPeriod: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const sla = await db.complianceSLA.findUnique({
      where: { id: slaId }
    });

    if (!sla) {
      throw new Error('SLA not found');
    }

    // Determine status based on actual value vs thresholds
    let status: SLAStatus;
    if (actualValue >= sla.targetValue) {
      status = SLAStatus.COMPLIANT;
    } else if (actualValue >= sla.warningThreshold) {
      status = SLAStatus.WARNING;
    } else if (actualValue >= sla.criticalThreshold) {
      status = SLAStatus.CRITICAL;
    } else {
      status = SLAStatus.VIOLATION;
    }

    // Create measurement
    const measurement = await db.sLAMeasurement.create({
      data: {
        slaId,
        metricName,
        actualValue,
        targetValue: sla.targetValue,
        status,
        measurementPeriod,
        metadata: metadata || {},
        tenantId: sla.tenantId
      }
    });

    // Create violation if status is violation
    if (status === SLAStatus.VIOLATION) {
      const severity = this.calculateViolationSeverity(actualValue, sla.criticalThreshold);
      
      await db.sLAViolation.create({
        data: {
          slaId,
          measurementId: measurement.id,
          severity,
          description: `SLA violation: ${metricName} is ${actualValue}% (target: ${sla.targetValue}%)`,
          impact: {
            metric: metricName,
            actualValue,
            targetValue: sla.targetValue,
            deviation: sla.targetValue - actualValue
          },
          remediation: {
            immediate: 'Investigate root cause',
            shortTerm: 'Implement corrective actions',
            longTerm: 'Review and adjust SLA targets if necessary'
          },
          tenantId: sla.tenantId
        }
      });
    }
  }

  private calculateViolationSeverity(actualValue: number, criticalThreshold: number): ViolationSeverity {
    const deviation = criticalThreshold - actualValue;
    const percentageDeviation = (deviation / criticalThreshold) * 100;

    if (percentageDeviation > 50) return ViolationSeverity.CRITICAL;
    if (percentageDeviation > 25) return ViolationSeverity.HIGH;
    if (percentageDeviation > 10) return ViolationSeverity.MEDIUM;
    return ViolationSeverity.LOW;
  }

  async getSLAs(tenantId: string): Promise<ComplianceSLA[]> {
    return await db.complianceSLA.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSLAMetrics(tenantId: string, period?: string): Promise<SLAMetric[]> {
    const slas = await this.getSLAs(tenantId);
    const metrics: SLAMetric[] = [];

    for (const sla of slas) {
      // Get the latest measurement for this SLA
      const measurement = await db.sLAMeasurement.findFirst({
        where: { 
          slaId: sla.id,
          ...(period && { measurementPeriod: period })
        },
        orderBy: { measuredAt: 'desc' }
      });

      // Get previous measurement for trend calculation
      const previousMeasurement = await db.sLAMeasurement.findFirst({
        where: { 
          slaId: sla.id,
          ...(period && { measurementPeriod: period })
        },
        orderBy: { measuredAt: 'desc' },
        skip: 1,
        take: 1
      });

      const trend = this.calculateTrend(
        measurement?.actualValue || 0,
        previousMeasurement?.actualValue || 0
      );

      metrics.push({
        name: sla.name,
        value: measurement?.actualValue || 0,
        target: sla.targetValue,
        unit: '%',
        status: measurement?.status || SLAStatus.COMPLIANT,
        trend
      });
    }

    return metrics;
  }

  private calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    if (Math.abs(current - previous) < 0.1) return 'stable';
    return current > previous ? 'up' : 'down';
  }

  async getComplianceSummary(tenantId: string): Promise<SLAComplianceSummary> {
    const slas = await this.getSLAs(tenantId);
    const latestMeasurements = await db.sLAMeasurement.findMany({
      where: { tenantId },
      include: { sla: true },
      orderBy: { measuredAt: 'desc' }
    });

    // Group by SLA to get latest measurement per SLA
    const latestBySLA = new Map<string, typeof latestMeasurements[0]>();
    latestMeasurements.forEach(measurement => {
      if (!latestBySLA.has(measurement.slaId)) {
        latestBySLA.set(measurement.slaId, measurement);
      }
    });

    const measurements = Array.from(latestBySLA.values());
    
    const summary: SLAComplianceSummary = {
      overallScore: 0,
      compliantCount: 0,
      warningCount: 0,
      criticalCount: 0,
      violationCount: 0,
      totalSLAs: slas.length,
      categoryBreakdown: {} as any,
      recentViolations: []
    };

    // Calculate counts and scores
    measurements.forEach(measurement => {
      switch (measurement.status) {
        case SLAStatus.COMPLIANT:
          summary.compliantCount++;
          break;
        case SLAStatus.WARNING:
          summary.warningCount++;
          break;
        case SLAStatus.CRITICAL:
          summary.criticalCount++;
          break;
        case SLAStatus.VIOLATION:
          summary.violationCount++;
          break;
      }
    });

    // Calculate overall score
    if (measurements.length > 0) {
      const totalScore = measurements.reduce((sum, m) => {
        const score = m.status === SLAStatus.COMPLIANT ? 100 :
                     m.status === SLAStatus.WARNING ? 75 :
                     m.status === SLAStatus.CRITICAL ? 50 : 25;
        return sum + score;
      }, 0);
      summary.overallScore = Math.round(totalScore / measurements.length);
    }

    // Calculate category breakdown
    const categoryStats = new Map<SLACategory, { scores: number[]; count: number }>();
    measurements.forEach(measurement => {
      const category = measurement.sla.category;
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { scores: [], count: 0 });
      }
      const stats = categoryStats.get(category)!;
      stats.count++;
      
      const score = measurement.status === SLAStatus.COMPLIANT ? 100 :
                   measurement.status === SLAStatus.WARNING ? 75 :
                   measurement.status === SLAStatus.CRITICAL ? 50 : 25;
      stats.scores.push(score);
    });

    categoryStats.forEach((stats, category) => {
      const avgScore = stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length;
      summary.categoryBreakdown[category] = {
        score: Math.round(avgScore),
        count: stats.count,
        status: avgScore >= 90 ? SLAStatus.COMPLIANT :
               avgScore >= 70 ? SLAStatus.WARNING :
               avgScore >= 50 ? SLAStatus.CRITICAL : SLAStatus.VIOLATION
      };
    });

    // Get recent violations
    const recentViolations = await db.sLAViolation.findMany({
      where: { tenantId },
      include: { sla: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    summary.recentViolations = recentViolations.map(violation => ({
      id: violation.id,
      slaName: violation.sla.name,
      severity: violation.severity,
      description: violation.description,
      createdAt: violation.createdAt
    }));

    return summary;
  }

  async createDashboard(
    name: string,
    description: string,
    widgets: DashboardWidgetConfig[],
    tenantId: string
  ): Promise<ComplianceDashboard> {
    const dashboard = await db.complianceDashboard.create({
      data: {
        name,
        description,
        config: { widgets: widgets.length },
        tenantId
      }
    });

    // Create widgets
    for (const widgetConfig of widgets) {
      await db.dashboardWidget.create({
        data: {
          dashboardId: dashboard.id,
          type: widgetConfig.type,
          title: widgetConfig.title,
          config: widgetConfig.config,
          position: widgetConfig.position,
          dataSource: widgetConfig.dataSource,
          refreshInterval: widgetConfig.refreshInterval || 300,
          tenantId
        }
      });
    }

    return dashboard;
  }

  async getDashboards(tenantId: string): Promise<ComplianceDashboard[]> {
    return await db.complianceDashboard.findMany({
      where: { tenantId, isActive: true },
      include: {
        widgets: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getViolationTrends(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const violations = await db.sLAViolation.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate }
      },
      include: { sla: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const dailyData = new Map<string, { count: number; bySeverity: Record<ViolationSeverity, number> }>();
    
    violations.forEach(violation => {
      const day = violation.createdAt.toISOString().split('T')[0];
      if (!dailyData.has(day)) {
        dailyData.set(day, { count: 0, bySeverity: {} as any });
      }
      const data = dailyData.get(day)!;
      data.count++;
      data.bySeverity[violation.severity] = (data.bySeverity[violation.severity] || 0) + 1;
    });

    return {
      totalViolations: violations.length,
      dailyTrend: Array.from(dailyData.entries()).map(([day, data]) => ({
        date: day,
        count: data.count,
        bySeverity: data.bySeverity
      })),
      severityBreakdown: violations.reduce((acc, violation) => {
        acc[violation.severity] = (acc[violation.severity] || 0) + 1;
        return acc;
      }, {} as Record<ViolationSeverity, number>)
    };
  }

  async createDefaultSLAs(tenantId: string): Promise<void> {
    const defaultSLAs = [
      {
        name: 'System Availability',
        description: 'Overall system availability SLA',
        category: SLACategory.AVAILABILITY,
        targetValue: 99.9,
        warningThreshold: 99.5,
        criticalThreshold: 99.0,
        timeframe: SLATimeframe.MONTHLY
      },
      {
        name: 'Response Time',
        description: 'Average API response time',
        category: SLACategory.RESPONSE_TIME,
        targetValue: 95,
        warningThreshold: 90,
        criticalThreshold: 85,
        timeframe: SLATimeframe.DAILY
      },
      {
        name: 'Data Processing Accuracy',
        description: 'Accuracy of compliance decisions',
        category: SLACategory.ACCURACY,
        targetValue: 99.5,
        warningThreshold: 98.0,
        criticalThreshold: 95.0,
        timeframe: SLATimeframe.WEEKLY
      },
      {
        name: 'Recovery Time Objective',
        description: 'Maximum time to recover from failures',
        category: SLACategory.RECOVERY_TIME,
        targetValue: 90,
        warningThreshold: 80,
        criticalThreshold: 70,
        timeframe: SLATimeframe.MONTHLY
      },
      {
        name: 'Audit Compliance',
        description: 'Compliance with audit requirements',
        category: SLACategory.AUDIT_COMPLIANCE,
        targetValue: 100,
        warningThreshold: 95,
        criticalThreshold: 90,
        timeframe: SLATimeframe.QUARTERLY
      }
    ];

    for (const sla of defaultSLAs) {
      try {
        await this.createSLA(
          sla.name,
          sla.description,
          sla.category,
          sla.targetValue,
          sla.warningThreshold,
          sla.criticalThreshold,
          sla.timeframe,
          tenantId
        );
      } catch (error) {
        console.error('Error creating default SLA:', error);
      }
    }
  }

  async simulateSLAMeasurements(tenantId: string): Promise<void> {
    const slas = await this.getSLAs(tenantId);
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format

    for (const sla of slas) {
      // Generate realistic measurement values with some variation
      const baseValue = sla.targetValue;
      const variation = (Math.random() - 0.5) * 10; // ±5% variation
      const actualValue = Math.max(0, Math.min(100, baseValue + variation));

      await this.measureSLA(
        sla.id,
        sla.name.toLowerCase().replace(/\s+/g, '_'),
        actualValue,
        currentPeriod,
        {
          measuredAt: new Date().toISOString(),
          measurementMethod: 'automated'
        }
      );
    }
  }
}