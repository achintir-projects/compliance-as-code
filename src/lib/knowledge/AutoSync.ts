import { KnowledgeCore } from './KnowledgeCore';

export class AutoSync {
  private knowledgeCore: KnowledgeCore;
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(knowledgeCore: KnowledgeCore) {
    this.knowledgeCore = knowledgeCore;
  }

  async startAutoSync(intervalMinutes: number = 60): Promise<void> {
    if (this.isRunning) {
      console.log('Auto sync is already running');
      return;
    }

    console.log(`Starting auto sync every ${intervalMinutes} minutes`);
    
    // Initial sync
    await this.performSync();
    
    // Set up periodic sync
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, intervalMinutes * 60 * 1000);
    
    this.isRunning = true;
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log('Auto sync stopped');
    }
  }

  private async performSync(): Promise<void> {
    try {
      console.log('Performing automatic Airtable sync...');
      const result = await this.knowledgeCore.syncKnowledge();
      
      if (result.success) {
        console.log(`✅ Auto sync completed: ${result.processed} objects processed, ${result.deployed} deployed`);
      } else {
        console.error(`❌ Auto sync failed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Auto sync error:', error);
    }
  }

  isAutoSyncRunning(): boolean {
    return this.isRunning;
  }

  getSyncStatus(): {
    isRunning: boolean;
    lastSync?: Date;
    nextSync?: Date;
  } {
    return {
      isRunning: this.isRunning,
      // Could add last sync timestamp tracking here
    };
  }
}