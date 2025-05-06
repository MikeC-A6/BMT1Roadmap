import { useState, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { RoadmapCard, CardLocation } from "@/types";

interface UseCardBehaviorProps {
  card: RoadmapCard;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onAddBelow: (id: string) => void;
  onMove?: (id: string, location: CardLocation) => void;
  onTogglePriority?: (id: string, isHighPriority: boolean) => void;
}

export function useCardBehavior({
  card,
  onDelete,
  onUpdate,
  onAddBelow,
  onMove,
  onTogglePriority
}: UseCardBehaviorProps) {
  // State
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
  
  // Drag and drop handling
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
  
  // Event handlers
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
  
  // Button click handlers
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(card.id);
  };
  
  const handleAddBelowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddBelow(card.id);
  };
  
  const handlePriorityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleTogglePriority();
  };

  return {
    // State
    isEditing,
    displayText,
    isHoveringTop,
    isGitHubIssue,
    isDragging,
    
    // Refs
    textareaRef,
    drag,
    
    // Handlers
    handlers: {
      handleDoubleClick,
      handleBlur,
      handleKeyDown,
      handleMouseEnterTop,
      handleMouseLeaveTop,
      handleTogglePriority,
      handleDeleteClick,
      handleAddBelowClick,
      handlePriorityClick
    }
  };
} 