import { NextRequest, NextResponse } from 'next/server';
import { jurisdictionRouter } from '@/lib/jurisdiction/JurisdictionRouter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'rules':
        const jurisdiction = searchParams.get('jurisdiction');
        if (!jurisdiction) {
          return NextResponse.json(
            { error: 'Jurisdiction is required' },
            { status: 400 }
          );
        }
        
        const rules = jurisdictionRouter.getRules(jurisdiction);
        return NextResponse.json({ rules });

      case 'config':
        const config = jurisdictionRouter.getConfig();
        return NextResponse.json(config);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Jurisdiction router API error:', error);
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
      case 'route':
        const { context } = data;
        
        if (!context || !context.tenantId) {
          return NextResponse.json(
            { error: 'Routing context with tenantId is required' },
            { status: 400 }
          );
        }

        const decision = await jurisdictionRouter.route(context);
        return NextResponse.json(decision);

      case 'add-rule':
        const { rule } = data;
        
        if (!rule || !rule.jurisdiction) {
          return NextResponse.json(
            { error: 'Rule with jurisdiction is required' },
            { status: 400 }
          );
        }

        const newRule = await jurisdictionRouter.addRule(rule);
        return NextResponse.json({ rule: newRule });

      case 'update-rule':
        const { ruleId, updates } = data;
        
        if (!ruleId || !updates) {
          return NextResponse.json(
            { error: 'Rule ID and updates are required' },
            { status: 400 }
          );
        }

        const updatedRule = await jurisdictionRouter.updateRule(ruleId, updates);
        if (!updatedRule) {
          return NextResponse.json(
            { error: 'Rule not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ rule: updatedRule });

      case 'remove-rule':
        const { removeRuleId } = data;
        
        if (!removeRuleId) {
          return NextResponse.json(
            { error: 'Rule ID is required' },
            { status: 400 }
          );
        }

        const removed = await jurisdictionRouter.removeRule(removeRuleId);
        if (!removed) {
          return NextResponse.json(
            { error: 'Rule not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ 
          message: `Rule ${removeRuleId} removed successfully` 
        });

      case 'clear-cache':
        jurisdictionRouter.clearCache();
        return NextResponse.json({ 
          message: 'Cache cleared successfully' 
        });

      case 'update-config':
        const { newConfig } = data;
        
        if (!newConfig || typeof newConfig !== 'object') {
          return NextResponse.json(
            { error: 'New configuration must be an object' },
            { status: 400 }
          );
        }

        jurisdictionRouter.updateConfig(newConfig);
        return NextResponse.json({ 
          message: 'Configuration updated successfully',
          config: jurisdictionRouter.getConfig()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Jurisdiction router API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}