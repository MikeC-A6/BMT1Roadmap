import { GitHubIssue, CardLocation } from "@/types";

interface UseUncategorizedSectionProps {
  issues: GitHubIssue[];
  isLoading: boolean;
  onMoveIssue: (issueId: string, location: CardLocation) => void;
}

export function useUncategorizedSection({
  issues,
  isLoading,
  onMoveIssue
}: UseUncategorizedSectionProps) {
  const isEmpty = issues.length === 0;

  // If needed, you could enrich the onMoveIssue handler here
  // For example, adding analytics or validation

  return {
    isLoading,
    isEmpty,
    onMoveIssue
  };
} 