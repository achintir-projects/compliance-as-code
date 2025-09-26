import { db } from '@/lib/db';

export interface DataSourceConfig {
  id: string;
  name: string;
  type: 'POSTGRES' | 'KAFKA' | 'VECTOR_DB' | 'API' | 'FILE';
  connectionString: string;
  schema: any;
  tenantId: string;
}

export interface DataIngestionConfig {
  dataSourceId: string;
  dataType: 'ISO20022' | 'FIBO' | 'ACORD' | 'CUSTOM';
  tenantId: string;
}

export interface IngestionResult {
  ingestionId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  recordCount?: number;
  errorCount?: number;
  lastSyncAt?: Date;
  errors?: string[];
}

export class DataPlane {
  private dataSources: Map<string, DataSource> = new Map();
  private ingestionHandlers: Map<string, DataIngestionHandler> = new Map();

  constructor() {
    this.initializeHandlers();
  }

  private initializeHandlers() {
    this.ingestionHandlers.set('POSTGRES', new PostgresIngestionHandler());
    this.ingestionHandlers.set('KAFKA', new KafkaIngestionHandler());
    this.ingestionHandlers.set('VECTOR_DB', new VectorDBIngestionHandler());
    this.ingestionHandlers.set('API', new APIIngestionHandler());
    this.ingestionHandlers.set('FILE', new FileIngestionHandler());
  }

