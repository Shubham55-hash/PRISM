import { useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

type WsHandler = (data: any) => void;

export function useWebSocket(userId: string | null | undefined, handlers: Record<string, WsHandler>) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Update handlers ref whenever it changes to avoid stale closures
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const connect = useCallback(() => {
    if (!userId || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_URL}?userId=${userId}`);
      
      ws.onopen = () => {
        console.log('[WS] Connected to PRISM');
        // Start heartbeat
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          const { event, data } = payload;
          
          if (payload.type === 'pong') return;

          const handler = handlersRef.current[event];
          if (handler) {
            handler(data);
          }
        } catch (err) {
          // ignore parsing errors
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] PRISM Connection error', err);
      };

      ws.onclose = () => {
        console.log('[WS] PRISM Connection closed');
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        wsRef.current = null;
        // Reconnect after 5s if still have a userId
        if (userId) setTimeout(connect, 5000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WS] Failed to initiate connection', err);
    }
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return wsRef;
}
