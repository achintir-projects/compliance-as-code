// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { ConsentCleanupService } from '@/lib/consent/ConsentCleanupService';
import { SubjectRightsMonitoringService } from '@/lib/subject-rights/SubjectRightsMonitoringService';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start consent cleanup service
    const consentCleanup = ConsentCleanupService.getInstance();
    consentCleanup.start();
    console.log('Consent cleanup service started');

    // Start subject rights monitoring service
    const subjectRightsMonitoring = SubjectRightsMonitoringService.getInstance();
    subjectRightsMonitoring.start();
    console.log('Subject rights monitoring service started');

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      consentCleanup.stop();
      subjectRightsMonitoring.stop();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
      consentCleanup.stop();
      subjectRightsMonitoring.stop();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
