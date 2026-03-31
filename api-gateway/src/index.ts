import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

import authRoutes from './routes/auth';
import identityRoutes from './routes/identity';
import documentsRoutes from './routes/documents';
import consentsRoutes from './routes/consents';
import activityRoutes from './routes/activity';
import analyticsRoutes from './routes/analytics';
import assistantRoutes from './routes/assistant';
import crisisRoutes from './routes/crisis';
import { auditLog } from './middleware/audit';

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || '4000');

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:3000'] : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(auditLog as any);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/consents', consentsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/crisis', crisisRoutes);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0', service: 'PRISM API Gateway' }));

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── WebSocket Server ─────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });
const clients = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const userId = url.searchParams.get('userId') || 'anonymous';
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(ws);
  console.log(`[WS] Client connected: ${userId} (${clients.get(userId)!.size} connections)`);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    } catch {}
  });

  ws.on('close', () => {
    clients.get(userId)?.delete(ws);
    console.log(`[WS] Client disconnected: ${userId}`);
  });

  // Send welcome
  ws.send(JSON.stringify({ event: 'connected', data: { message: 'PRISM WebSocket active', userId } }));
});

// Export broadcast function for use in routes
export function broadcastToUser(userId: string, event: string, data: any) {
  const userClients = clients.get(userId);
  if (userClients) {
    const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    userClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
  }
}

// ── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🔷 PRISM API Gateway running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server active on ws://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health\n`);
});
