import { NextRequest, NextResponse } from 'next/server';
import { schemaRegistry } from '@/lib/schema/SchemaRegistry';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'mappings':
        const sourceSystem = searchParams.get('sourceSystem');
        const mappings = sourceSystem 
          ? schemaRegistry.getMappingsBySource(sourceSystem)
          : Array.from(schemaRegistry['mappings'].values());
        return NextResponse.json({ mappings });

      case 'mapping':
        const mappingId = searchParams.get('mappingId');
        if (!mappingId) {
          return NextResponse.json(
            { error: 'Mapping ID is required' },
            { status: 400 }
          );
        }
        
        const mapping = schemaRegistry.getMapping(mappingId);
        if (!mapping) {
          return NextResponse.json(
            { error: 'Mapping not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ mapping });

      case 'drift-stats':
        const driftStats = await schemaRegistry.getDriftStats();
        return NextResponse.json(driftStats);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Schema registry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'register-mapping':
        const { sourceSystem, targetModel, version, fields } = data;
        
        if (!sourceSystem || !targetModel || !version || !fields) {
          return NextResponse.json(
            { error: 'Source system, target model, version, and fields are required' },
            { status: 400 }
          );
        }

        const newMapping = await schemaRegistry.registerMapping({
          sourceSystem,
          targetModel,
          version,
          fields,
          isActive: true,
          driftStatus: 'none'
        });

        return NextResponse.json({ mapping: newMapping });

      case 'detect-drift':
        const { mappingId: driftMappingId, currentSchema } = data;
        
        if (!driftMappingId || !currentSchema) {
          return NextResponse.json(
            { error: 'Mapping ID and current schema are required' },
            { status: 400 }
          );
        }

        const drifts = await schemaRegistry.detectDrift(driftMappingId, currentSchema);
        return NextResponse.json({ drifts });

      case 'validate-data':
        const { mappingId: validateMappingId, data: validateData } = data;
        
        if (!validateMappingId || !validateData) {
          return NextResponse.json(
            { error: 'Mapping ID and data are required' },
            { status: 400 }
          );
        }

        const validationResult = schemaRegistry.validateData(validateMappingId, validateData);
        return NextResponse.json(validationResult);

      case 'transform-data':
        const { mappingId: transformMappingId, data: transformData } = data;
        
        if (!transformMappingId || !transformData) {
          return NextResponse.json(
            { error: 'Mapping ID and data are required' },
            { status: 400 }
          );
        }

        const transformedData = schemaRegistry.transformData(transformMappingId, transformData);
        return NextResponse.json({ transformedData });

      case 'resolve-drift':
        const { driftId, resolution, action: resolveAction } = data;
        
        if (!driftId || !resolution || !resolveAction) {
          return NextResponse.json(
            { error: 'Drift ID, resolution, and action are required' },
            { status: 400 }
          );
        }

        if (!['accept', 'reject', 'update_mapping'].includes(resolveAction)) {
          return NextResponse.json(
            { error: 'Action must be one of: accept, reject, update_mapping' },
            { status: 400 }
          );
        }

        await schemaRegistry.resolveDrift(driftId, resolution, resolveAction);
        return NextResponse.json({ 
          message: `Drift ${driftId} resolved successfully` 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Schema registry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}