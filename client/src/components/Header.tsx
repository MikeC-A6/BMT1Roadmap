import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GitHubIssuesResponse } from "@/types";
import GitHubLogo from "./GitHubLogo";

export default function Header() {
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
  
  return (
    <header className="relative max-w-7xl mx-auto mb-8 pt-4 pb-16 h-48">
      {/* Container for the logo with mask */}
      <div className="absolute inset-0 overflow-hidden flex justify-center items-center">
        <div className="logo-container flex justify-center items-center w-64 h-64">
          <img 
            src="./assets/BMT1 Dark Horse (1).png" 
            alt="Mavericks BMT1 Logo" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      {/* Content on top of the logo */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start">
          <h1 className="text-3xl font-bold text-[hsl(var(--va-blue))]">Mavericks BMT1 Roadmap</h1>
          <p className="text-[hsl(var(--va-blue-lighter))] text-lg font-semibold">Benefits Management Tools Team 1</p>
          <p className="text-sm text-[hsl(var(--va-blue-lighter))] mt-1">
            Issues last refreshed: {formatLastRefreshed(issuesData?.lastRefreshed)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => refreshIssues()}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-[hsl(var(--va-blue))] text-white py-2 px-4 rounded-lg shadow hover:bg-[#00529c] transition-colors disabled:opacity-70"
          >
            <GitHubLogo className={`h-5 w-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh from GitHub
          </button>
          {isRefreshing && <span className="text-[hsl(var(--va-blue-lighter))] italic">Loading issues...</span>}
        </div>
      </div>
    </header>
  );
}
