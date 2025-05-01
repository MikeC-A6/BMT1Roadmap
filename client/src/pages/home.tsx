import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import RoadmapBoard from "@/components/RoadmapBoard";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  
  // Set page title
  useEffect(() => {
    document.title = "VA Claim Status Roadmap";
  }, []);
  
  // Initial data fetch handler
  const { data: initialData, isLoading: isInitialLoading, error } = useQuery({
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
  
  return (
    <div className="bg-gradient-to-br from-[#fafaff] to-[#eef3ff] min-h-screen font-inter p-4 md:p-10">
      <Header />
      <RoadmapBoard 
        initialIssues={initialData?.issues || []}
        isLoading={isInitialLoading}
      />
    </div>
  );
}
