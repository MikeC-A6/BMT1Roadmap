import { useState, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { RoadmapCard, CardLocation } from "@/types";
import GitHubLogo from "./GitHubLogo";

interface CardProps {
  card: RoadmapCard;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onAddBelow: (id: string) => void;
  onMove?: (id: string, location: CardLocation) => void;
  onTogglePriority?: (id: string, isHighPriority: boolean) => void;
}

export default function Card({ card, onDelete, onUpdate, onAddBelow, onMove, onTogglePriority }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayText, setDisplayText] = useState(card.text);
  const [isHoveringTop, setIsHoveringTop] = useState(false);
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
  
  // Toggle priority status
  const handleTogglePriority = () => {
    if (onTogglePriority) {
      onTogglePriority(card.id, !card.isHighPriority);
    }
  };
  
  // Handle mouse over for priority indicator
  const handleMouseEnterTop = () => {
    if (!isEditing) {
      setIsHoveringTop(true);
    }
  };
  
  const handleMouseLeaveTop = () => {
    setIsHoveringTop(false);
  };
  
  return (
    <div
      ref={drag}
      className={`card relative ${isDragging ? 'opacity-40' : ''} ${card.text === '' ? 'min-h-[60px]' : ''} ${isGitHubIssue ? 'github-issue' : ''}`}
      data-accent={card.isAccent}
      data-github={isGitHubIssue}
      data-priority={card.isHighPriority}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onDoubleClick={handleDoubleClick}
      draggable={!isEditing}
      id={card.id}
    >
      {/* Priority indicator/trigger region */}
      <div 
        className={`priority-indicator absolute top-0 left-0 right-0 h-6 cursor-pointer flex items-center justify-center -mt-4 transition-opacity ${isHoveringTop || card.isHighPriority ? 'opacity-100' : 'opacity-0'}`}
        onMouseEnter={handleMouseEnterTop}
        onMouseLeave={handleMouseLeaveTop}
        onClick={(e) => {
          e.stopPropagation();
          handleTogglePriority();
        }}
      >
        <div 
          className={`priority-bar h-2 w-24 rounded-t-md transition-all ${card.isHighPriority ? 'bg-red-500' : 'bg-gray-300'}`}
          title={card.isHighPriority ? "Remove high priority" : "Mark as high priority"}
        >
          {isHoveringTop && (
            <div className="absolute top-0 left-0 right-0 w-full flex justify-center pt-2 whitespace-nowrap">
              <span className="text-xs bg-black text-white px-2 py-1 rounded shadow-sm">
                {card.isHighPriority ? "Remove priority" : "Mark as high priority"}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Priority border if card is high priority */}
      {card.isHighPriority && (
        <div className="priority-border absolute -top-1 -left-1 -right-1 h-1 bg-red-500 rounded-t-md"></div>
      )}
      
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
