import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Terminal, Rocket, CheckCircle2, Wifi, WifiOff, Cpu } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLogs } from "@/components/LogContext";

export const LiveFeed = () => {
  const { logs, isConnected, isDeploying } = useLogs();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep terminal scrolled to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-card border border-border overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/10">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isConnected ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                Agent Terminal
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">v2.5</span>
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {isConnected ? "Connection: Persistent" : "Connection: Searching..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDeploying ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-[10px] font-bold border border-warning/20 tracking-tighter">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Rocket className="h-3 w-3" />
                </motion.div>
                LIVE_ORCHESTRATION
              </div>
            ) : logs.length > 0 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
                <CheckCircle2 className="h-3 w-3" />
                STABLE
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                <Cpu className="h-3 w-3" />
                STANDBY
              </div>
            )}
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="bg-[#09090b] p-4 h-[350px] overflow-y-auto scrollbar-hide font-mono text-[11px] leading-relaxed selection:bg-primary/30"
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 italic gap-2">
              <Terminal className="h-8 w-8 opacity-10" />
              <p>Terminal ready. Waiting for deployment trigger...</p>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {logs.map((log, index) => (
                  <motion.div
                    key={`${index}-${log.timestamp}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 py-0.5"
                  >
                    <span className="text-muted-foreground/40 text-[10px] shrink-0 min-w-[65px]">
                      [{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour12: false }) : new Date().toLocaleTimeString([], { hour12: false })}]
                    </span>
                    
                    <span className={cn(
                      "flex-1 break-all",
                      (log.level || "").toLowerCase() === "success" && "text-success font-bold",
                      (log.level || "").toLowerCase() === "error" && "text-destructive font-bold",
                      (log.level || "").toLowerCase() === "ai" && "text-primary italic",
                      (log.level || "").toLowerCase() === "command" && "text-warning font-mono bg-warning/5 px-1 rounded",
                      (log.level || "").toLowerCase() === "warning" && "text-warning"
                    )}>
                      <span className="mr-2 opacity-40">❯</span>
                      {log.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isDeploying && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-primary/60 ml-[78px] align-middle"
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};