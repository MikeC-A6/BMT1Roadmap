import React from 'react';

interface CardActionsProps {
  isGitHubIssue: boolean;
  onDeleteClick: (e: React.MouseEvent) => void;
  onAddBelowClick: (e: React.MouseEvent) => void;
}

export function CardActions({
  isGitHubIssue,
  onDeleteClick,
  onAddBelowClick
}: CardActionsProps) {
  return (
    <div className="card-actions flex flex-col gap-2 absolute top-1 right-1">
      <button 
        className="card-action action-delete" 
        title="Delete"
        onClick={onDeleteClick}
      >
        −
      </button>
      
      {/* Only regular cards have the add-below button */}
      {!isGitHubIssue && (
        <button 
          className="card-action action-add" 
          title="Add sticky below"
          onClick={onAddBelowClick}
        >
          +
        </button>
      )}
    </div>
  );
} 