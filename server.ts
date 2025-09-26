// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { dbInitializer } from '@/lib/db/init';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Initialize database first
    await dbInitializer.initialize();
    
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
      // Handle CORS preflight requests
      if (req.method === 'OPTIONS') {
        const host = req.headers.host || '';
        const isPreviewDomain = host.includes('space.z.ai') || host.includes('z.ai');
        const csp = isPreviewDomain ? "frame-ancestors *" : "frame-ancestors 'self' https://*.space.z.ai https://z.ai http://localhost:* http://127.0.0.1:*";
        
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Content-Security-Policy': csp,
          'X-Frame-Options': 'ALLOWALL',
        });
        res.end();
        return;
      }

      // Add CORS headers to all responses
      const host = req.headers.host || '';
      const isPreviewDomain = host.includes('space.z.ai') || host.includes('z.ai');
      const csp = isPreviewDomain ? "frame-ancestors *" : "frame-ancestors 'self' https://*.space.z.ai https://z.ai http://localhost:* http://127.0.0.1:*";
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Content-Security-Policy', csp);
      res.setHeader('X-Frame-Options', 'ALLOWALL');

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
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    setupSocket(io);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
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