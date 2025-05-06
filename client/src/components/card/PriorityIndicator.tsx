import React from 'react';

interface PriorityIndicatorProps {
  isHoveringTop: boolean;
  isHighPriority: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onPriorityClick: (e: React.MouseEvent) => void;
}

export function PriorityIndicator({
  isHoveringTop,
  isHighPriority,
  onMouseEnter,
  onMouseLeave,
  onPriorityClick
}: PriorityIndicatorProps) {
  return (
    <div 
      className={`priority-indicator absolute top-0 left-0 right-0 h-6 cursor-pointer flex items-center justify-center -mt-4 transition-opacity ${isHoveringTop || isHighPriority ? 'opacity-100' : 'opacity-0'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onPriorityClick}
    >
      <div 
        className={`priority-bar h-2 w-24 rounded-t-md transition-all ${isHighPriority ? 'bg-red-500' : 'bg-gray-300'}`}
        title={isHighPriority ? "Remove high priority" : "Mark as high priority"}
      >
        {isHoveringTop && (
          <div className="absolute top-0 left-0 right-0 w-full flex justify-center pt-2 whitespace-nowrap">
            <span className="text-xs bg-black text-white px-2 py-1 rounded shadow-sm">
              {isHighPriority ? "Remove priority" : "Mark as high priority"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 