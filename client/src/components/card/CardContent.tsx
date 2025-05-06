import React from 'react';
import GitHubLogo from '../GitHubLogo';
import { RoadmapCard } from '@/types';

interface CardContentProps {
  card: RoadmapCard;
  isEditing: boolean;
  displayText: string;
  isGitHubIssue: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function CardContent({
  card,
  isEditing,
  displayText,
  isGitHubIssue,
  textareaRef,
  onBlur,
  onKeyDown
}: CardContentProps) {
  // Render GitHub issue link
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

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        className="w-full h-full p-0 bg-transparent border-none outline-none resize-none font-inherit"
        defaultValue={displayText}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        style={{ 
          fontFamily: 'inherit', 
          fontSize: 'inherit',
          fontWeight: 'inherit',
          minHeight: '40px'
        }}
      />
    );
  }
  
  return (
    <>
      {isGitHubIssue ? renderGitHubIssue() : displayText}
    </>
  );
} 