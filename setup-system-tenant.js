import { db } from './src/lib/db';

async function main() {
  try {
    // Check if system tenant exists
    const systemTenant = await db.tenant.findUnique({
      where: { id: 'system' }
    });

    if (!systemTenant) {
      console.log('Creating system tenant...');
      await db.tenant.create({
        data: {
          id: 'system',
          name: 'System',
          domain: 'system.local',
          status: 'ACTIVE',
          config: {}
        }
      });
      console.log('System tenant created successfully');
    } else {
      console.log('System tenant already exists');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

main();