import { useEffect, useRef, useState, useCallback } from "react";
import { getToken } from "../services/api";

export function useWebSocket(onMessageCallback) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    const token = getToken();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws${token ? `?token=${token}` : ""}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log("[WebSocket Frontend] Connected to live updates");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessageCallback) {
            onMessageCallback(data);
          }
        } catch (err) {
          console.error("[WebSocket Frontend] Error parsing message:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.warn("[WebSocket Frontend] Disconnected. Reconnecting in 3s...");
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("[WebSocket Frontend] Error:", err);
        ws.close();
      };
    } catch (err) {
      console.error("[WebSocket Frontend] Connection error:", err);
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  }, [onMessageCallback]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, sendMessage };
}
