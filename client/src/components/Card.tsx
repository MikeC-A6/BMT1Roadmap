import { useState, useRef } from "react";
import { useDrag } from "react-dnd";
import { RoadmapCard } from "@/types";

interface CardProps {
  card: RoadmapCard;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onAddBelow: (id: string) => void;
}

export default function Card({ card, onDelete, onUpdate, onAddBelow }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: { id: card.id },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isEditing,
  }));
  
  const handleDoubleClick = () => {
    // GitHub issue cards are not directly editable
    if (card.githubNumber) return;
    
    setIsEditing(true);
  };
  
  const handleBlur = () => {
    if (cardRef.current) {
      const text = cardRef.current.textContent || "";
      if (text.trim() === "") {
        onDelete(card.id);
      } else {
        onUpdate(card.id, text);
      }
    }
    setIsEditing(false);
  };
  
  // Handle key presses while editing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (cardRef.current) {
        cardRef.current.blur();
      }
    }
  };
  
  // Set the card content based on whether it's a GitHub issue or regular card
  const renderCardContent = () => {
    if (card.githubNumber && card.githubUrl) {
      return (
        <a 
          href={card.githubUrl} 
          className="text-[hsl(var(--va-blue-lighter))] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {card.text} #{card.githubNumber}
        </a>
      );
    }
    
    return card.text;
  };
  
  return (
    <div
      ref={(node) => {
        drag(node);
        if (node) cardRef.current = node;
      }}
      className={`card ${isDragging ? 'opacity-40' : ''}`}
      data-accent={card.isAccent}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onDoubleClick={handleDoubleClick}
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      draggable={!isEditing}
    >
      {renderCardContent()}
      
      {!isEditing && (
        <>
          <button 
            className="card-action action-delete" 
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
          >
            −
          </button>
          
          {/* Only regular cards have the add-below button */}
          {!card.githubNumber && (
            <button 
              className="card-action action-add" 
              title="Add sticky below"
              onClick={(e) => {
                e.stopPropagation();
                onAddBelow(card.id);
              }}
            >
              +
            </button>
          )}
        </>
      )}
    </div>
  );
}
