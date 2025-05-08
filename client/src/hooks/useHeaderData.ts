import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GitHubIssuesResponse } from "@/types";

/**
 * Hook to manage Header data including GitHub issues fetching and refreshing
 */
export function useHeaderData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get the GitHub issues data to extract the last refreshed time
  const { data: issuesData } = useQuery<GitHubIssuesResponse & { lastRefreshed?: string }>({
    queryKey: ['/api/github/issues'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Format timestamp to a readable date/time
  const formatLastRefreshed = (timestamp: string | null | undefined) => {
    if (!timestamp) return "Never";
    
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (e) {
      return "Unknown";
    }
  };
  
  const { mutate: refreshIssues, isPending: isRefreshing } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/github/issues/refresh', {
        method: 'GET'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/github/issues'] });
      toast({
        title: "Success!",
        description: "GitHub issues refreshed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error refreshing issues",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  return {
    lastRefreshed: formatLastRefreshed(issuesData?.lastRefreshed),
    isRefreshing,
    refreshIssues
  };
} 