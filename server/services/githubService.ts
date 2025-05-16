import fetch from 'node-fetch';
import type { Response as NodeFetchResponse } from 'node-fetch';
import { IStorage } from '../storage';

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  url: string;
  labels: string[];
}

export class GitHubService {
  private readonly GITHUB_API_URL = 'https://api.github.com/graphql';
  private token: string;
  private repoOwner: string;
  private repoName: string;
  private requiredLabels: string[];
  private inMemoryCache: GitHubIssue[] = [];
  private storage: IStorage;

  constructor(
    token: string,
    repoOwner: string,
    repoName: string,
    requiredLabels: string[],
    dbStorage: IStorage
  ) {
    this.token = token;
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.requiredLabels = requiredLabels;
    this.storage = dbStorage;
    this.loadIssuesFromDbCache().catch(console.error);
  }

  private async loadIssuesFromDbCache() {
    const dbIssues = await this.storage.getAllGithubIssues();
    if (dbIssues && dbIssues.length > 0) {
      this.inMemoryCache = dbIssues.map(issue => ({ ...issue, labels: issue.labels || [] }));
      console.log(`GitHubService: Loaded ${this.inMemoryCache.length} issues from DB cache.`);
    }
  }

  public async getCachedIssues(): Promise<{ issues: GitHubIssue[]; lastRefreshed: string | null }> {
    const issues = await this.fetchIssuesFromCache();
    const latestDbIssue = await this.storage.getLatestGithubIssue();
    const lastRefreshed = latestDbIssue ? latestDbIssue.fetched_at : null;
    return { issues, lastRefreshed };
  }

  public async refreshIssuesFromApi(): Promise<GitHubIssue[]> {
    const token = this.token;
    if (!token) {
      console.warn('GitHub token not found in environment variables');
      return this.fetchIssuesFromCache();
    }

    if (token.length > 10) {
      console.log(`Using GitHub token: ${token.substring(0, 4)}...${token.substring(token.length - 4)} (length: ${token.length})`);
    } else {
      console.warn('GitHub token seems too short, might be truncated');
    }

    await this.testGitHubApiAccess(token);

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

        const response: NodeFetchResponse = await fetch(this.GITHUB_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
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
          console.error('GitHub API returned errors:', data.errors);
          throw new Error(data.errors[0].message);
        }

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

        allIssues = [...allIssues, ...issuesFromPage];

        hasNextPage = data.data?.search?.pageInfo?.hasNextPage || false;
        cursor = data.data?.search?.pageInfo?.endCursor || null;

        if (issuesFromPage.length > 0) {
          console.log(`Received ${issuesFromPage.length} issues${hasNextPage ? ', has more pages' : ''}`);
        }

        if (!hasNextPage) break;
      }

      console.log(`Total GitHub issues fetched: ${allIssues.length}`);

      this.inMemoryCache = allIssues;
      const currentTime = new Date().toISOString();
      const issuesToStore = allIssues.map(issue => ({
        ...issue,
        fetched_at: currentTime
      }));
      await this.storage.saveGithubIssues(issuesToStore);

      return allIssues;
    } catch (error) {
      console.error('Error fetching from GitHub API:', error);
      return this.fetchIssuesFromCache();
    }
  }

  private async fetchIssuesFromCache(): Promise<GitHubIssue[]> {
    try {
      const roadmapCards = await this.storage.getAllRoadmapCards();
      const existingGithubNumbers = new Set(
        roadmapCards
          .filter(card => card.github_number !== null)
          .map(card => card.github_number!)
      );

      console.log(`Found ${existingGithubNumbers.size} GitHub issues already on the roadmap`);

      const dbIssues = await this.storage.getAllGithubIssues();

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

      if (this.inMemoryCache.length > 0) {
        const filteredCache = this.inMemoryCache.filter(issue => !existingGithubNumbers.has(issue.number));
        console.log(`Returning ${filteredCache.length} GitHub issues from memory cache (filtered from ${this.inMemoryCache.length} total)`);
        return filteredCache;
      }

      const mockIssues = [
        {
          id: 'github-8901',
          number: 8901,
          title: 'Improve claim status notification system',
          url: 'https://github.com/department-of-veterans-affairs/va.gov-team/issues/8901',
          labels: this.requiredLabels
        },
        {
          id: 'github-8902',
          number: 8902,
          title: 'Fix accessibility issues in claim form',
          url: 'https://github.com/department-of-veterans-affairs/va.gov-team/issues/8902',
          labels: this.requiredLabels
        },
        {
          id: 'github-8903',
          number: 8903,
          title: 'Optimize claim document storage',
          url: 'https://github.com/department-of-veterans-affairs/va.gov-team/issues/8903',
          labels: this.requiredLabels
        },
        {
          id: 'github-8904',
          number: 8904,
          title: 'Add support for dependent claims',
          url: 'https://github.com/department-of-veterans-affairs/va.gov-team/issues/8904',
          labels: this.requiredLabels
        },
        {
          id: 'github-8905',
          number: 8905,
          title: 'Implement new VA design system components',
          url: 'https://github.com/department-of-veterans-affairs/va.gov-team/issues/8905',
          labels: this.requiredLabels
        }
      ];

      return mockIssues.filter(issue => !existingGithubNumbers.has(issue.number));
    } catch (error) {
      console.error('Error fetching GitHub issues from cache:', error);
      return [];
    }
  }

  private async testGitHubApiAccess(token: string): Promise<void> {
    try {
      console.log('Testing basic GitHub API access...');

      const repoResponse = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const repoData = await repoResponse.json();

      if (repoResponse.ok) {
        console.log(`Repository verification: Found "${repoData.full_name}" (${repoData.visibility})`);
      } else {
        console.error(`Repository verification failed: ${repoData.message}`);
      }
    } catch (error) {
      console.error('Error testing GitHub API access:', error);
    }
  }
}

export let gitHubService: GitHubService;

export function initGitHubService(
  token: string,
  repoOwner: string,
  repoName: string,
  requiredLabels: string[],
  dbStorage: IStorage
): GitHubService {
  gitHubService = new GitHubService(token, repoOwner, repoName, requiredLabels, dbStorage);
  return gitHubService;
}
