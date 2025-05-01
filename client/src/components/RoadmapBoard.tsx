import { useState, useEffect } from "react";
import { GitHubIssue, RoadmapObjective, RoadmapCard, CardLocation } from "@/types";
import Cell from "@/components/Cell";
import UncategorizedSection from "@/components/UncategorizedSection";

const objectives: RoadmapObjective[] = [
  {
    id: "obj1",
    text: "Increase Veteran satisfaction with web / mobile products <strong>+5 points</strong>"
  },
  {
    id: "obj2",
    text: "1.2 Cut Veteran wait‑time for a response by <strong>50%</strong> — target &lt; 4s / transaction"
  },
  {
    id: "obj3",
    text: "1.3 Ensure <strong>100%</strong> of transactions are processed correctly <em>or</em> the user receives an error notification"
  },
  {
    id: "obj4",
    text: "No <u>VA.gov</u> benefits transactions rely on services slated for deprecation within 24 months (legacy VBMS, BGS, BEP APIs, EVSS)"
  },
  {
    id: "obj5",
    text: "Other (does not neatly fit into a KR)"
  }
];

// Initial cards setup (matching the sample)
const initialCards: RoadmapCard[] = [
  { id: "card-1", text: "CST – Claim Status Tool: Fast, Jitter‑Free First Load", location: { objective: "obj1", column: "now" } },
  { id: "card-2", text: "Route signed‑in Veterans directly to their Claim Status Tool (\"double loading\")", location: { objective: "obj1", column: "now" } },
  { id: "card-3", text: "Accurate claim titles", location: { objective: "obj1", column: "next" } },
  { id: "card-4", text: "Add link to file and view travel pay claims", location: { objective: "obj1", column: "next" } },
  { id: "card-5", text: "Discovery into C&P exam improvement opportunities", location: { objective: "obj1", column: "later" } },
  { id: "card-6", text: "Improve file history experience", location: { objective: "obj1", column: "later" } },
  { id: "card-7", text: "Kick‑off component modernization", location: { objective: "obj2", column: "now" } },
  { id: "card-8", text: "Continue component refactors", location: { objective: "obj2", column: "next" } },
  { id: "card-9", text: "Fix file‑upload error so users know when their upload fails", location: { objective: "obj3", column: "now" } },
  { id: "card-10", text: "5103 silent failure polling solution", location: { objective: "obj3", column: "later" } },
  { id: "card-11", text: "EVSS → Lighthouse letters download (discovery)", location: { objective: "obj4", column: "now" } },
  { id: "card-12", text: "Letter-download EVSS → Lighthouse migration (build)", location: { objective: "obj4", column: "next" } },
  { id: "card-13", text: "Fix all heading‑hierarchy violations that will break Cypress Axe tests when new rules activate on April 30", location: { objective: "obj5", column: "now" } },
  { id: "card-14", text: "Migration USWDS v3 file‑upload", location: { objective: "obj5", column: "next" } },
  { id: "card-15", text: "Automate Feedback survey sentiment analysis", location: { objective: "obj5", column: "later" } },
  { id: "card-16", text: "Pick up event‑based architecture & decision letter notification work", location: { objective: "obj5", column: "later" }, isAccent: true },
  { id: "card-17", text: "Expand claim letter sorting functionality", location: { objective: "obj1", column: "later" } },
  { id: "card-18", text: "Introduce C&P exam experience improvements", location: { objective: "obj1", column: "later" } },
  { id: "card-19", text: "High‑value performance optimizations", location: { objective: "obj2", column: "next" } },
  { id: "card-20", text: "Extend performance epic to lower‑impact files and test helpers", location: { objective: "obj2", column: "later" } },
  { id: "card-21", text: "Evidence request email notifications", location: { objective: "obj5", column: "later" } }
];

interface RoadmapBoardProps {
  initialIssues: GitHubIssue[];
  isLoading: boolean;
}

