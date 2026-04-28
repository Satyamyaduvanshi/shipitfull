// src/hooks/useUser.ts
import { useQuery } from "@tanstack/react-query";
import { getUserId } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";

export const useUser = () => {
  const userId = getUserId();

  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID found");
      
      // Fixed the URL to match the blueprint prefix
      const response = await fetch(`${API_BASE_URL}/api/auth/me?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      
      return response.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};