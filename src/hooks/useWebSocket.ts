import { useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

type WsHandler = (data: any) => void;

export function useWebSocket(userId: string | null | undefined, handlers: Record<string, WsHandler>) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!userId) return;
    const ws = new WebSocket(`${WS_URL}?userId=${userId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected to PRISM');
      ws.send(JSON.stringify({ type: 'ping' }));
    };

    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data);
        const handler = handlersRef.current[event];
        if (handler) handler(data);
      } catch {}
    };

    ws.onerror = () => console.warn('[WS] Connection error');
    ws.onclose = () => {
      wsRef.current = null;
      // Reconnect after 3s
      if (userId) setTimeout(connect, 3000);
    };
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return wsRef;
}
