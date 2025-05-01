import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";

// GitHub API endpoints
const GITHUB_API_URL = "https://api.github.com/graphql";
const GITHUB_REPO = "department-of-veterans-affairs/va.gov-team";
const REQUIRED_LABELS = ["benefits-management-tools", "bmt-2025", "bmt-team-1"];

interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  url: string;
  labels: string[];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint to get cached GitHub issues
  app.get("/api/github/issues", async (req, res) => {
    try {
      // Return currently cached issues
      const issues = await fetchGitHubIssuesFromCache();
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
      return res.json({ message: "GitHub issues refreshed successfully", count: issues.length });
    } catch (error) {
      console.error("Error refreshing GitHub issues:", error);
      return res.status(500).json({ 
        message: "Failed to refresh GitHub issues"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Fetch GitHub issues from cache
async function fetchGitHubIssuesFromCache(): Promise<GitHubIssue[]> {
  // In a full implementation, we would fetch from database
  // For now, using a simulated cache
  return [
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
}

// Fetch GitHub issues from API with pagination support
async function fetchGitHubIssuesFromApi(): Promise<GitHubIssue[]> {
  // Get GitHub token from environment
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.warn("GitHub token not found in environment variables");
    return fetchGitHubIssuesFromCache(); // Fallback to cache in dev mode
  }
  
  let allIssues: GitHubIssue[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;
  
  try {
    // Construct query with all required labels
    const labelsQuery = REQUIRED_LABELS.map(label => `label:${label}`).join(" ");
    
    // Continue fetching with pagination until all results are retrieved
    while (hasNextPage) {
      // Add the "after" parameter if we have an endCursor
      const afterParam = endCursor ? `, after: "${endCursor}"` : '';
      
      const query = `
        query {
          search(query: "repo:${GITHUB_REPO} is:open ${labelsQuery}", type: ISSUE, first: 100${afterParam}) {
            edges {
              node {
                ... on Issue {
                  id
                  number
                  title
                  url
                  labels(first: 10) {
                    nodes {
                      name
                    }
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
      
      console.log(`Fetching GitHub issues${endCursor ? ' (paginated)' : ''}`);
      
      const response = await fetch(GITHUB_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      if (data.errors) {
        console.error("GitHub API returned errors:", data.errors);
        throw new Error(data.errors[0].message);
      }
      
      // Transform the response into our GitHubIssue format
      const issuesFromPage: GitHubIssue[] = data.data.search.edges.map((edge: any) => {
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
      hasNextPage = data.data.search.pageInfo.hasNextPage;
      endCursor = data.data.search.pageInfo.endCursor;
      
      // If we've received issues, log the count
      if (issuesFromPage.length > 0) {
        console.log(`Received ${issuesFromPage.length} issues${hasNextPage ? ', has more pages' : ''}`);
      }
      
      // Break the loop if there's no next page
      if (!hasNextPage) break;
    }
    
    console.log(`Total GitHub issues fetched: ${allIssues.length}`);
    
    // In a full implementation, save to cache/database
    // ...
    
    return allIssues;
  } catch (error) {
    console.error("Error fetching from GitHub API:", error);
    // Fallback to cache in case of API errors
    return fetchGitHubIssuesFromCache();
  }
}
