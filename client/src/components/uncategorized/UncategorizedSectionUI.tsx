import { GitHubIssue, CardLocation } from "@/types";
import { IssueCard } from "./IssueCard";

interface UncategorizedSectionUIProps {
  issues: GitHubIssue[];
  isLoading: boolean;
  isEmpty: boolean;
  onMoveIssue: (issueId: string, location: CardLocation) => void;
}

export function UncategorizedSectionUI({
  issues,
  isLoading,
  isEmpty,
  onMoveIssue
}: UncategorizedSectionUIProps) {
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
      
      {isEmpty ? (
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