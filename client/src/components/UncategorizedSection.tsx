import { useDrag } from "react-dnd";
import { GitHubIssue, CardLocation } from "@/types";

interface UncategorizedSectionProps {
  issues: GitHubIssue[];
  isLoading: boolean;
  onMoveIssue: (issueId: string, location: CardLocation) => void;
}

function IssueCard({ issue, onMoveIssue }: { 
  issue: GitHubIssue;
  onMoveIssue: (issueId: string, location: CardLocation) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: { 
      id: issue.id,
      fromUncategorized: true
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ dropped: boolean, location: CardLocation }>();
      if (dropResult && dropResult.dropped && dropResult.location) {
        console.log(`End drag for issue ${issue.id} - dropped at ${dropResult.location.objective}-${dropResult.location.column}`);
        onMoveIssue(issue.id, dropResult.location);
      }
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag}
      className="card"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      id={issue.id}
    >
      <a 
        href={issue.url} 
        className="text-[hsl(var(--va-blue-lighter))] hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {issue.title} #{issue.number}
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

export default function UncategorizedSection({ issues, isLoading, onMoveIssue }: UncategorizedSectionProps) {
  if (isLoading) {
    return (
      <div className="mt-8 border-t-2 border-[hsl(var(--va-blue))] pt-6">
        <h2 className="text-xl font-bold mb-4 text-[hsl(var(--va-blue))]">Uncategorized GitHub Issues</h2>
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 rounded-full border-4 border-[hsl(var(--va-blue))] border-t-transparent animate-spin"></div>
          <span className="ml-3 text-[hsl(var(--va-blue-lighter))]">Loading issues...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t-2 border-[hsl(var(--va-blue))] pt-6">
      <h2 className="text-xl font-bold mb-4 text-[hsl(var(--va-blue))]">Uncategorized GitHub Issues</h2>
      
      {issues.length === 0 ? (
        <div className="bg-[hsl(var(--va-highlight))] p-6 rounded-lg text-center">
          <p className="text-[hsl(var(--va-blue))]">
            No uncategorized issues found. Click "Refresh from GitHub" to load issues.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="uncategorized">
          {issues.map(issue => (
            <IssueCard 
              key={issue.id}
              issue={issue}
              onMoveIssue={onMoveIssue}
            />
          ))}
        </div>
      )}
    </div>
  );
}
