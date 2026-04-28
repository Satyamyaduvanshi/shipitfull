import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { DeploymentDetail } from "@/components/DeploymentDetail";
import { Deployment } from "@/lib/deployments";
import { GitBranch, Clock, ArrowRight, Loader2, Server } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDeployments } from "@/hooks/useDeployments";

export const DeploymentsTable = () => {
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: deployments = [], isLoading, isError } = useDeployments();

  const handleDeploymentClick = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setDetailOpen(true);
  };

  const formatCreatedAt = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Deployment History
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time records from your PostgreSQL database
            </p>
          </div>
          
          {isLoading ? (
            <div className="p-10 flex items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching deployments...
            </div>
          ) : isError ? (
            <div className="p-10 text-center text-destructive">
              Failed to load deployments. Check backend connection.
            </div>
          ) : deployments.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              No deployments found. Trigger your first deployment!
            </div>
          ) : (
            <div className="divide-y divide-border">
            {deployments.map((deployment, index) => (
              <motion.div
                key={deployment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.02 }}
                onClick={() => handleDeploymentClick(deployment)}
                className={cn(
                  "flex items-center justify-between p-4 cursor-pointer transition-colors group",
                  "hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground truncate">{deployment.repo_url}</span>
                      <StatusBadge status={deployment.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <GitBranch className="h-3.5 w-3.5" />
                        <span className="font-mono truncate max-w-[260px]">
                          {deployment.celery_task_id || "Task ID Pending"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right text-sm text-muted-foreground flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" />
                    {deployment.server_ip_address || "No IP assigned"}
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatCreatedAt(deployment.created_at)}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
            </div>
          )}
        </Card>
      </motion.div>

      <DeploymentDetail
        deployment={selectedDeployment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
};