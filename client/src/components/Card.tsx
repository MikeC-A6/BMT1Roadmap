import { useState, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { RoadmapCard, CardLocation } from "@/types";

interface CardProps {
  card: RoadmapCard;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onAddBelow: (id: string) => void;
  onMove?: (id: string, location: CardLocation) => void;
}

export default function Card({ card, onDelete, onUpdate, onAddBelow, onMove }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayText, setDisplayText] = useState(card.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Update display text when card.text changes
  useEffect(() => {
    setDisplayText(card.text);
  }, [card.text]);
  
  // Focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      
      // For new cards, just focus without selecting
      if (card.text !== "") {
        textareaRef.current.select();
      }
    }
  }, [isEditing, card.text]);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: { id: card.id },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ dropped: boolean, location: CardLocation }>();
      if (onMove && dropResult && dropResult.dropped && dropResult.location) {
        // Only move if the drop location is different from the current location
        const currentLoc = card.location;
        const newLoc = dropResult.location;
        
        if (currentLoc.objective !== newLoc.objective || currentLoc.column !== newLoc.column) {
          console.log(`Card ${card.id} moved to ${newLoc.objective}-${newLoc.column}`);
          onMove(card.id, newLoc);
        }
      }
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isEditing,
  }), [card.id, card.location, onMove, isEditing]);
  
  const handleDoubleClick = () => {
    // GitHub issue cards are not directly editable
    if (card.githubNumber) return;
    
    setIsEditing(true);
  };
  
  const handleBlur = () => {
    if (!textareaRef.current) return;
    
    const newText = textareaRef.current.value.trim();
    
    if (newText === "") {
      onDelete(card.id);
    } else {
      onUpdate(card.id, newText);
      setDisplayText(newText);
    }
    
    setIsEditing(false);
  };
  
  // Handle key presses while editing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };
  
  // Get GitHub issue content
  const renderGitHubIssue = () => {
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
    return null;
  };
  
  return (
    <div
      ref={drag}
      className={`card ${isDragging ? 'opacity-40' : ''} ${card.text === '' ? 'min-h-[60px]' : ''}`}
      data-accent={card.isAccent}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onDoubleClick={handleDoubleClick}
      draggable={!isEditing}
      id={card.id}
    >
      {/* Only one of these two blocks will render, never both */}
      {isEditing ? (
        /* Edit Mode: textarea */
        <textarea
          ref={textareaRef}
          className="w-full h-full p-0 bg-transparent border-none outline-none resize-none font-inherit"
          defaultValue={displayText}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{ 
            fontFamily: 'inherit', 
            fontSize: 'inherit',
            fontWeight: 'inherit',
            minHeight: '40px'
          }}
        />
      ) : (
        /* Display Mode: static text */
        <>
          {card.githubNumber ? renderGitHubIssue() : displayText}
          
          <div className="card-actions flex flex-col gap-2 absolute top-1 right-1">
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
          </div>
        </>
      )}
    </div>
  );
}
