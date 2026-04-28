import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Deployment } from "@/lib/deployments";
import { 
  RotateCw, 
  ExternalLink, 
  GitCommit, 
  Clock, 
  Server,
  CheckCircle2,
  XCircle,
  Terminal,
  Cpu,
  ShieldCheck,
  Rocket
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";

interface LogEntry {
  message: string;
  level?: string;
  timestamp?: string;
  deployment_id?: string;
}

interface DeploymentDetailProps {
  deployment: Deployment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LogLine = ({ log, index }: { log: LogEntry; index: number }) => {
  const getLogStyle = (level: string = "info") => {
    switch (level.toLowerCase()) {
      case "error": return "text-destructive border-l-2 border-destructive pl-2";
      case "warning": return "text-warning border-l-2 border-warning pl-2";
      case "ai": return "text-primary italic font-semibold";
      case "command": return "text-warning font-mono bg-secondary/30 px-1 rounded";
      case "success": return "text-success font-bold";
      default: return "text-foreground/80";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex items-start gap-3 py-1 font-mono text-[11px] leading-relaxed", getLogStyle(log.level))}
    >
      <span className="text-muted-foreground/40 shrink-0 min-w-[70px]">
        [{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour12: false }) : new Date().toLocaleTimeString([], { hour12: false })}]
      </span>
      <span className="break-all whitespace-pre-wrap">{log.message}</span>
    </motion.div>
  );
};

export const DeploymentDetail = ({ deployment, open, onOpenChange }: DeploymentDetailProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !deployment) {
      setLogs([]); // Reset logs when dialog closes
      return;
    }

    const socket: Socket = io(API_BASE_URL, { transports: ["websocket"] });

    socket.on("log", (payload: LogEntry) => {
      if (payload.deployment_id === deployment.id) {
        setLogs((prev) => [...prev, payload]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [open, deployment]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!deployment) return null;

  const getStepStatus = (stepIndex: number) => {
    const statusMap: Record<string, number> = {
      "pending": 0,
      "in_progress": 2,
      "success": 5,
      "failed": -1
    };
    const currentIdx = statusMap[deployment.status] || 0;
    if (currentIdx === -1) return "failed";
    if (stepIndex < currentIdx) return "complete";
    if (stepIndex === currentIdx) return "active";
    return "pending";
  };

  const steps = [
    { label: "Fetch", icon: GitCommit },
    { label: "Install", icon: Terminal },
    { label: "Build", icon: Cpu },
    { label: "Heal", icon: ShieldCheck },
    { label: "Live", icon: Rocket }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-card border-border p-0 gap-0 overflow-hidden">
        
        {/* Header Section: Fixed Overlap here */}
        <div className="p-6 border-b border-border bg-secondary/5 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="text-xl font-bold tracking-tight truncate max-w-[300px]">
                  {deployment.repo_url.split('/').pop()?.replace('.git', '') || "Deployment"}
                </DialogTitle>
                <StatusBadge status={deployment.status} />
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">{deployment.repo_url}</p>
            </div>
            <div className="flex gap-2 shrink-0">
            <Button 
  variant="outline" 
  size="sm" 
  className="h-8 text-xs px-3" 
  disabled={deployment.status !== "success" || !deployment.server_ip_address}
  onClick={() => {
    if (deployment.server_ip_address) {
      window.open(`http://${deployment.server_ip_address}:3000`, '_blank');
    }
  }}
>
  <ExternalLink className="h-3.5 w-3.5 mr-2" /> 
  Live
</Button>
              <Button variant="default" size="sm" className="h-8 text-xs px-3">
                <RotateCw className="h-3.5 w-3.5 mr-2" /> Redeploy
              </Button>
            </div>
          </div>

          {/* Stats Grid: Fixed Overlap here */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 border-t border-border/50 mt-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <Server className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase text-muted-foreground leading-none mb-1">Target Node</p>
                <p className="text-xs font-medium truncate">{deployment.server_ip_address || "None"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-hidden">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase text-muted-foreground leading-none mb-1">Created</p>
                <p className="text-xs font-medium">{new Date(deployment.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-hidden">
              <GitCommit className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase text-muted-foreground leading-none mb-1">Task ID</p>
                <p className="text-xs font-mono font-medium truncate">{deployment.celery_task_id || "Queued"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Visualizer: Improved spacing */}
        <div className="px-10 py-6 bg-background/50 border-b border-border shrink-0">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute top-4 left-0 right-0 h-[1px] bg-border -z-10" />
            {steps.map((step, idx) => {
              const state = getStepStatus(idx + 1);
              const StepIcon = step.icon;
              return (
                <div key={step.label} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border transition-all z-10",
                    state === "complete" && "bg-success border-success text-success-foreground",
                    state === "active" && "bg-warning/10 border-warning text-warning animate-pulse",
                    state === "failed" && "bg-destructive border-destructive text-destructive-foreground",
                    state === "pending" && "bg-card border-border text-muted-foreground"
                  )}>
                    {state === "complete" ? <CheckCircle2 className="h-4 w-4" /> : 
                     state === "failed" ? <XCircle className="h-4 w-4" /> : 
                     <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-Time Terminal: Takes remaining space */}
        <div className="flex-1 bg-[#09090b] flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-2">
              <Terminal className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.2em]">
                Agent stdout
              </span>
            </div>
            {deployment.status === "in_progress" && (
              <div className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-warning animate-ping" />
                <span className="text-[9px] text-warning font-mono font-bold tracking-widest">LIVE</span>
              </div>
            )}
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 scrollbar-hide"
          >
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center italic opacity-20 text-xs font-mono">
                Waiting for deployment signal...
              </div>
            ) : (
              <div className="space-y-0.5">
                {logs.map((log, index) => (
                  <LogLine key={`${deployment.id}-${index}`} log={log} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};