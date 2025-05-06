import { RoadmapCard } from "@/types";

/**
 * Converts a card from API format (snake_case) to client format (camelCase)
 */
export function mapApiCardToClient(card: any): RoadmapCard {
  return {
    id: card.id,
    text: card.text,
    location: card.location,
    isAccent: card.is_accent,
    isHighPriority: card.is_high_priority,
    githubNumber: card.github_number,
    githubUrl: card.github_url
  };
}

/**
 * Converts a card from client format (camelCase) to API format (snake_case)
 */
export function mapClientCardToApi(card: Partial<RoadmapCard>): Record<string, any> {
  const apiCard: Record<string, any> = { ...card };
  
  // Handle camelCase to snake_case conversions
  if ('isAccent' in card) {
    apiCard.is_accent = card.isAccent;
    delete apiCard.isAccent;
  }
  
  if ('isHighPriority' in card) {
    apiCard.is_high_priority = card.isHighPriority;
    delete apiCard.isHighPriority;
  }
  
  if ('githubNumber' in card) {
    apiCard.github_number = card.githubNumber;
    delete apiCard.githubNumber;
  }
  
  if ('githubUrl' in card) {
    apiCard.github_url = card.githubUrl;
    delete apiCard.githubUrl;
  }
  
  return apiCard;
} 