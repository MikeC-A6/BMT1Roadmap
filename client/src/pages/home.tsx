import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import RoadmapBoard from "@/components/RoadmapBoard";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { GitHubIssuesResponse } from "@/types";

// Type for the refresh API response
interface RefreshResponse {
  message: string;
  count: number;
  lastRefreshed: string;
}

export default function Home() {
  const { toast } = useToast();
  
  // Set page title
  useEffect(() => {
    document.title = "VA Claim Status Roadmap";
  }, []);
  
  // Initial data fetch handler
  const { data: initialData, isLoading: isInitialLoading, error } = useQuery<GitHubIssuesResponse & { lastRefreshed?: string }>({
    queryKey: ['/api/github/issues'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Handle error for initial fetch
  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching GitHub issues",
        description: "Please try refreshing or check your connection.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Extract issues from API response
  const issues = initialData?.issues || [];
  
  return (
    <div className="bg-gradient-to-br from-[#fafaff] to-[#eef3ff] min-h-screen font-inter p-4 md:p-10">
      <Header />
      
      <RoadmapBoard 
        initialIssues={issues}
        isLoading={isInitialLoading}
      />
    </div>
  );
}
