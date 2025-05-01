import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import type { Response as NodeFetchResponse } from "node-fetch";
import { insertRoadmapCardSchema } from "@shared/schema";
import { z } from "zod";

// GitHub API endpoints
const GITHUB_API_URL = "https://api.github.com/graphql";
const GITHUB_REPO = "department-of-veterans-affairs/va.gov-team";
const REQUIRED_LABELS = ["benefits-management-tools", "bmt-2025", "bmt-team-1"];

// Extra helper function to test basic GitHub API access
async function testGitHubApiAccess(token: string): Promise<void> {
  try {
    console.log("Testing basic GitHub API access...");
    
    // Try to access the repository via REST API to verify it exists
    const repoResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });
    
    const repoData = await repoResponse.json();
    
    if (repoResponse.ok) {
      console.log(`Repository verification: Found "${repoData.full_name}" (${repoData.visibility})`);
    } else {
      console.error(`Repository verification failed: ${repoData.message}`);
    }
  } catch (error) {
    console.error("Error testing GitHub API access:", error);
  }
}

interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  url: string;
  labels: string[];
}

// Add a variable to store cached issues
let cachedGitHubIssues: GitHubIssue[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint to get cached GitHub issues
  app.get("/api/github/issues", async (req, res) => {
    try {
      // Return currently cached issues
      const issues = await fetchGitHubIssuesFromCache();
      console.log(`Returning ${issues.length} cached GitHub issues (${cachedGitHubIssues.length} in memory)`);
      return res.json({ issues });
    } catch (error) {
      console.error("Error fetching cached GitHub issues:", error);
      return res.status(500).json({ 
        message: "Failed to fetch GitHub issues"
      });
    }
  });

  // Endpoint to refresh GitHub issues
  app.get("/api/github/issues/refresh", async (req, res) => {
    try {
      const issues = await fetchGitHubIssuesFromApi();
      // Update the cached issues after successful fetch
      cachedGitHubIssues = issues;
      
      // Store issues in the database
      const issuesToStore = issues.map(issue => ({
        ...issue,
        fetched_at: new Date().toISOString()
      }));
      await storage.saveGithubIssues(issuesToStore);
      
      return res.json({ message: "GitHub issues refreshed successfully", count: issues.length });
    } catch (error) {
      console.error("Error refreshing GitHub issues:", error);
      return res.status(500).json({ 
        message: "Failed to refresh GitHub issues"
      });
    }
  });
  
  // Roadmap Cards API Endpoints
  
  // GET all roadmap cards
  app.get("/api/roadmap/cards", async (req, res) => {
    try {
      const cards = await storage.getAllRoadmapCards();
      return res.json({ cards });
    } catch (error) {
      console.error("Error fetching roadmap cards:", error);
      return res.status(500).json({
        message: "Failed to fetch roadmap cards"
      });
    }
  });
  
  // GET a single roadmap card
  app.get("/api/roadmap/cards/:id", async (req, res) => {
    try {
      const card = await storage.getRoadmapCard(req.params.id);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      return res.json(card);
    } catch (error) {
      console.error("Error fetching roadmap card:", error);
      return res.status(500).json({
        message: "Failed to fetch roadmap card"
      });
    }
  });
  
  // Create a new roadmap card
  app.post("/api/roadmap/cards", async (req, res) => {
    try {
      // Validate request body
      const cardData = insertRoadmapCardSchema.parse(req.body);
      
      // Generate a unique ID for the card
      const id = `card-${Date.now()}`;
      
      // Create the card with the generated ID
      const newCard = await storage.createRoadmapCard({
        ...cardData,
        id
      });
      
      return res.status(201).json(newCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error creating roadmap card:", error.errors);
        return res.status(400).json({ 
          message: "Invalid card data", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating roadmap card:", error);
      return res.status(500).json({
        message: "Failed to create roadmap card"
      });
    }
  });
  
  // Update a roadmap card
  app.patch("/api/roadmap/cards/:id", async (req, res) => {
    try {
      const cardId = req.params.id;
      
      // Check if card exists
      const existingCard = await storage.getRoadmapCard(cardId);
      if (!existingCard) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      // Validate update data
      const updateSchema = insertRoadmapCardSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      // Update the card
      const updatedCard = await storage.updateRoadmapCard(cardId, updateData);
      
      return res.json(updatedCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: error.errors 
        });
      }
      
      console.error("Error updating roadmap card:", error);
      return res.status(500).json({
        message: "Failed to update roadmap card"
      });
    }
  });
  
  // Delete a roadmap card
  app.delete("/api/roadmap/cards/:id", async (req, res) => {
    try {
      const cardId = req.params.id;
      
      // Check if card exists
      const existingCard = await storage.getRoadmapCard(cardId);
      if (!existingCard) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      // Delete the card
      const deleted = await storage.deleteRoadmapCard(cardId);
      
      if (deleted) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ message: "Failed to delete card" });
      }
    } catch (error) {
      console.error("Error deleting roadmap card:", error);
      return res.status(500).json({
        message: "Failed to delete roadmap card"
      });
    }
  });
  
  // Save multiple roadmap cards in a single request (for bulk operations)
  app.post("/api/roadmap/cards/batch", async (req, res) => {
    try {
      // For the batch endpoint, we need to accept the ID
      const fullCardSchema = z.object({
        id: z.string(),
        text: z.string(),
        location: z.any(),
        // Support both camelCase and snake_case property names
        isAccent: z.boolean().optional(),
        is_accent: z.boolean().optional(),
        githubNumber: z.number().optional().nullable(),
        github_number: z.number().optional().nullable(),
        githubUrl: z.string().optional().nullable(),
        github_url: z.string().optional().nullable()
      });
      
      // Validate request body
      const batchSchema = z.array(fullCardSchema);
      const cardsData = batchSchema.parse(req.body);
      
      // Create cards sequentially
      const createdCards = [];
      for (const cardData of cardsData) {
        // Normalize data to use snake_case for database
        const normalizedData = {
          id: cardData.id,
          text: cardData.text,
          location: cardData.location,
          is_accent: cardData.isAccent || cardData.is_accent,
          github_number: cardData.githubNumber || cardData.github_number,
          github_url: cardData.githubUrl || cardData.github_url
        };
        
        const newCard = await storage.createRoadmapCard(normalizedData);
        createdCards.push(newCard);
      }
      
      return res.status(201).json({ cards: createdCards });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error creating batch of roadmap cards:", error.errors);
        return res.status(400).json({ 
          message: "Invalid batch data", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating batch of roadmap cards:", error);
      return res.status(500).json({
        message: "Failed to create batch of roadmap cards"
      });
    }
  });

  // Initialize by loading issues at startup
  try {
    console.log("Initializing: fetching GitHub issues at startup");
    const initialIssues = await fetchGitHubIssuesFromApi();
    cachedGitHubIssues = initialIssues;
    
    // Store issues in the database
    const issuesToStore = initialIssues.map(issue => ({
      ...issue,
      fetched_at: new Date().toISOString()
    }));
    
    await storage.saveGithubIssues(issuesToStore);
    console.log(`Initialization complete: loaded ${initialIssues.length} GitHub issues`);
  } catch (error) {
    console.error("Error pre-loading GitHub issues:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}

// Fetch GitHub issues from cache
async function fetchGitHubIssuesFromCache(): Promise<GitHubIssue[]> {
  try {
    // First, check for existing GitHub issues in roadmap cards
    const roadmapCards = await storage.getAllRoadmapCards();
    const existingGithubNumbers = new Set(
      roadmapCards
        .filter(card => card.github_number !== null)
        .map(card => card.github_number!)
    );
    
    console.log(`Found ${existingGithubNumbers.size} GitHub issues already on the roadmap`);
    
    // Get issues from database
    const dbIssues = await storage.getAllGithubIssues();
    
    // Filter out issues that are already on the roadmap
    const filteredIssues = dbIssues
      .filter(issue => !existingGithubNumbers.has(issue.number))
      .map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.url,
        labels: issue.labels || []
      }));
    
    if (filteredIssues.length > 0) {
      console.log(`Returning ${filteredIssues.length} GitHub issues from database (filtered from ${dbIssues.length} total)`);
      return filteredIssues;
    }
    
    // If no database entries, check memory cache
    if (cachedGitHubIssues.length > 0) {
      // Also filter the memory cache
      const filteredCache = cachedGitHubIssues.filter(issue => !existingGithubNumbers.has(issue.number));
      console.log(`Returning ${filteredCache.length} GitHub issues from memory cache (filtered from ${cachedGitHubIssues.length} total)`);
      return filteredCache;
    }

    // Otherwise return mock data (also filtered)
    const mockIssues = [
      { 
        id: "github-8901", 
        number: 8901, 
        title: "Improve claim status notification system", 
        url: "https://github.com/department-of-veterans-affairs/va.gov-team/issues/8901",
        labels: REQUIRED_LABELS
      },
      { 
        id: "github-8902", 
        number: 8902, 
        title: "Fix accessibility issues in claim form", 
        url: "https://github.com/department-of-veterans-affairs/va.gov-team/issues/8902",
        labels: REQUIRED_LABELS
      },
      { 
        id: "github-8903", 
        number: 8903, 
        title: "Optimize claim document storage", 
        url: "https://github.com/department-of-veterans-affairs/va.gov-team/issues/8903",
        labels: REQUIRED_LABELS
      },
      { 
        id: "github-8904", 
        number: 8904, 
        title: "Add support for dependent claims", 
        url: "https://github.com/department-of-veterans-affairs/va.gov-team/issues/8904",
        labels: REQUIRED_LABELS
      },
      { 
        id: "github-8905", 
        number: 8905, 
        title: "Implement new VA design system components", 
        url: "https://github.com/department-of-veterans-affairs/va.gov-team/issues/8905",
        labels: REQUIRED_LABELS
      }
    ];
    
    return mockIssues.filter(issue => !existingGithubNumbers.has(issue.number));
  } catch (error) {
    console.error("Error fetching GitHub issues from cache:", error);
    return [];
  }
}

// Fetch GitHub issues from API with pagination support
async function fetchGitHubIssuesFromApi(): Promise<GitHubIssue[]> {
  // Get GitHub token from environment
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.warn("GitHub token not found in environment variables");
    return fetchGitHubIssuesFromCache(); // Fallback to cache in dev mode
  }
  
  // Log partial token for debugging (masking most of it for security)
  if (token.length > 10) {
    console.log(`Using GitHub token: ${token.substring(0, 4)}...${token.substring(token.length - 4)} (length: ${token.length})`);
  } else {
    console.warn("GitHub token seems too short, might be truncated");
  }
  
  // Test basic GitHub API access first
  await testGitHubApiAccess(token);
  
  let allIssues: GitHubIssue[] = [];
  
  try {
    // Exactly as used in the GraphQL Explorer
    const searchQuery = 'repo:department-of-veterans-affairs/va.gov-team is:issue is:open label:"benefits-management-tools" label:"bmt-2025" label:"bmt-team-1"';
    
    console.log(`Using search query: ${searchQuery}`);
    
    let hasNextPage = true;
    let cursor: string | null = null;
    
    // Continue fetching with pagination until all results are retrieved
    while (hasNextPage) {
      const variables = {
        cursor: cursor,
        searchQuery: searchQuery
      };
      
      const query = `
        query BmtAllThree($cursor: String, $searchQuery: String!) {
          search(
            type: ISSUE
            first: 100
            after: $cursor
            query: $searchQuery
          ) {
            edges {
              node {
                ... on Issue {
                  number
                  title
                  url
                  labels(first: 10) {
                    nodes { name }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      
      console.log(`Fetching GitHub issues${cursor ? ' (paginated)' : ''}`);
      
      const response: NodeFetchResponse = await fetch(GITHUB_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          variables
        })
      });
      
      const data: any = await response.json();
      
      // Log response for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.log('GitHub API response status:', response.status);
        console.log('GitHub API response structure:', 
          JSON.stringify(data, null, 2).substring(0, 1000) + '...');
      }
      
      if (data.errors) {
        console.error("GitHub API returned errors:", data.errors);
        throw new Error(data.errors[0].message);
      }
      
      // Transform the response into GitHubIssue format
      const issuesFromPage: GitHubIssue[] = (data.data?.search?.edges || []).map((edge: any) => {
        const node = edge.node;
        return {
          id: `github-${node.number}`,
          number: node.number,
          title: node.title,
          url: node.url,
          labels: node.labels.nodes.map((label: any) => label.name)
        };
      });
      
      // Add issues from this page to our collection
      allIssues = [...allIssues, ...issuesFromPage];
      
      // Check if there are more pages
      hasNextPage = data.data?.search?.pageInfo?.hasNextPage || false;
      cursor = data.data?.search?.pageInfo?.endCursor || null;
      
      // If we've received issues, log the count
      if (issuesFromPage.length > 0) {
        console.log(`Received ${issuesFromPage.length} issues${hasNextPage ? ', has more pages' : ''}`);
      }
      
      // Break the loop if there's no next page
      if (!hasNextPage) break;
    }
    
    console.log(`Total GitHub issues fetched: ${allIssues.length}`);
    
    return allIssues;
  } catch (error) {
    console.error("Error fetching from GitHub API:", error);
    // Fallback to cache in case of API errors
    return fetchGitHubIssuesFromCache();
  }
}
