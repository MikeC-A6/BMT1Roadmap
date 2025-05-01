import { useState, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { RoadmapCard, CardLocation } from "@/types";

// Simple GitHub logo SVG component
function GitHubLogo() {
  return (
    <svg 
      className="inline-block w-4 h-4 mr-1.5 text-[#333] fill-current" 
      viewBox="0 0 16 16" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
  );
}

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
  
  // Is this a GitHub issue card?
  const isGitHubIssue = !!card.githubNumber && !!card.githubUrl;
  
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
    if (isGitHubIssue) return;
    
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
    if (isGitHubIssue) {
      return (
        <a 
          href={card.githubUrl} 
          className="text-[hsl(var(--va-blue-lighter))] hover:underline flex items-start"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <GitHubLogo />
          <span>{card.text} #{card.githubNumber}</span>
        </a>
      );
    }
    return null;
  };
  
  return (
    <div
      ref={drag}
      className={`card ${isDragging ? 'opacity-40' : ''} ${card.text === '' ? 'min-h-[60px]' : ''} ${isGitHubIssue ? 'github-issue' : ''}`}
      data-accent={card.isAccent}
      data-github={isGitHubIssue}
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
          {isGitHubIssue ? renderGitHubIssue() : displayText}
          
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
            {!isGitHubIssue && (
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
