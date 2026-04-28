import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "success" | "failed" | "in-progress" | "pending" | "cancelled";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<Status, { label: string; icon: React.ElementType; className: string }> = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/30 hover:bg-success/15",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15",
  },
  "in-progress": {
    label: "Deploying",
    icon: Loader2,
    className: "bg-info/10 text-info border-info/30 hover:bg-info/15",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/15",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const normalizedStatus = status === "in_progress" ? "in-progress" : status;
  const config = statusConfig[normalizedStatus as Status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium gap-1.5 py-1 px-2.5 transition-colors",
        config.className,
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", normalizedStatus === "in-progress" && "animate-spin")} />
      {config.label}
    </Badge>
  );
};
