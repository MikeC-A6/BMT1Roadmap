import { useState, useRef } from "react";
import { RoadmapCard, CardLocation } from "@/types";

interface UseCellBehaviorProps {
  cards: RoadmapCard[];
  location: CardLocation;
  onAddCard: (text: string) => string;
  onDeleteCard: (id: string) => void;
  onUpdateCardText: (id: string, text: string) => void;
  onMoveCard: (id: string, newLocation: CardLocation) => void;
  onTogglePriority: (id: string, isHighPriority: boolean) => void;
}

export function useCellBehavior({
  cards,
  onAddCard
}: UseCellBehaviorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const newCardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseEnter = () => {
    setIsHovering(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovering(false);
  };
  
  const handleAddCard = () => {
    const newCardId = onAddCard("");
    setIsEditing(true);
    
    // Find the newly created card element and trigger double click to edit
    setTimeout(() => {
      const cardElement = document.getElementById(newCardId);
      if (cardElement) {
        // Simulate a double click to start editing
        const doubleClickEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        cardElement.dispatchEvent(doubleClickEvent);
      }
    }, 50);
    
    return newCardId;
  };
  
  const handleAddCardBelow = (cardId: string) => {
    const index = cards.findIndex(c => c.id === cardId);
    if (index === -1) return;
    
    const newCardId = handleAddCard();
    
    // Reorder the cards so the new one is below the referenced card
    if (index < cards.length - 1) {
      // TODO: Implement proper ordering logic if needed
    }
  };

  return {
    // State
    isEditing,
    isHovering,
    
    // Refs
    newCardRef,
    
    // Handlers
    handlers: {
      handleMouseEnter,
      handleMouseLeave,
      handleAddCard,
      handleAddCardBelow
    }
  };
} 