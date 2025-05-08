import { GitHubIssue, CardLocation } from "@/types";
import GitHubLogo from "../GitHubLogo";
import { useIssueDrag } from "@/hooks/useIssueDrag";

interface IssueCardProps {
  issue: GitHubIssue;
  onMoveIssue: (issueId: string, location: CardLocation) => void;
}

export function IssueCard({ issue, onMoveIssue }: IssueCardProps) {
  // Use the custom hook for drag functionality
  const [dragRef, isDragging] = useIssueDrag(issue.id, onMoveIssue);

  return (
    <div 
      ref={dragRef}
      className="card"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      id={issue.id}
    >
      <a 
        href={issue.url} 
        className="text-[hsl(var(--va-blue-lighter))] hover:underline flex items-start"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <GitHubLogo />
        <span>{issue.title} #{issue.number}</span>
      </a>
      
      <button 
        className="card-action action-delete" 
        title="Remove from list"
        onClick={(e) => {
          e.stopPropagation();
          // Just hide from uncategorized without deleting completely
          onMoveIssue(issue.id, { objective: "hidden", column: "hidden" });
        }}
      >
        −
      </button>
    </div>
  );
} 