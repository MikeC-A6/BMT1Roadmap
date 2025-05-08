# Server Application

This directory contains the Node.js backend server for the Project Roadmap application. It is built using Express.js, uses Drizzle ORM for interacting with a PostgreSQL database (NeonDB), and integrates with the GitHub API to fetch issue data.

## Overview

The server provides a RESTful API for the client application to:
*   Manage (CRUD) roadmap cards.
*   Fetch and cache GitHub issues relevant to the roadmap.
*   Handle user authentication (foundations exist with Passport.js, but full implementation details are not covered here).
*   Serve the client application in development (via Vite middleware) and production (statically).

## Technologies Used

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database ORM**: Drizzle ORM
*   **Database**: PostgreSQL (configured for NeonDB serverless driver)
*   **Schema Validation**: Zod (used with Drizzle and for API request validation)
*   **API Communication**: `node-fetch` (for GitHub API)
*   **Development**: `tsx` for running TypeScript directly, Vite for HMR via `server/vite.ts`.
*   **Production Build**: `esbuild`
*   **Session Management**: `express-session` (with `connect-pg-simple` or `memorystore` potentially)
*   **Authentication**: `passport`, `passport-local` (basic setup present)
*   **Language**: TypeScript

## Project Structure (`server/`)

```
server/
├── index.ts            # Main server entry point, Express app setup, middleware, Vite integration.
├── routes.ts           # API route definitions, including GitHub API interaction logic.
├── db.ts               # Drizzle ORM and database connection setup (NeonDB).
├── storage.ts          # Data access layer (class `DatabaseStorage`) abstracting database operations.
├── vite.ts             # Vite middleware setup for development.
└── ... (potentially other modules or utility files)
```

*   **`index.ts`**: Initializes the Express application, sets up middleware (JSON parsing, logging, error handling), integrates Vite for development, and starts the HTTP server.
*   **`routes.ts`**: Defines all API endpoints (e.g., `/api/roadmap/cards`, `/api/github/issues`). Currently, this file also contains the logic for fetching and caching GitHub issues.
*   **`db.ts`**: Configures the Drizzle ORM client using the Neon serverless driver and exports the database instance (`db`) and connection pool (`pool`). It expects a `DATABASE_URL` environment variable.
*   **`storage.ts`**: Implements a `DatabaseStorage` class that provides methods for interacting with the database (users, roadmap cards, GitHub issues). This class uses the `db` instance from `db.ts`.
*   **`vite.ts`**: Contains functions to integrate Vite as middleware for serving the client during development.

## API Endpoints

The primary API endpoints are prefixed with `/api`.

*   **Roadmap Cards**: `POST, GET, PATCH, DELETE /api/roadmap/cards` and `GET /api/roadmap/cards/:id`, `POST /api/roadmap/cards/batch`
    *   Manages roadmap card entities.
    *   Uses Zod schemas from `@shared/schema` for validation.
*   **GitHub Issues**: `GET /api/github/issues`, `GET /api/github/issues/refresh`
    *   `GET /api/github/issues`: Returns cached GitHub issues.
    *   `GET /api/github/issues/refresh`: Forces a refresh of GitHub issues from the GitHub API and updates the cache (both in-memory and database).

(Refer to `server/routes.ts` for detailed request/response structures and logic.)

## Database

*   The application uses Drizzle ORM with a PostgreSQL database (specifically configured for NeonDB).
*   Database schemas are defined in `shared/schema.ts`.
*   Migrations or schema pushing is handled by Drizzle Kit. Use `npm run db:push` (from the root directory) to apply schema changes to your database.

## Environment Variables

Key environment variables required by the server (typically set in a `.env` file at the project root):

*   `DATABASE_URL`: **Required**. The connection string for your PostgreSQL database (e.g., `postgresql://user:password@host:port/dbname?sslmode=require`).
*   `GITHUB_TOKEN`: **Optional but Recommended**. A GitHub Personal Access Token. Required to fetch data from the GitHub API, especially for private repositories or to avoid rate limiting. The token should have `repo` scope for accessing repository data and issues.
*   `PORT`: **Optional**. The port on which the server will listen. Defaults to `5000` as per `server/index.ts`.
*   `NODE_ENV`: `development` or `production`. Controls aspects like Vite integration and logging.

## Running the Server

*   **Development**: `npm run dev` (from the root directory). This starts the server using `tsx` and enables Vite for client HMR.
*   **Production**: `npm run start` (from the root directory). This runs the `esbuild`-compiled server from the `dist/` directory.

