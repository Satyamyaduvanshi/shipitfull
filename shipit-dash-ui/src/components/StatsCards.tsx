import { Activity, Boxes, Cloud, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useDeployments } from "@/hooks/useDeployments";

export const StatsCards = () => {
  const { data: deployments = [] } = useDeployments();

  // Calculate real metrics
  const activeCount = deployments.filter(d => d.status === "in_progress").length;
  const successCount = deployments.filter(d => d.status === "success").length;
  const totalCount = deployments.length;

  const stats = [
    {
      title: "Active Deployments",
      value: activeCount.toString(),
      subtitle: "Running via Celery",
      icon: Activity,
      color: "text-warning",
    },
    {
      title: "Total Deployments",
      value: totalCount.toString(),
      subtitle: "Lifecycle records",
      icon: Boxes,
      color: "text-primary",
    },
    {
      title: "Deployment Success",
      value: successCount.toString(),
      subtitle: "Fully self-healed",
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      title: "Connected Nodes",
      value: "1",
      subtitle: "AWS EC2 Instances",
      icon: Cloud,
      color: "text-info",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-5 bg-card border border-border group hover:border-primary/50 transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {stat.title}
                </p>
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                </div>
              </div>
              <div className={`p-2 rounded-lg bg-secondary ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};