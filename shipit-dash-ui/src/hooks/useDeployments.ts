import { useQuery } from "@tanstack/react-query";
import { deployApi } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import type { Deployment } from "@/lib/deployments";

export const useDeployments = () => {
  return useQuery({
    queryKey: ["deployments", getUserId()],
    queryFn: async () => {
      const userId = getUserId();
      if (!userId) {
        return [] as Deployment[];
      }
      const response = await deployApi.byUser(userId);
      return response.map((item) => ({
        id: String(item.id || ""),
        userId: String(item.userId || ""),
        repo_url: String(item.repo_url || ""),
        status: String(item.status || "pending"),
        celery_task_id: item.celery_task_id ? String(item.celery_task_id) : null,
        server_ip_address: item.server_ip_address ? String(item.server_ip_address) : null,
        created_at: String(item.created_at || new Date().toISOString()),
      }));
    },
    staleTime: 15_000,
  });
};
