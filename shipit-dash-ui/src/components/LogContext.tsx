import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";

type StreamLog = {
  deployment_id?: string;
  message: string;
  level?: string;
  timestamp?: string;
};

interface LogContextType {
  logs: StreamLog[];
  isConnected: boolean;
  isDeploying: boolean;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider = ({ children }: { children: React.ReactNode }) => {
  const [logs, setLogs] = useState<StreamLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    // Connect to the Flask-SocketIO server
    const socket: Socket = io(API_BASE_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      console.log("✅ [GLOBAL_LOG_ENGINE] Connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("log", (payload: StreamLog) => {
      const activeId = localStorage.getItem("shipit_active_deployment_id");
      
      // Filter: Only show logs for the current active deployment if one is set
      if (activeId && payload.deployment_id && payload.deployment_id !== activeId) {
        return;
      }

      setIsDeploying(true);
      setLogs((prev) => [...prev.slice(-99), payload]);

      const level = (payload.level || "").toLowerCase();
      if (["success", "error", "failed"].includes(level)) {
        setIsDeploying(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const clearLogs = () => setLogs([]);

  return (
    <LogContext.Provider value={{ logs, isConnected, isDeploying, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error("useLogs must be used within a LogProvider");
  }
  return context;
};