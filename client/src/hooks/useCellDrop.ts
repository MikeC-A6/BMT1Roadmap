import { useDrop } from "react-dnd";
import { CardLocation } from "@/types";

/**
 * A hook that manages the drop functionality for a cell
 */
export function useCellDrop(location: CardLocation) {
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: "CARD",
    drop: (item: { id: string, fromUncategorized?: boolean }) => {
      console.log(`Dropped item ${item.id} in ${location.objective}-${location.column}`);
      
      // Don't call onMoveCard here - just return the location
      // The drop result will be processed by the drag source's endDrag handler
      return { 
        dropped: true, 
        location,
        fromUncategorized: item.fromUncategorized
      };
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  }), [location]);

  return [dropRef, isOver] as const;
} 