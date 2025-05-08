import { RoadmapCard, CardLocation } from "@/types";
import { useCellBehavior } from "@/hooks/useCellBehavior";
import { useCellDrop } from "@/hooks/useCellDrop";
import { CellUI } from "./CellUI";

interface CellProps {
  cards: RoadmapCard[];
  location: CardLocation;
  onAddCard: (text: string) => string;
  onDeleteCard: (id: string) => void;
  onUpdateCardText: (id: string, text: string) => void;
  onMoveCard: (id: string, newLocation: CardLocation) => void;
  onTogglePriority: (id: string, isHighPriority: boolean) => void;
  className?: string;
}

export default function Cell(props: CellProps) {
  const {
    cards,
    location,
    onDeleteCard,
    onUpdateCardText,
    onMoveCard,
    onTogglePriority,
    className = ""
  } = props;
  
  // Use the extracted behavior hook
  const {
    isEditing,
    isHovering,
    newCardRef,
    handlers
  } = useCellBehavior(props);
  
  // Use the extracted drop hook
  const [dropRef, isOver] = useCellDrop(location);
  
  return (
    <CellUI
      cards={cards}
      location={location}
      isHovering={isHovering}
      isOver={isOver}
      dropRef={dropRef}
      newCardRef={newCardRef}
      handlers={handlers}
      onDeleteCard={onDeleteCard}
      onUpdateCardText={onUpdateCardText}
      onMoveCard={onMoveCard}
      onTogglePriority={onTogglePriority}
      className={className}
    />
  );
} 