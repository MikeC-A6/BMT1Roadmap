// GitHub issue from API
export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  url: string;
  labels: string[];
}

// Roadmap objective (row)
export interface RoadmapObjective {
  id: string;
  text: string;
}

// Location of a card in the roadmap grid
export interface CardLocation {
  objective: string; // ID of the objective row
  column: string;    // "now", "next", or "later"
}

// Card data structure
export interface RoadmapCard {
  id: string;
  text: string;
  location: CardLocation;
  isAccent?: boolean;
  githubNumber?: number;
  githubUrl?: string;
}

// API responses
export interface GitHubIssuesResponse {
  issues: GitHubIssue[];
}