## Refactoring Opportunities

The current server structure is functional, but certain areas could be refactored for better maintainability, testability, and separation of concerns.

### 1. GitHub Service Abstraction

**Current Situation**:
GitHub API interaction logic (fetching, caching, constants like `GITHUB_REPO`) is currently embedded within `server/routes.ts`.

**Proposed Refactoring**:
Extract all GitHub-related functionality into a dedicated service module.

1.  **Create a new directory**: `server/services/`
2.  **Create a new file**: `server/services/githubService.ts`
3.  **Move GitHub Logic**: Migrate functions like `fetchGitHubIssuesFromApi`, `fetchGitHubIssuesFromCache`, related constants (`GITHUB_API_URL`, `GITHUB_REPO`, `REQUIRED_LABELS`), and types (`GitHubIssue`) into `githubService.ts`.
4.  **Define a Service Interface/Class**:
    ```typescript
    // server/services/githubService.ts
    import fetch from 'node-fetch';
    import { storage, IStorage } from '../storage'; // Assuming storage is accessible
    import { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_PROJECT_LABELS } from '../config'; // Or manage env vars directly

    // Define an interface for the structure of a GitHub issue
    export interface GitHubIssue {
      id: string;
      number: number;
      title: string;
      url: string;
      labels: string[];
      // Add other relevant fields: state, assignee, body, etc.
    }

    export class GitHubService {
      private readonly GITHUB_API_URL = 'https://api.github.com/graphql';
      private token: string;
      private repoOwner: string;
      private repoName: string;
      private requiredLabels: string[];
      private inMemoryCache: GitHubIssue[] = [];
      private storage: IStorage;

      constructor(token: string, repoOwner: string, repoName: string, requiredLabels: string[], dbStorage: IStorage) {
        this.token = token;
        this.repoOwner = repoOwner; // e.g., 'department-of-veterans-affairs'
        this.repoName = repoName;   // e.g., 'va.gov-team'
        this.requiredLabels = requiredLabels;
        this.storage = dbStorage;
        // Initialize by loading from DB cache if desired
        this.loadIssuesFromDbCache().catch(console.error);
      }

      private async loadIssuesFromDbCache() {
        const dbIssues = await this.storage.getAllGithubIssues();
        if (dbIssues && dbIssues.length > 0) {
          this.inMemoryCache = dbIssues.map(issue => ({ ...issue, labels: issue.labels || [] }));
          console.log(`GitHubService: Loaded ${this.inMemoryCache.length} issues from DB cache.`);
        }
      }

      public async getCachedIssues(): Promise<{ issues: GitHubIssue[], lastRefreshed: string | null }> {
        const latestDbIssue = await this.storage.getLatestGithubIssue();
        const lastRefreshed = latestDbIssue ? latestDbIssue.fetched_at : null;
        // Prefer in-memory cache if populated, otherwise fall back to DB
        const issuesToReturn = this.inMemoryCache.length > 0 ? this.inMemoryCache : (await this.storage.getAllGithubIssues()).map(issue => ({ ...issue, labels: issue.labels || [] }));
        return { issues: issuesToReturn, lastRefreshed };
      }

      public async refreshIssuesFromApi(): Promise<GitHubIssue[]> {
        console.log(`GitHubService: Fetching issues for ${this.repoOwner}/${this.repoName} with labels: ${this.requiredLabels.join(', ')}`);
        // Implement actual GraphQL or REST API call to GitHub
        // This is a simplified placeholder for the actual fetch logic from server/routes.ts
        // Ensure to handle pagination if there are many issues.
        const query = `...`; // Your GraphQL query here
        
        // Example (conceptual - adapt existing fetchGitHubIssuesFromApi logic):
        // const response = await fetch(this.GITHUB_API_URL, { ... });
        // const data = await response.json();
        // const fetchedIssues = parseGitHubData(data); // Implement parsing
        const fetchedIssues: GitHubIssue[] = []; // Replace with actual fetched issues

        this.inMemoryCache = fetchedIssues;
        const currentTime = new Date().toISOString();
        await this.storage.saveGithubIssues(fetchedIssues.map(issue => ({ ...issue, fetched_at: currentTime })));
        console.log(`GitHubService: Refreshed and saved ${fetchedIssues.length} issues.`);
        return fetchedIssues;
      }

      // Placeholder for actual API call and parsing logic
      // private async fetchAndParseFromGitHubAPI(): Promise<GitHubIssue[]> { ... }
    }

    // Initialize and export the service instance (consider dependency injection for better testability)
    // You might pass process.env.GITHUB_TOKEN directly here, or use a config module
    // const GITHUB_REPO_PARTS = GITHUB_REPO.split('/'); // Assuming GITHUB_REPO is 'owner/name'
    // export const gitHubService = new GitHubService(
    //   process.env.GITHUB_TOKEN || '',
    //   GITHUB_REPO_PARTS[0],
    //   GITHUB_REPO_PARTS[1],
    //   REQUIRED_LABELS, // from constants or config
    //   storage
    // ); 
    ```
