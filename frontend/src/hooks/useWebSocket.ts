"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type WSStatus = "connecting" | "open" | "closed" | "error";

interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

const BASE_WS = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function useWebSocket(path: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = options;

  const [status, setStatus] = useState<WSStatus>("closed");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (!isMounted.current) return;
    try {
      const ws = new WebSocket(`${BASE_WS}${path}`);
      wsRef.current = ws;
      setStatus("connecting");

      ws.onopen = () => {
        if (!isMounted.current) return;
        setStatus("open");
        onOpen?.();
      };

      ws.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const data = JSON.parse(event.data as string);
          onMessage?.(data);
        } catch {
          onMessage?.(event.data);
        }
      };

      ws.onclose = () => {
        if (!isMounted.current) return;
        setStatus("closed");
        onClose?.();
        if (autoReconnect) {
          reconnectTimer.current = setTimeout(connect, reconnectDelay);
        }
      };

      ws.onerror = () => {
        if (!isMounted.current) return;
        setStatus("error");
      };
    } catch (err) {
      console.error("[WebSocket] Connection failed:", err);
      setStatus("error");
    }
  }, [path, onMessage, onOpen, onClose, autoReconnect, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    connect();
    return () => {
      isMounted.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return { status, send, disconnect, reconnect: connect };
}
