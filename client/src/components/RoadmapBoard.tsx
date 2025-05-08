import { GitHubIssue, RoadmapCard, CardLocation } from "@/types";
import Cell from "@/components/cell";
import UncategorizedSection from "@/components/UncategorizedSection";
import { useRoadmapBoard } from "@/hooks/useRoadmapBoard";
import { objectives } from "@/config/roadmap";

interface RoadmapBoardProps {
  initialIssues: GitHubIssue[];
  isLoading: boolean;
}

interface RoadmapBoardUIProps {
  cards: RoadmapCard[];
  issues: GitHubIssue[];
  isLoading: boolean;
  isSaving: boolean;
  onAddCard: (objectiveId: string, column: string, text: string) => string;
  onDeleteCard: (cardId: string) => void;
  onTogglePriority: (cardId: string, isHighPriority: boolean) => void;
  onUpdateCardText: (cardId: string, newText: string) => void;
  onMoveCard: (cardId: string, newLocation: CardLocation) => void;
  onMoveIssue: (issueId: string, location: CardLocation) => void;
}

// Presentational component that renders the UI
function RoadmapBoardUI({
  cards,
  issues, 
  isLoading,
  isSaving,
  onAddCard,
  onDeleteCard,
  onTogglePriority,
  onUpdateCardText,
  onMoveCard,
  onMoveIssue
}: RoadmapBoardUIProps) {
  return (
    <main className="max-w-7xl mx-auto pt-4">
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-pulse text-center">
            <div className="h-4 w-32 bg-gray-200 rounded mb-4 mx-auto"></div>
            <p className="text-gray-500">Loading roadmap data...</p>
          </div>
        </div>
      )}

      <div id="roadmap" className="grid gap-5 mx-auto max-w-full">
        {/* Headers Row - Sticky */}
        <div className="sticky-column-headers">
          <div className="grid grid-cols-5 gap-5">
            <div className="col-span-1"></div>
            <div className="header-col col-span-1">Now</div>
            <div className="header-col col-span-1">Next</div>
            <div className="header-col col-span-2">Later</div>
          </div>
        </div>
        
        {/* Objective Rows */}
        {objectives.map(objective => (
          <div key={objective.id} className="grid grid-cols-5 gap-5">
            <div 
              className="objective col-span-1"
              dangerouslySetInnerHTML={{ __html: objective.text }}
            />
            
            {/* Now column */}
            <Cell 
              cards={cards.filter(
                card => card.location.objective === objective.id && card.location.column === "now"
              )}
              location={{ objective: objective.id, column: "now" }}
              onAddCard={(text) => onAddCard(objective.id, "now", text)}
              onDeleteCard={onDeleteCard}
              onUpdateCardText={onUpdateCardText}
              onMoveCard={onMoveCard}
              onTogglePriority={onTogglePriority}
              className="col-span-1"
            />
            
            {/* Next column */}
            <Cell 
              cards={cards.filter(
                card => card.location.objective === objective.id && card.location.column === "next"
              )}
              location={{ objective: objective.id, column: "next" }}
              onAddCard={(text) => onAddCard(objective.id, "next", text)}
              onDeleteCard={onDeleteCard}
              onUpdateCardText={onUpdateCardText}
              onMoveCard={onMoveCard}
              onTogglePriority={onTogglePriority}
              className="col-span-1"
            />
            
            {/* Later column (double width) */}
            <Cell 
              cards={cards.filter(
                card => card.location.objective === objective.id && card.location.column === "later"
              )}
              location={{ objective: objective.id, column: "later" }}
              onAddCard={(text) => onAddCard(objective.id, "later", text)}
              onDeleteCard={onDeleteCard}
              onUpdateCardText={onUpdateCardText}
              onMoveCard={onMoveCard}
              onTogglePriority={onTogglePriority}
              className="col-span-2"
            />
          </div>
        ))}
        
        {/* Uncategorized GitHub Issues */}
        <UncategorizedSection 
          issues={issues}
          isLoading={isLoading}
          onMoveIssue={onMoveIssue}
        />
      </div>

      {/* Status indicator for mutations */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-md shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></div>
            <span>Saving changes...</span>
          </div>
        </div>
      )}
    </main>
  );
}

// Container component that manages state and logic
export default function RoadmapBoard({ initialIssues, isLoading: isLoadingIssues }: RoadmapBoardProps) {
  const {
    cards,
    issues,
    isLoading,
    isSaving,
    handleAddCard,
    handleDeleteCard,
    handleTogglePriority,
    handleUpdateCardText,
    handleMoveCard,
    handleMoveIssueToRoadmap
  } = useRoadmapBoard({ 
    initialIssues, 
    isLoadingIssues 
  });

  return (
    <RoadmapBoardUI
      cards={cards}
      issues={issues}
      isLoading={isLoading}
      isSaving={isSaving}
      onAddCard={handleAddCard}
      onDeleteCard={handleDeleteCard}
      onTogglePriority={handleTogglePriority}
      onUpdateCardText={handleUpdateCardText}
      onMoveCard={handleMoveCard}
      onMoveIssue={handleMoveIssueToRoadmap}
    />
  );
}
