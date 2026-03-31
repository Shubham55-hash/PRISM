import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer;
const clients = new Map<string, Set<WebSocket>>();

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId') || 'anonymous';

    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(ws);

    console.log(`[WS] Client connected: ${userId} (${clients.get(userId)!.size} connections)`);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        // ignore
      }
    });

    ws.on('close', () => {
      const userConnections = clients.get(userId);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          clients.delete(userId);
        }
      }
      console.log(`[WS] Client disconnected: ${userId}`);
    });

    // Send welcome message
    ws.send(JSON.stringify({ 
      event: 'connected', 
      data: { message: 'PRISM WebSocket active', userId } 
    }));
  });

  return wss;
}

export function broadcastToUser(userId: string, event: string, data: any) {
  const userClients = clients.get(userId);
  if (userClients) {
    const payload = JSON.stringify({ 
      event, 
      data, 
      timestamp: new Date().toISOString() 
    });
    userClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}