5.  **Update `server/routes.ts`**: Import and use `gitHubService` in the relevant route handlers.
    ```typescript
    // server/routes.ts
    // import { gitHubService } from './services/githubService'; // Adjust initialization
    // ...
    // app.get('/api/github/issues', async (req, res) => {
    //   try {
    //     const { issues, lastRefreshed } = await gitHubService.getCachedIssues();
    //     return res.json({ issues, lastRefreshed });
    //   } catch (error) { /* ... */ }
    // });
    // ...
    ```

**Benefits**: 
*   **Separation of Concerns**: `routes.ts` focuses on routing and request/response handling.
*   **Testability**: `githubService.ts` can be unit-tested independently.
*   **Maintainability**: Easier to manage and update GitHub integration logic.
*   **Reusability**: The service could be used elsewhere if needed.

### 2. Configuration Management

Consider centralizing configuration (like GitHub repo details, API keys) perhaps into a `server/config.ts` file that reads from environment variables, rather than having constants spread across files.

### 3. Error Handling

While basic error handling exists, a more robust and centralized error handling strategy could be implemented, potentially with custom error classes.

### 4. Further Modularization of `routes.ts`

If `routes.ts` grows significantly, consider splitting it into multiple files based on resource types (e.g., `roadmapRoutes.ts`, `githubRoutes.ts`, `authRoutes.ts`) and then importing them into `index.ts` or a main router file.

## Server Architecture Diagram (Post-Refactor for GitHub Service)

This diagram illustrates the proposed server architecture after refactoring the GitHub integration into a dedicated service.

```mermaid
graph TD
    subgraph ClientApp [Client Application]
        direction LR
        UI[User Interface]
    end

    subgraph ServerApp [Server (Node.js/Express)]
        direction TB
        A[Express App / Middleware (index.ts)] --> B(API Router /routes.ts);
        
        subgraph RouteHandlers [Route Handlers in routes.ts]
            direction LR
            R_Roadmap[/api/roadmap/*]
            R_GitHub[/api/github/*]
            R_Auth[/api/auth/*]
        end
        
        B --> R_Roadmap;
        B --> R_GitHub;
        B --> R_Auth; 

        subgraph Services
            direction TB
            S_GitHub[GitHub Service (services/githubService.ts)]
            S_Auth[Auth Service (services/authService.ts - hypothetical)]
        end
        
        subgraph DataAccess
            direction TB
            DA_Storage[Storage Layer (storage.ts / Drizzle ORM)]
        end

        R_Roadmap --> DA_Storage;
        R_GitHub --> S_GitHub;
        R_Auth --> S_Auth; 
        S_Auth --> DA_Storage; 

        S_GitHub --> DA_Storage; %% For caching GitHub issues in DB
        
    end

    subgraph ExternalServices
        direction TB
        Ext_GitHub[GitHub API]
        Ext_DB[(PostgreSQL / NeonDB)]
    end

    UI -- HTTP Requests --> A;
    S_GitHub -- API Calls --> Ext_GitHub;
    DA_Storage -- SQL --> Ext_DB;

    classDef internal fill:#ddeeff,stroke:#333,stroke-width:2px;
    classDef external fill:#ffeedd,stroke:#333,stroke-width:2px;
    classDef service fill:#e6ffe6,stroke:#333,stroke-width:2px;

    class A,B,R_Roadmap,R_GitHub,R_Auth internal;
    class S_GitHub,S_Auth service;
    class DA_Storage internal;
    class Ext_GitHub,Ext_DB external;
    class UI internal;
```

This diagram shows:
*   Client requests hitting the Express app.
*   The API router directing requests to specific route handlers.
*   Route handlers utilizing dedicated services (like the new `GitHubService`) for business logic.
*   Services and route handlers interacting with the `Storage Layer` (Drizzle ORM) for database operations.
*   The `GitHubService` communicating with the external GitHub API and also with the `Storage Layer` for caching.
*   The `Storage Layer` communicating with the PostgreSQL database. 