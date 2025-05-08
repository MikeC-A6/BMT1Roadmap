import Card from "@/components/Card";
import { RoadmapCard, CardLocation } from "@/types";

interface CellUIProps {
  cards: RoadmapCard[];
  location: CardLocation;
  isHovering: boolean;
  isOver: boolean;
  dropRef: any; // react-dnd ref type
  newCardRef: React.RefObject<HTMLDivElement>;
  handlers: {
    handleMouseEnter: () => void;
    handleMouseLeave: () => void;
    handleAddCard: () => string;
    handleAddCardBelow: (cardId: string) => void;
  };
  onDeleteCard: (id: string) => void;
  onUpdateCardText: (id: string, text: string) => void;
  onMoveCard: (id: string, newLocation: CardLocation) => void;
  onTogglePriority: (id: string, isHighPriority: boolean) => void;
  className?: string;
}

export function CellUI({
  cards,
  location,
  isHovering,
  isOver,
  dropRef,
  newCardRef,
  handlers,
  onDeleteCard,
  onUpdateCardText,
  onMoveCard,
  onTogglePriority,
  className = ""
}: CellUIProps) {
  // Determine if this cell is in the "Later" column which should have 2 columns
  const isLaterColumn = location.column === "later";
  
  const isEmpty = cards.length === 0;
  
  return (
    <div 
      ref={dropRef} 
      className={`cell ${isOver || (isEmpty && isHovering) ? 'drop-target' : ''} ${className}`}
      onMouseEnter={handlers.handleMouseEnter}
      onMouseLeave={handlers.handleMouseLeave}
    >
      <div className={`grid ${isLaterColumn ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-3`}>
        {cards.map((card) => (
          <div key={card.id} className="h-full">
            <Card
              card={card}
              onDelete={onDeleteCard}
              onUpdate={onUpdateCardText}
              onAddBelow={handlers.handleAddCardBelow}
              onMove={(id, newLocation) => onMoveCard(id, newLocation)}
              onTogglePriority={onTogglePriority}
            />
          </div>
        ))}
      </div>
      
      {isEmpty && isHovering && (
        <button 
          className="cell-add" 
          title="Add sticky"
          onClick={handlers.handleAddCard}
        >
          +
        </button>
      )}
    </div>
  );
} 