export default function RoadmapBoard({ initialIssues, isLoading }: RoadmapBoardProps) {
  const [cards, setCards] = useState<RoadmapCard[]>(initialCards);
  const [nextId, setNextId] = useState(22);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  
  // Update issues when loaded
  useEffect(() => {
    if (initialIssues && initialIssues.length > 0) {
      setIssues(initialIssues);
    }
  }, [initialIssues]);
  
  // Handler for adding a new card
  const handleAddCard = (objectiveId: string, column: string, text: string = "") => {
    const newCard: RoadmapCard = {
      id: `card-${nextId}`,
      text,
      location: { objective: objectiveId, column }
    };
    
    setCards(prevCards => [...prevCards, newCard]);
    setNextId(prevId => prevId + 1);
    return newCard.id;
  };
  
  // Handler for deleting a card
  const handleDeleteCard = (cardId: string) => {
    setCards(prevCards => prevCards.filter(card => card.id !== cardId));
  };
  
  // Handler for updating card text
  const handleUpdateCardText = (cardId: string, newText: string) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, text: newText } : card
      )
    );
  };
  
  // Handler for moving a card to a new location
  const handleMoveCard = (cardId: string, newLocation: CardLocation) => {
    console.log(`RoadmapBoard: Moving card ${cardId} to ${newLocation.objective}-${newLocation.column}`);
    
    // Check if this is an uncategorized issue being moved
    const issue = issues.find(i => i.id === cardId);
    if (issue) {
      // This is a GitHub issue from uncategorized section
      handleMoveIssueToRoadmap(cardId, newLocation);
      return;
    }
    
    // Otherwise, it's a normal card movement
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, location: newLocation } : card
      )
    );
  };
  
  // Handler for moving a GitHub issue to the roadmap
  const handleMoveIssueToRoadmap = (issueId: string, location: CardLocation) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) {
      console.log(`Issue not found: ${issueId}`);
      return;
    }
    
    console.log(`Moving issue to roadmap: ${issue.title} to ${location.objective} ${location.column}`);
    
    // Create a new card for this issue
    const newCard: RoadmapCard = {
      id: issueId, // Keep the same ID for consistent tracking
      text: issue.title,
      location,
      githubNumber: issue.number,
      githubUrl: issue.url
    };
    
    setCards(prevCards => [...prevCards, newCard]);
    
    // Remove from uncategorized
    setIssues(prevIssues => prevIssues.filter(i => i.id !== issueId));
  };
  
  return (
    <main className="max-w-7xl mx-auto">
      <div id="roadmap" className="grid gap-5">
        {/* Headers Row */}
        <div className="grid grid-cols-4 gap-5">
          <div></div>
          <div className="header-col">Now</div>
          <div className="header-col">Next</div>
          <div className="header-col">Later</div>
        </div>
        
        {/* Objective Rows */}
        {objectives.map(objective => (
          <div key={objective.id} className="grid grid-cols-4 gap-5">
            <div 
              className="objective"
              dangerouslySetInnerHTML={{ __html: objective.text }}
            />
            
            {/* Now column */}
            <Cell 
              cards={cards.filter(
                card => card.location.objective === objective.id && card.location.column === "now"
              )}
              location={{ objective: objective.id, column: "now" }}
              onAddCard={(text) => handleAddCard(objective.id, "now", text)}
              onDeleteCard={handleDeleteCard}
              onUpdateCardText={handleUpdateCardText}
              onMoveCard={handleMoveCard}
            />
            
            {/* Next column */}
            <Cell 
              cards={cards.filter(
                card => card.location.objective === objective.id && card.location.column === "next"
              )}
              location={{ objective: objective.id, column: "next" }}
              onAddCard={(text) => handleAddCard(objective.id, "next", text)}
              onDeleteCard={handleDeleteCard}
              onUpdateCardText={handleUpdateCardText}
              onMoveCard={handleMoveCard}
            />
            
            {/* Later column */}
            <Cell 
              cards={cards.filter(
                card => card.location.objective === objective.id && card.location.column === "later"
              )}
              location={{ objective: objective.id, column: "later" }}
              onAddCard={(text) => handleAddCard(objective.id, "later", text)}
              onDeleteCard={handleDeleteCard}
              onUpdateCardText={handleUpdateCardText}
              onMoveCard={handleMoveCard}
            />
          </div>
        ))}
        
        {/* Uncategorized GitHub Issues */}
        <UncategorizedSection 
          issues={issues}
          isLoading={isLoading}
          onMoveIssue={handleMoveIssueToRoadmap}
        />
      </div>
    </main>
  );
}
