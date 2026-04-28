import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { DeploymentDetail } from "@/components/DeploymentDetail";
import { NewDeploymentModal } from "@/components/NewDeploymentModal"; // New Component
import { Deployment } from "@/lib/deployments";
import { Search, Filter, GitBranch, Clock, ArrowRight, X, Loader2, Server } from "lucide-react";
import { useDeployments } from "@/hooks/useDeployments";

const Deployments = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: deployments = [], isLoading, isError } = useDeployments();

  const filteredDeployments = useMemo(() => {
    return deployments.filter((d) => {
      const matchesSearch =
        d.repo_url.toLowerCase().includes(search.toLowerCase()) ||
        (d.server_ip_address || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.celery_task_id || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [deployments, search, statusFilter]);

  const handleDeploymentClick = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setDetailOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const hasActiveFilters = search || statusFilter !== "all";
  
  const formatCreatedAt = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background scrollbar-hide">
      <AppSidebar />
      <Navbar />

      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8 space-y-6">
          {/* Header with New Deployment Button */}
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                Deployments
              </h1>
              <p className="text-muted-foreground">
                View and manage all deployments across your projects
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <NewDeploymentModal />
            </motion.div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-card border-border">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search deployments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-background border-border"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filters:</span>
                  </div>

                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                    <SelectTrigger className="w-[140px] bg-background border-border">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Results List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {filteredDeployments.length} deployment{filteredDeployments.length !== 1 ? "s" : ""}
                </span>
              </div>

              {isLoading ? (
                <div className="p-12 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading deployments...
                </div>
              ) : isError ? (
                <div className="p-12 text-center text-destructive">
                  Failed to load deployments. Check backend connection.
                </div>
              ) : filteredDeployments.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">No deployments yet. Trigger your first deployment!</p>
                  {hasActiveFilters && (
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredDeployments.map((deployment, index) => (
                    <motion.div
                      key={deployment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      onClick={() => handleDeploymentClick(deployment)}
                      className="flex items-center justify-between p-4 cursor-pointer transition-colors group hover:bg-secondary/50"
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
                              <span className="font-mono truncate max-w-[300px]">
                                {deployment.celery_task_id || "No task ID"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Server className="h-3.5 w-3.5" />
                            {deployment.server_ip_address || "No IP"}
                          </span>
                        </span>
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
        </div>
      </main>

      <DeploymentDetail
        deployment={selectedDeployment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default Deployments;