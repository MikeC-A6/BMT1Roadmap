import { useDrag } from "react-dnd";
import { CardLocation } from "@/types";
import { useRef } from "react";

/**
 * A hook that manages drag functionality for GitHub issues
 */
function useIssueDrag(
  issueId: string,
  onMoveIssue: (issueId: string, location: CardLocation) => void
): [React.RefObject<HTMLDivElement>, boolean] {
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: { 
      id: issueId,
      fromUncategorized: true
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ dropped: boolean, location: CardLocation }>();
      if (dropResult && dropResult.dropped && dropResult.location) {
        console.log(`End drag for issue ${issueId} - dropped at ${dropResult.location.objective}-${dropResult.location.column}`);
        onMoveIssue(issueId, dropResult.location);
      }
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  }), [issueId, onMoveIssue]);

  // Connect the drag ref to the DOM element ref
  drag(dragRef);

  return [dragRef, isDragging];
}

export { useIssueDrag }; 