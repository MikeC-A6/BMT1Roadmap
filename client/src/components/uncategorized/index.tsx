import { GitHubIssue, CardLocation } from "@/types";
import { useUncategorizedSection } from "@/hooks/useUncategorizedSection";
import { UncategorizedSectionUI } from "./UncategorizedSectionUI";

interface UncategorizedSectionProps {
  issues: GitHubIssue[];
  isLoading: boolean;
  onMoveIssue: (issueId: string, location: CardLocation) => void;
}

export default function UncategorizedSection(props: UncategorizedSectionProps) {
  const { issues, isLoading, onMoveIssue } = props;
  
  // Use the extracted behavior hook
  const {
    isEmpty,
    // We can use the original or the potentially enriched handler
    onMoveIssue: handleMoveIssue
  } = useUncategorizedSection(props);
  
  return (
    <UncategorizedSectionUI
      issues={issues}
      isLoading={isLoading}
      isEmpty={isEmpty}
      onMoveIssue={handleMoveIssue}
    />
  );
} 