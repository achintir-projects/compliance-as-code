import { db } from '@/lib/db';

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'text';
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface SchemaMapping {
  id: string;
  sourceSystem: 'airtable' | 'api' | 'file' | 'database';
  targetModel: string;
  version: string;
  fields: Record<string, {
    sourceField: string;
    targetField: string;
    transform?: string;
    validation?: string;
    required: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastSyncHash?: string;
  driftStatus: 'none' | 'detected' | 'resolved';
}

export interface SchemaDrift {
  id: string;
  mappingId: string;
  driftType: 'field_added' | 'field_removed' | 'field_type_changed' | 'field_required_changed';
  field: string;
  oldValue?: any;
  newValue?: any;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved' | 'ignored';
  resolution?: string;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

export class SchemaRegistry {
  private static instance: SchemaRegistry;
  private mappings: Map<string, SchemaMapping> = new Map();
  private driftDetectors: Map<string, (data: any) => Promise<void>> = new Map();

  private constructor() {
    this.initializeDefaultMappings();
  }

  static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

  private initializeDefaultMappings() {
    // Airtable to KnowledgeObject mapping
    const airtableToKnowledgeObject: SchemaMapping = {
      id: 'airtable-knowledge-object-v1',
      sourceSystem: 'airtable',
      targetModel: 'KnowledgeObject',
      version: '1.0.0',
      fields: {
        confidence: {
          sourceField: 'Confidence',
          targetField: 'confidence',
          required: true,
          validation: 'enum:High,Medium'
        },
        topic: {
          sourceField: 'Topic',
          targetField: 'topic',
          required: true
        },
        category: {
          sourceField: 'Category',
          targetField: 'category',
          required: true
        },
        content: {
          sourceField: 'Content',
          targetField: 'content',
          required: true
        },
        country: {
          sourceField: 'Country',
          targetField: 'country',
          required: false,
          defaultValue: 'Global'
        },
        regulationType: {
          sourceField: 'Regulation Type',
          targetField: 'regulationType',
          required: false,
          defaultValue: 'General'
        },
        effectiveDate: {
          sourceField: 'Effective Date',
          targetField: 'effectiveDate',
          required: false,
          transform: 'dateString',
          defaultValue: '2024-01-01'
        },
        sourceUri: {
          sourceField: 'Source URI',
          targetField: 'sourceUri',
          required: false
        },
        publisher: {
          sourceField: 'Publisher',
          targetField: 'publisher',
          required: false
        },
        jurisdiction: {
          sourceField: 'Jurisdiction',
          targetField: 'jurisdiction',
          required: false
        },
        sunsetDate: {
          sourceField: 'Sunset Date',
          targetField: 'sunsetDate',
          required: false,
          transform: 'dateString'
        },
        contentLicense: {
          sourceField: 'License',
          targetField: 'contentLicense',
          required: false
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      driftStatus: 'none'
    };

    this.mappings.set(airtableToKnowledgeObject.id, airtableToKnowledgeObject);
  }

  /**
   * Register a new schema mapping
   */
  async registerMapping(mapping: Omit<SchemaMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<SchemaMapping> {
    const newMapping: SchemaMapping = {
      ...mapping,
      id: this.generateMappingId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mappings.set(newMapping.id, newMapping);
    
    // Store in database for persistence
    await this.saveMappingToDatabase(newMapping);
    
    return newMapping;
  }

  /**
   * Get a schema mapping by ID
   */
  getMapping(mappingId: string): SchemaMapping | undefined {
    return this.mappings.get(mappingId);
  }

  /**
   * Get all mappings for a source system
   */
  getMappingsBySource(sourceSystem: string): SchemaMapping[] {
    return Array.from(this.mappings.values()).filter(
      mapping => mapping.sourceSystem === sourceSystem && mapping.isActive
    );
  }

  /**
   * Detect schema drift by comparing current schema with expected schema
   */
  async detectDrift(mappingId: string, currentSchema: any): Promise<SchemaDrift[]> {
    const mapping = this.getMapping(mappingId);
    if (!mapping) {
      throw new Error(`Mapping ${mappingId} not found`);
    }

    const drifts: SchemaDrift[] = [];
    const expectedFields = new Set(Object.keys(mapping.fields));
    const currentFields = new Set(Object.keys(currentSchema));

    // Check for removed fields
    for (const field of expectedFields) {
      if (!currentFields.has(field)) {
        drifts.push({
          id: this.generateDriftId(),
          mappingId,
          driftType: 'field_removed',
          field,
          oldValue: mapping.fields[field],
          detectedAt: new Date(),
          severity: mapping.fields[field].required ? 'high' : 'medium',
          status: 'open'
        });
      }
    }

    // Check for added fields
    for (const field of currentFields) {
      if (!expectedFields.has(field)) {
        drifts.push({
          id: this.generateDriftId(),
          mappingId,
          driftType: 'field_added',
          field,
          newValue: currentSchema[field],
          detectedAt: new Date(),
          severity: 'low',
          status: 'open'
        });
      }
    }

    // Check for type changes and requirement changes
    for (const field of expectedFields.intersection(currentFields)) {
      const expectedField = mapping.fields[field];
      const currentField = currentSchema[field];

      // Type change detection (simplified)
      if (expectedField && currentField && typeof currentField !== typeof expectedField.defaultValue) {
        drifts.push({
          id: this.generateDriftId(),
          mappingId,
          driftType: 'field_type_changed',
          field,
          oldValue: typeof expectedField.defaultValue,
          newValue: typeof currentField,
          detectedAt: new Date(),
          severity: 'medium',
          status: 'open'
        });
      }
    }

    // Store drifts in database
    for (const drift of drifts) {
      await this.saveDriftToDatabase(drift);
    }

    // Update mapping drift status
    if (drifts.length > 0) {
      mapping.driftStatus = 'detected';
      mapping.updatedAt = new Date();
      await this.updateMappingInDatabase(mapping);
    }

    return drifts;
  }

  /**
   * Validate data against schema mapping
   */
  validateData(mappingId: string, data: any): SchemaValidationResult {
    const mapping = this.getMapping(mappingId);
    if (!mapping) {
      throw new Error(`Mapping ${mappingId} not found`);
    }

    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];

    for (const [targetField, fieldConfig] of Object.entries(mapping.fields)) {
      const sourceField = fieldConfig.sourceField;
      const value = data[sourceField];

      // Check required fields
      if (fieldConfig.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: sourceField,
          message: `Required field '${sourceField}' is missing or empty`,
          severity: 'error'
        });
        continue;
      }

      // Skip validation for optional fields that are missing
      if (!fieldConfig.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (fieldConfig.validation?.enum && !fieldConfig.validation.enum.includes(value)) {
        errors.push({
          field: sourceField,
          message: `Field '${sourceField}' must be one of: ${fieldConfig.validation.enum.join(', ')}`,
          severity: 'error'
        });
      }

      // Pattern validation
      if (fieldConfig.validation?.pattern && typeof value === 'string') {
        const regex = new RegExp(fieldConfig.validation.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: sourceField,
            message: `Field '${sourceField}' does not match required pattern`,
            severity: 'error'
          });
        }
      }

      // Date validation
      if (fieldConfig.transform === 'dateString' && value) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          errors.push({
            field: sourceField,
            message: `Field '${sourceField}' must be in YYYY-MM-DD format`,
            severity: 'error'
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Transform data according to schema mapping
   */
  transformData(mappingId: string, sourceData: any): any {
    const mapping = this.getMapping(mappingId);
    if (!mapping) {
      throw new Error(`Mapping ${mappingId} not found`);
    }

    const targetData: any = {};

    for (const [targetField, fieldConfig] of Object.entries(mapping.fields)) {
      const sourceField = fieldConfig.sourceField;
      let value = sourceData[sourceField];

      // Apply default value if missing
      if (value === undefined || value === null) {
        if (fieldConfig.defaultValue !== undefined) {
          value = fieldConfig.defaultValue;
        } else if (!fieldConfig.required) {
          continue; // Skip optional fields
        }
      }

      // Apply transformations
      if (fieldConfig.transform) {
        value = this.applyTransform(value, fieldConfig.transform);
      }

      targetData[targetField] = value;
    }

    return targetData;
  }

  /**
   * Resolve schema drift
   */
  async resolveDrift(driftId: string, resolution: string, action: 'accept' | 'reject' | 'update_mapping'): Promise<void> {
    // In a real implementation, you would update the database
    console.log(`Resolving drift ${driftId} with action: ${action}, resolution: ${resolution}`);
    
    // Update drift status in database
    await this.updateDriftStatusInDatabase(driftId, 'resolved', resolution);
  }

  /**
   * Get drift statistics
   */
  async getDriftStats(): Promise<{
    totalDrifts: number;
    openDrifts: number;
    resolvedDrifts: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    // In a real implementation, you would query the database
    return {
      totalDrifts: 0,
      openDrifts: 0,
      resolvedDrifts: 0,
      bySeverity: {},
      byType: {}
    };
  }

  private applyTransform(value: any, transform: string): any {
    switch (transform) {
      case 'dateString':
        if (typeof value === 'string') {
          // Ensure it's in YYYY-MM-DD format
          const date = new Date(value);
          return date.toISOString().split('T')[0];
        }
        return value;
      
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      
      default:
        return value;
    }
  }

  private generateMappingId(): string {
    return `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDriftId(): string {
    return `drift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveMappingToDatabase(mapping: SchemaMapping): Promise<void> {
    // In a real implementation, you would save to database
    console.log('Saving mapping to database:', mapping.id);
  }

  private async updateMappingInDatabase(mapping: SchemaMapping): Promise<void> {
    // In a real implementation, you would update in database
    console.log('Updating mapping in database:', mapping.id);
  }

  private async saveDriftToDatabase(drift: SchemaDrift): Promise<void> {
    // In a real implementation, you would save to database
    console.log('Saving drift to database:', drift.id);
  }

  private async updateDriftStatusInDatabase(driftId: string, status: string, resolution?: string): Promise<void> {
    // In a real implementation, you would update in database
    console.log('Updating drift status in database:', driftId);
  }
}

export const schemaRegistry = SchemaRegistry.getInstance();