import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Header() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { mutate: refreshIssues, isPending: isRefreshing } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/github/issues/refresh", undefined);
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
    <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <h1 className="text-2xl font-bold text-[hsl(var(--va-blue))]">VA Claim Status Roadmap</h1>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => refreshIssues()}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-[hsl(var(--va-blue))] text-white py-2 px-4 rounded-lg shadow hover:bg-[#00529c] transition-colors disabled:opacity-70"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh from GitHub
        </button>
        {isRefreshing && <span className="text-[hsl(var(--va-blue-lighter))] italic">Loading issues...</span>}
      </div>
    </header>
  );
}