  async registerDataSource(config: DataSourceConfig): Promise<DataSource> {
    // Validate configuration
    const validation = await this.validateDataSourceConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid data source configuration: ${validation.errors.join(', ')}`);
    }

    // Create data source in database
    const dataSource = await db.dataSource.create({
      data: {
        id: config.id,
        name: config.name,
        type: config.type,
        connectionString: config.connectionString,
        schema: config.schema,
        tenantId: config.tenantId
      }
    });

    // Initialize data source handler
    const handler = this.ingestionHandlers.get(config.type);
    if (handler) {
      await handler.initialize(config);
      this.dataSources.set(config.id, dataSource);
    }

    return dataSource;
  }

  async startIngestion(config: DataIngestionConfig): Promise<IngestionResult> {
    // Create ingestion record
    const ingestion = await db.dataIngestion.create({
      data: {
        dataSourceId: config.dataSourceId,
        dataType: config.dataType,
        status: 'PENDING',
        tenantId: config.tenantId
      }
    });

    // Get data source
    const dataSource = await db.dataSource.findUnique({
      where: { id: config.dataSourceId }
    });

    if (!dataSource) {
      throw new Error('Data source not found');
    }

    // Get handler and start ingestion
    const handler = this.ingestionHandlers.get(dataSource.type);
    if (!handler) {
      throw new Error(`No handler found for data source type: ${dataSource.type}`);
    }

    // Start async ingestion
    this.runIngestion(handler, ingestion, dataSource).catch(error => {
      console.error('Ingestion failed:', error);
      this.updateIngestionStatus(ingestion.id, 'FAILED', { error: error.message });
    });

    return {
      ingestionId: ingestion.id,
      status: 'PENDING'
    };
  }

  private async runIngestion(
    handler: DataIngestionHandler,
    ingestion: any,
    dataSource: any
  ): Promise<void> {
    // Update status to running
    await this.updateIngestionStatus(ingestion.id, 'RUNNING');

    try {
      // Execute ingestion
      const result = await handler.ingest({
        dataSource,
        ingestion,
        onData: async (data: any) => {
          await this.processIngestedData(data, ingestion, dataSource);
        },
        onError: async (error: string) => {
          await this.recordIngestionError(ingestion.id, error);
        }
      });

      // Update final status
      await this.updateIngestionStatus(
        ingestion.id,
        result.success ? 'COMPLETED' : 'FAILED',
        {
          recordCount: result.recordCount,
          errorCount: result.errorCount
        }
      );
    } catch (error) {
      await this.updateIngestionStatus(ingestion.id, 'FAILED', {
        error: error.message
      });
      throw error;
    }
  }

  private async processIngestedData(
    data: any,
    ingestion: any,
    dataSource: any
  ): Promise<void> {
    // Validate data against schema
    const validation = await this.validateData(data, dataSource.schema);
    if (!validation.valid) {
      throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
    }

    // Transform data if needed
    const transformedData = await this.transformData(data, ingestion.dataType);

    // Create lineage record
    await db.dataLineage.create({
      data: {
        ingestionId: ingestion.id,
        agentId: 'data-plane', // System agent
        transformType: 'INGESTION',
        inputHash: await this.hashData(data),
        outputHash: await this.hashData(transformedData),
        metadata: {
          dataSource: dataSource.name,
          dataType: ingestion.dataType,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Store processed data (implementation depends on target system)
    await this.storeData(transformedData, ingestion.tenantId);
  }

  private async validateDataSourceConfig(config: DataSourceConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!config.name || config.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!config.connectionString || config.connectionString.trim() === '') {
      errors.push('Connection string is required');
    }

    if (!config.tenantId || config.tenantId.trim() === '') {
      errors.push('Tenant ID is required');
    }

    // Type-specific validation
    switch (config.type) {
      case 'POSTGRES':
        if (!config.connectionString.includes('postgresql://')) {
          errors.push('Invalid PostgreSQL connection string');
        }
        break;
      case 'KAFKA':
        if (!config.connectionString.includes('kafka://')) {
          errors.push('Invalid Kafka connection string');
        }
        break;
      case 'VECTOR_DB':
        if (!config.connectionString.includes('vector://')) {
          errors.push('Invalid Vector DB connection string');
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  private async validateData(data: any, schema: any): Promise<{ valid: boolean; errors: string[] }> {
    // Implement data validation against schema
    // This would use JSON Schema or similar validation
    return { valid: true, errors: [] };
  }

  private async transformData(data: any, dataType: string): Promise<any> {
    // Implement data transformation based on type
    switch (dataType) {
      case 'ISO20022':
        return this.transformISO20022(data);
      case 'FIBO':
        return this.transformFIBO(data);
      case 'ACORD':
        return this.transformACORD(data);
      default:
        return data;
    }
  }

  private async transformISO20022(data: any): Promise<any> {
    // Transform ISO 20022 messages to internal format
    return {
      ...data,
      standard: 'ISO20022',
      processedAt: new Date().toISOString()
    };
  }

  private async transformFIBO(data: any): Promise<any> {
    // Transform FIBO ontology data to internal format
    return {
      ...data,
      standard: 'FIBO',
      processedAt: new Date().toISOString()
    };
  }

  private async transformACORD(data: any): Promise<any> {
    // Transform ACORD insurance data to internal format
    return {
      ...data,
      standard: 'ACORD',
      processedAt: new Date().toISOString()
    };
  }

  private async storeData(data: any, tenantId: string): Promise<void> {
    // Store data in appropriate target system
    // This could be the main database, data lake, or other storage
    console.log('Storing data for tenant:', tenantId, data);
  }

  private async hashData(data: any): Promise<string> {
    // Generate hash for data integrity verification
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async updateIngestionStatus(
    ingestionId: string,
    status: string,
    metadata?: any
  ): Promise<void> {
    const updateData: any = { status };
    
    if (metadata) {
      Object.assign(updateData, metadata);
    }

    await db.dataIngestion.update({
      where: { id: ingestionId },
      data: updateData
    });
  }

  private async recordIngestionError(ingestionId: string, error: string): Promise<void> {
    await db.dataIngestion.update({
      where: { id: ingestionId },
      data: {
        errorCount: {
          increment: 1
        }
      }
    });
  }
}

// Handler interfaces
export interface DataIngestionHandler {
  initialize(config: DataSourceConfig): Promise<void>;
  ingest(params: IngestionParams): Promise<IngestionHandlerResult>;
}

export interface IngestionParams {
  dataSource: any;
  ingestion: any;
  onData: (data: any) => Promise<void>;
  onError: (error: string) => Promise<void>;
}

export interface IngestionHandlerResult {
  success: boolean;
  recordCount?: number;
  errorCount?: number;
}

// Handler implementations
class PostgresIngestionHandler implements DataIngestionHandler {
  async initialize(config: DataSourceConfig): Promise<void> {
    // Initialize PostgreSQL connection
    console.log('Initializing PostgreSQL data source:', config.name);
  }

  async ingest(params: IngestionParams): Promise<IngestionHandlerResult> {
    // Implement PostgreSQL data ingestion
    console.log('Ingesting from PostgreSQL:', params.dataSource.name);
    
    // Simulate ingestion
    return {
      success: true,
      recordCount: 1000,
      errorCount: 0
    };
  }
}

class KafkaIngestionHandler implements DataIngestionHandler {
  async initialize(config: DataSourceConfig): Promise<void> {
    // Initialize Kafka consumer
    console.log('Initializing Kafka data source:', config.name);
  }

  async ingest(params: IngestionParams): Promise<IngestionHandlerResult> {
    // Implement Kafka data ingestion
    console.log('Ingesting from Kafka:', params.dataSource.name);
    
    // Simulate ingestion
    return {
      success: true,
      recordCount: 500,
      errorCount: 0
    };
  }
}

class VectorDBIngestionHandler implements DataIngestionHandler {
  async initialize(config: DataSourceConfig): Promise<void> {
    // Initialize Vector DB connection
    console.log('Initializing Vector DB data source:', config.name);
  }

  async ingest(params: IngestionParams): Promise<IngestionHandlerResult> {
    // Implement Vector DB data ingestion
    console.log('Ingesting from Vector DB:', params.dataSource.name);
    
    // Simulate ingestion
    return {
      success: true,
      recordCount: 100,
      errorCount: 0
    };
  }
}

class APIIngestionHandler implements DataIngestionHandler {
  async initialize(config: DataSourceConfig): Promise<void> {
    // Initialize API client
    console.log('Initializing API data source:', config.name);
  }

  async ingest(params: IngestionParams): Promise<IngestionHandlerResult> {
    // Implement API data ingestion
    console.log('Ingesting from API:', params.dataSource.name);
    
    // Simulate ingestion
    return {
      success: true,
      recordCount: 50,
      errorCount: 0
    };
  }
}

class FileIngestionHandler implements DataIngestionHandler {
  async initialize(config: DataSourceConfig): Promise<void> {
    // Initialize file reader
    console.log('Initializing File data source:', config.name);
  }

  async ingest(params: IngestionParams): Promise<IngestionHandlerResult> {
    // Implement file data ingestion
    console.log('Ingesting from File:', params.dataSource.name);
    
    // Simulate ingestion
    return {
      success: true,
      recordCount: 200,
      errorCount: 0
    };
  }
}