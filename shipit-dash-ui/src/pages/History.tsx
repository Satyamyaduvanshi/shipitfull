import { motion } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useDeployments } from "@/hooks/useDeployments";
import {
  GitCommit,
  Rocket,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const getActivityIcon = (type: string, status: string) => {
  if (type === "rollback") return RefreshCw;
  if (type === "alert") return AlertTriangle;
  if (status === "success") return CheckCircle2;
  if (status === "failed") return XCircle;
  return Rocket;
};

const getActivityColor = (type: string, status: string) => {
  if (type === "alert") return "text-warning bg-warning/10 border-warning/30";
  if (status === "success") return "text-success bg-success/10 border-success/30";
  if (status === "failed") return "text-destructive bg-destructive/10 border-destructive/30";
  if (status === "in-progress") return "text-warning bg-warning/10 border-warning/30";
  return "text-muted-foreground bg-muted border-border";
};

const History = () => {
  const { data: deployments = [], isLoading, isError } = useDeployments();
  const activities = deployments
    .map((deployment) => ({
      id: `deploy-${deployment.id}`,
      type: "deployment",
      project: deployment.repo_url,
      status: deployment.status,
      message: `Deployment created for ${deployment.repo_url}`,
      author: deployment.userId,
      commit: deployment.celery_task_id,
      time: new Date(deployment.created_at).toLocaleString(),
      createdAt: deployment.created_at,
      serverIp: deployment.server_ip_address || "No IP",
    }))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="min-h-screen bg-background scrollbar-hide">
      <AppSidebar />
      <Navbar />

      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Activity History
            </h1>
            <p className="text-muted-foreground">
              A timeline of all deployments, rollbacks, and system events
            </p>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <span className="text-sm text-muted-foreground">
                  {activities.length} events in the last 24 hours
                </span>
              </div>

              {isLoading ? (
                <div className="p-12 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading activity...
                </div>
              ) : isError ? (
                <div className="p-12 text-center text-destructive">
                  Failed to load activity history. Check backend connection.
                </div>
              ) : activities.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No deployments yet. Trigger your first deployment!
                </div>
              ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />

                <div className="divide-y divide-border">
                  {activities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type, activity.status);
                    const colorClass = getActivityColor(activity.type, activity.status);

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="relative flex gap-6 p-6 hover:bg-secondary/30 transition-colors"
                      >
                        {/* Timeline dot */}
                        <div
                          className={cn(
                            "relative z-10 flex items-center justify-center h-10 w-10 rounded-full border-2 flex-shrink-0",
                            colorClass
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-medium text-foreground">
                              {activity.project}
                            </span>
                            <StatusBadge status={activity.status} />
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {activity.serverIp}
                            </span>
                          </div>

                          <p className="text-sm text-foreground">{activity.message}</p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {activity.commit && (
                              <span className="flex items-center gap-1.5">
                                <GitCommit className="h-3.5 w-3.5" />
                                <span className="font-mono">{activity.commit}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {activity.author}
                            </span>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              )}
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default History;
