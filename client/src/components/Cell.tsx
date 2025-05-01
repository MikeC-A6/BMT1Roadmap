import { useState, useRef } from "react";
import { useDrop } from "react-dnd";
import Card from "@/components/Card";
import { RoadmapCard } from "@/types";

interface CellProps {
  cards: RoadmapCard[];
  onAddCard: (text: string) => string;
  onDeleteCard: (id: string) => void;
  onUpdateCardText: (id: string, text: string) => void;
  onMoveCard: (id: string) => void;
}

export default function Cell({ cards, onAddCard, onDeleteCard, onUpdateCardText, onMoveCard }: CellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const newCardRef = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "CARD",
    drop: (item: { id: string }) => {
      onMoveCard(item.id);
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  }));
  
  const handleAddCard = () => {
    const newCardId = onAddCard("");
    setIsEditing(true);
    
    // Set focus on the newly created card
    setTimeout(() => {
      if (newCardRef.current) {
        newCardRef.current.focus();
      }
    }, 10);
    
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
  
  return (
    <div 
      ref={drop} 
      className={`cell ${isOver ? 'drop-target' : ''}`}
    >
      {cards.map((card, index) => (
        <Card
          key={card.id}
          card={card}
          onDelete={onDeleteCard}
          onUpdate={onUpdateCardText}
          onAddBelow={handleAddCardBelow}
          ref={index === cards.length - 1 && isEditing ? newCardRef : null}
        />
      ))}
      
      {cards.length === 0 && (
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
