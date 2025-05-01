import { useState, useEffect } from "react";
import { GitHubIssue, RoadmapObjective, RoadmapCard, CardLocation } from "@/types";
import Cell from "@/components/Cell";
import UncategorizedSection from "@/components/UncategorizedSection";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const { toast } = useToast();
  
  // Fetch cards from the API
  const { 
    data: cardsData, 
    isLoading: isLoadingCards,
    isError: isCardsError,
    error: cardsError
  } = useQuery<{cards: RoadmapCard[]}>({
    queryKey: ['/api/roadmap/cards'],
    staleTime: 10 * 1000, // 10 seconds
  });
  
  // Use the cards from API if available, otherwise fallback to initialCards
  const [cards, setCards] = useState<RoadmapCard[]>(initialCards);
  const [nextId, setNextId] = useState(22);
  
  // Load cards from API when available
  useEffect(() => {
    if (cardsData?.cards && cardsData.cards.length > 0) {
      console.log('Loading cards from API:', cardsData.cards.length);
      setCards(cardsData.cards);
      
      // Find the highest ID to set nextId properly
      const highestId = Math.max(
        ...cardsData.cards
          .map((card: RoadmapCard) => {
            const match = card.id.match(/card-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((id: number) => !isNaN(id))
      );
      
      if (highestId > 0) {
        setNextId(highestId + 1);
      }
    } else if (cardsData?.cards && cardsData.cards.length === 0) {
      // If we got an empty array from the API, seed with initial cards
      console.log('No cards in API, seeding with initial data');
      createInitialCards();
    }
  }, [cardsData]);
  
  // Handle errors from cards API
  useEffect(() => {
    if (isCardsError && cardsError) {
      toast({
        title: "Error fetching roadmap cards",
        description: "There was an issue loading your roadmap data. Please try refreshing.",
        variant: "destructive",
      });
    }
  }, [isCardsError, cardsError, toast]);
  
  // Update issues when loaded
  useEffect(() => {
    if (initialIssues && initialIssues.length > 0) {
      setIssues(initialIssues);
    }
  }, [initialIssues]);
  
  // Mutation for creating a card
  const createCardMutation = useMutation({
    mutationFn: async (card: Omit<RoadmapCard, 'id'>) => {
      return await apiRequest('/api/roadmap/cards', {
        method: 'POST',
        data: card
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roadmap/cards'] });
    },
    onError: (error) => {
      console.error('Error creating card:', error);
      toast({
        title: "Failed to save card",
        description: "Your changes could not be saved. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating a card
  const updateCardMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<RoadmapCard> }) => {
      return await apiRequest(`/api/roadmap/cards/${id}`, {
        method: 'PATCH',
        data: updates
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roadmap/cards'] });
    },
    onError: (error) => {
      console.error('Error updating card:', error);
      toast({
        title: "Failed to update card",
        description: "Your changes could not be saved. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for deleting a card
  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/roadmap/cards/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roadmap/cards'] });
    },
    onError: (error) => {
      console.error('Error deleting card:', error);
      toast({
        title: "Failed to delete card",
        description: "The card could not be deleted. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for batch creating cards (for initial seeding)
  const batchCreateCardsMutation = useMutation({
    mutationFn: async (cards: Omit<RoadmapCard, 'id'>[]) => {
      return await apiRequest('/api/roadmap/cards/batch', {
        method: 'POST',
        data: cards
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roadmap/cards'] });
    },
    onError: (error) => {
      console.error('Error creating initial cards:', error);
      toast({
        title: "Failed to initialize roadmap",
        description: "There was an issue setting up the initial roadmap. Please refresh.",
        variant: "destructive",
      });
    }
  });
  
  // Create initial cards in the database
  const createInitialCards = () => {
    const cardsToCreate = initialCards.map(({ id, ...rest }) => ({
      ...rest,
      // Keep the same ID format but ensure it's unique
      id: id
    }));
    
    batchCreateCardsMutation.mutate(cardsToCreate);
  };
  
  // Handler for adding a new card
  const handleAddCard = (objectiveId: string, column: string, text: string = "") => {
    const tempId = `temp-${Date.now()}`;
    const newCard: RoadmapCard = {
      id: tempId,
      text,
      location: { objective: objectiveId, column }
    };
    
    // Optimistically update UI
    setCards(prevCards => [...prevCards, newCard]);
    
    // Persist to database
    createCardMutation.mutate({
      text,
      location: { objective: objectiveId, column }
    });
    
    return tempId;
  };
  
  // Handler for deleting a card
  const handleDeleteCard = (cardId: string) => {
    // Optimistically update UI
    setCards(prevCards => prevCards.filter(card => card.id !== cardId));
    
    // Persist to database
    deleteCardMutation.mutate(cardId);
  };
  
  // Handler for updating card text
  const handleUpdateCardText = (cardId: string, newText: string) => {
    // Optimistically update UI
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, text: newText } : card
      )
    );
    
    // Persist to database
    updateCardMutation.mutate({ 
      id: cardId, 
      updates: { text: newText } 
    });
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
    // Optimistically update UI
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, location: newLocation } : card
      )
    );
    
    // Persist to database
    updateCardMutation.mutate({ 
      id: cardId, 
      updates: { location: newLocation } 
    });
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
    const newCard: Omit<RoadmapCard, 'id'> = {
      text: issue.title,
      location,
      githubNumber: issue.number,
      githubUrl: issue.url
    };
    
    // Persist to database first
    createCardMutation.mutate(newCard);
    
    // Optimistically update UI (add to cards)
    setCards(prevCards => [...prevCards, { ...newCard, id: issueId }]);
    
    // Remove from uncategorized
    setIssues(prevIssues => prevIssues.filter(i => i.id !== issueId));
  };
  
  return (
    <main className="max-w-7xl mx-auto">
      {isLoadingCards && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-pulse text-center">
            <div className="h-4 w-32 bg-gray-200 rounded mb-4 mx-auto"></div>
            <p className="text-gray-500">Loading roadmap data...</p>
          </div>
        </div>
      )}

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

      {/* Status indicator for mutations */}
      {(createCardMutation.isPending || updateCardMutation.isPending || deleteCardMutation.isPending || batchCreateCardsMutation.isPending) && (
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
