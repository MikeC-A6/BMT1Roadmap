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
        </div>
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
      </div>
    </header>
  );
}
