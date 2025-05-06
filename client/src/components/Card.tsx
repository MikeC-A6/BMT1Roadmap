import { RoadmapCard, CardLocation } from "@/types";
import { useCardBehavior } from "@/hooks/useCardBehavior";
import { PriorityIndicator } from "./card/PriorityIndicator";
import { CardContent } from "./card/CardContent";
import { CardActions } from "./card/CardActions";

interface CardProps {
  card: RoadmapCard;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onAddBelow: (id: string) => void;
  onMove?: (id: string, location: CardLocation) => void;
  onTogglePriority?: (id: string, isHighPriority: boolean) => void;
}

// Pure presentational component
interface CardUIProps {
  card: RoadmapCard;
  isEditing: boolean;
  displayText: string;
  isDragging: boolean;
  isHoveringTop: boolean;
  isGitHubIssue: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  dragRef: any;
  handlers: {
    handleDoubleClick: () => void;
    handleBlur: () => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    handleMouseEnterTop: () => void;
    handleMouseLeaveTop: () => void;
    handleTogglePriority: () => void;
    handleDeleteClick: (e: React.MouseEvent) => void;
    handleAddBelowClick: (e: React.MouseEvent) => void;
    handlePriorityClick: (e: React.MouseEvent) => void;
  };
}

function CardUI({
  card,
  isEditing,
  displayText,
  isDragging,
  isHoveringTop,
  isGitHubIssue,
  textareaRef,
  dragRef,
  handlers
}: CardUIProps) {
  return (
    <div
      ref={dragRef}
      className={`card relative ${isDragging ? 'opacity-40' : ''} ${card.text === '' ? 'min-h-[60px]' : ''} ${isGitHubIssue ? 'github-issue' : ''}`}
      data-accent={card.isAccent}
      data-github={isGitHubIssue}
      data-priority={card.isHighPriority}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onDoubleClick={handlers.handleDoubleClick}
      draggable={!isEditing}
      id={card.id}
    >
      {/* Priority indicator component */}
      <PriorityIndicator 
        isHoveringTop={isHoveringTop}
        isHighPriority={!!card.isHighPriority}
        onMouseEnter={handlers.handleMouseEnterTop}
        onMouseLeave={handlers.handleMouseLeaveTop}
        onPriorityClick={handlers.handlePriorityClick}
      />
      
      {/* Card content component */}
      <CardContent 
        card={card}
        isEditing={isEditing}
        displayText={displayText}
        isGitHubIssue={isGitHubIssue}
        textareaRef={textareaRef}
        onBlur={handlers.handleBlur}
        onKeyDown={handlers.handleKeyDown}
      />
      
      {/* Card actions only shown in display mode */}
      {!isEditing && (
        <CardActions 
          isGitHubIssue={isGitHubIssue}
          onDeleteClick={handlers.handleDeleteClick}
          onAddBelowClick={handlers.handleAddBelowClick}
        />
      )}
    </div>
  );
}

// Container component
export default function Card(props: CardProps) {
  const {
    isEditing,
    displayText,
    isHoveringTop,
    isGitHubIssue,
    isDragging,
    textareaRef,
    drag,
    handlers
  } = useCardBehavior(props);
  
  return (
    <CardUI
      card={props.card}
      isEditing={isEditing}
      displayText={displayText}
      isDragging={isDragging}
      isHoveringTop={isHoveringTop}
      isGitHubIssue={isGitHubIssue}
      textareaRef={textareaRef}
      dragRef={drag}
      handlers={handlers}
    />
  );
}
