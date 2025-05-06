import { useState, useEffect } from "react";
import { GitHubIssue, RoadmapCard, CardLocation } from "@/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { mapApiCardToClient, mapClientCardToApi } from "@/lib/cardTransformers";
import { objectives, initialCards } from "@/config/roadmap";

interface UseRoadmapBoardProps {
  initialIssues: GitHubIssue[];
  isLoadingIssues: boolean;
}

export function useRoadmapBoard({ initialIssues, isLoadingIssues }: UseRoadmapBoardProps) {
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
      
      // Convert snake_case to camelCase for client-side using utility function
      const convertedCards = cardsData.cards.map(mapApiCardToClient);
      
      setCards(convertedCards);
      
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
      // Convert camelCase to snake_case for API using utility function
      const apiData = mapClientCardToApi(card);
      
      return await apiRequest('/api/roadmap/cards', {
        method: 'POST',
        data: apiData
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
      // Convert camelCase to snake_case for API using utility function
      const apiUpdates = mapClientCardToApi(updates);
      
      return await apiRequest(`/api/roadmap/cards/${id}`, {
        method: 'PATCH',
        data: apiUpdates
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
    mutationFn: async (cards: (Omit<RoadmapCard, 'id'> & { id?: string })[]) => {
      // Convert camelCase to snake_case for API using utility function
      const apiCards = cards.map(mapClientCardToApi);
      
      return await apiRequest('/api/roadmap/cards/batch', {
        method: 'POST',
        data: apiCards
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
    // Keep the original cards format for the API
    const cardsToCreate = initialCards.map(({ id, ...rest }) => ({
      ...rest,
      id // Keep the same ID format but ensure it's unique
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
    // Find the card to check if it's a GitHub issue
    const cardToDelete = cards.find(card => card.id === cardId);
    
    if (cardToDelete && cardToDelete.githubNumber) {
      // This is a GitHub issue card - move it back to uncategorized instead of deleting
      console.log(`Moving GitHub issue #${cardToDelete.githubNumber} back to uncategorized section`);
      
      // Optimistically update UI: remove from cards
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      
      // Add the issue back to the uncategorized section
      const issueToRestore: GitHubIssue = {
        id: cardToDelete.id, // Keep the original ID format for consistency
        number: cardToDelete.githubNumber,
        title: cardToDelete.text,
        url: cardToDelete.githubUrl || '',
        labels: []
      };
      
      // Add back to uncategorized issues
      setIssues(prevIssues => {
        // Check if this issue already exists in the list to avoid duplicates
        const exists = prevIssues.some(i => i.number === issueToRestore.number);
        if (exists) {
          return prevIssues;
        }
        return [...prevIssues, issueToRestore];
      });
      
      // Delete the card from the database
      deleteCardMutation.mutate(cardId);
    } else {
      // Regular card - just delete it
      // Optimistically update UI
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      
      // Persist to database
      deleteCardMutation.mutate(cardId);
    }
  };
  
  // Handler for toggling high priority status
  const handleTogglePriority = (cardId: string, isHighPriority: boolean) => {
    console.log(`Toggling priority for card ${cardId} to ${isHighPriority}`);
    
    // Optimistically update UI
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, isHighPriority } : card
      )
    );
    
    // Persist to database
    updateCardMutation.mutate({ 
      id: cardId, 
      updates: { isHighPriority } 
    });
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
    
    // Check if this issue is already on the roadmap
    const existingCard = cards.find(c => c.githubNumber === issue.number);
    if (existingCard) {
      console.log(`Issue #${issue.number} is already on the roadmap as card ${existingCard.id}`);
      
      // Just update the location if it's different
      if (existingCard.location.objective !== location.objective || 
          existingCard.location.column !== location.column) {
        console.log(`Updating existing card location to ${location.objective}-${location.column}`);
        
        // Update the card's location
        updateCardMutation.mutate({
          id: existingCard.id,
          updates: { location }
        });
        
        // Optimistically update UI
        setCards(prevCards => 
          prevCards.map(card => 
            card.id === existingCard.id ? { ...card, location } : card
          )
        );
      }
      
      // Remove from uncategorized regardless
      setIssues(prevIssues => prevIssues.filter(i => i.id !== issueId));
      return;
    }
    
    // Create a new card for this issue with a dedicated ID format for GitHub issues
    const newCardId = `github-${issue.number}`;
    const newCard: RoadmapCard = {
      id: newCardId,
      text: issue.title,
      location,
      githubNumber: issue.number,
      githubUrl: issue.url
    };
    
    // Optimistically update UI (add to cards)
    setCards(prevCards => [...prevCards, newCard]);
    
    // Persist to database
    createCardMutation.mutate({
      text: issue.title,
      location,
      githubNumber: issue.number,
      githubUrl: issue.url
    });
    
    // Remove from uncategorized
    setIssues(prevIssues => prevIssues.filter(i => i.id !== issueId));
  };

  const isLoading = isLoadingIssues || isLoadingCards;
  const isSaving = createCardMutation.isPending || 
                   updateCardMutation.isPending || 
                   deleteCardMutation.isPending || 
                   batchCreateCardsMutation.isPending;

  return {
    // State
    cards,
    issues,
    objectives,
    
    // Loading states
    isLoading,
    isSaving,
    
    // Handlers
    handleAddCard,
    handleDeleteCard,
    handleTogglePriority,
    handleUpdateCardText,
    handleMoveCard,
    handleMoveIssueToRoadmap
  };
} 