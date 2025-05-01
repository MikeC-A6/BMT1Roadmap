import { useState, useRef } from "react";
import { useDrop } from "react-dnd";
import Card from "@/components/Card";
import { RoadmapCard, CardLocation } from "@/types";

interface CellProps {
  cards: RoadmapCard[];
  location: CardLocation;
  onAddCard: (text: string) => string;
  onDeleteCard: (id: string) => void;
  onUpdateCardText: (id: string, text: string) => void;
  onMoveCard: (id: string, newLocation: CardLocation) => void;
}

export default function Cell({ cards, location, onAddCard, onDeleteCard, onUpdateCardText, onMoveCard }: CellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const newCardRef = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "CARD",
    drop: (item: { id: string, fromUncategorized?: boolean }) => {
      console.log(`Dropped item ${item.id} in ${location.objective}-${location.column}`);
      
      // Don't call onMoveCard here - just return the location
      // The drop result will be processed by the drag source's endDrag handler
      return { 
        dropped: true, 
        location,
        fromUncategorized: item.fromUncategorized
      };
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  }), [location]);
  
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
  
  const isEmpty = cards.length === 0;
  
  return (
    <div 
      ref={drop} 
      className={`cell ${isOver || (isEmpty && isHovering) ? 'drop-target' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {cards.map((card, index) => (
        <Card
          key={card.id}
          card={card}
          onDelete={onDeleteCard}
          onUpdate={onUpdateCardText}
          onAddBelow={handleAddCardBelow}
          onMove={(id, newLocation) => onMoveCard(id, newLocation)}
        />
      ))}
      
      {isEmpty && isHovering && (
        <button 
          className="cell-add" 
          title="Add sticky"
          onClick={handleAddCard}
        >
          +
        </button>
      )}
    </div>
  );
}
