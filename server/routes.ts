import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import type { Response as NodeFetchResponse } from "node-fetch";

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
      return res.json({ message: "GitHub issues refreshed successfully", count: issues.length });
    } catch (error) {
      console.error("Error refreshing GitHub issues:", error);
      return res.status(500).json({ 
        message: "Failed to refresh GitHub issues"
      });
    }
  });

  // Initialize by loading issues at startup
  try {
    console.log("Initializing: fetching GitHub issues at startup");
    const initialIssues = await fetchGitHubIssuesFromApi();
    cachedGitHubIssues = initialIssues;
    console.log(`Initialization complete: loaded ${initialIssues.length} GitHub issues`);
  } catch (error) {
    console.error("Error pre-loading GitHub issues:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}

// Fetch GitHub issues from cache
async function fetchGitHubIssuesFromCache(): Promise<GitHubIssue[]> {
  // Return real cached issues if available
  if (cachedGitHubIssues.length > 0) {
    return cachedGitHubIssues;
  }

  // Otherwise return mock data
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
