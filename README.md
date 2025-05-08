# Project Roadmap Application

This is a full-stack application designed to manage and visualize project roadmaps, with a focus on integrating GitHub issues. It features a React-based client, a Node.js/Express server, and a PostgreSQL database managed with Drizzle ORM.

## Architecture Overview

The application is structured into three main parts:

*   **Client**: A React single-page application (SPA) built with Vite, using Wouter for routing, Tailwind CSS and Radix UI (via shadcn/ui) for styling and components, and TanStack Query for server state management.
*   **Server**: A Node.js server built with Express, providing a REST API for the client. It handles business logic, database interactions (Drizzle ORM with NeonDB), and communication with the GitHub API.
*   **Shared**: A directory containing shared code, primarily database schemas and Zod validation schemas, ensuring type safety and consistency between the client and server.

```mermaid
graph TD
    subgraph Browser
        Client[React Client (Vite)]
    end

    subgraph Server Infrastructure
        APIServer[Node.js/Express Server]
        DB[(NeonDB/PostgreSQL)]
        GitHubAPI[GitHub API]
    end

    Client -- HTTP/API Calls --> APIServer;
    APIServer -- Drizzle ORM --> DB;
    APIServer -- REST/GraphQL --> GitHubAPI;
```

## Prerequisites

*   Node.js (v20.x or later recommended)
*   npm (usually comes with Node.js)
*   A PostgreSQL database (e.g., from [Neon](https://neon.tech/))
*   A GitHub Personal Access Token with `repo` scope if you want to fetch issues from private repositories or to avoid rate limiting.

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables. You can use `.env.example` if one is provided as a template.

    ```env
    # Server .env configuration
    DATABASE_URL="your_postgresql_connection_string"
    # Example: postgresql://user:password@host:port/dbname?sslmode=require

    # Optional: GitHub Token for fetching issues
    # Create a token at https://github.com/settings/tokens
    # Ensure it has the necessary scopes (e.g., 'repo' for private repos)
    GITHUB_TOKEN="your_github_personal_access_token"

    # Port for the server (defaults to 5000 if not set, but explicitly set here for clarity)
    PORT=5000
    ```
    *   Replace `"your_postgresql_connection_string"` with your actual database connection string.
    *   Replace `"your_github_personal_access_token"` with your GitHub token.

4.  **Push database schema:**
    Ensure your database is running and accessible, then apply the schema:
    ```bash
    npm run db:push
    ```
    This command uses Drizzle Kit to synchronize your database schema with the definitions in `shared/schema.ts`.

## Running the Project

To run the application in development mode:

```bash
npm run dev
```

This command will:
*   Start the Node.js/Express server (typically on `http://localhost:5000`). The server also handles API requests.
*   The Vite development server will manage the client-side application, usually accessible via the same port (`http://localhost:5000`) due to the server-side Vite integration in development. Check the console output for the exact URL.

To build the project for production:

```bash
npm run build
```

This will create optimized client assets in `dist/client` (or similar, check `vite.config.ts`) and a bundled server in `dist/server`.

To start the production build:

```bash
npm run start
```
This runs the server from the `dist` directory.

## Project Structure

*   `client/`: Contains the React frontend application.
    *   `src/`: Client-side source code (components, pages, hooks, etc.).
    *   `public/`: Static assets for the client.
*   `server/`: Contains the Node.js/Express backend application.
    *   `index.ts`: Server entry point.
    *   `routes.ts`: API route definitions and GitHub integration logic.
    *   `db.ts`: Database connection setup (Drizzle ORM).
    *   `storage.ts`: Data access layer abstracting database operations.
    *   `vite.ts`: Vite integration for development mode.
*   `shared/`: Code shared between the client and server.
    *   `schema.ts`: Drizzle ORM and Zod validation schemas.
*   `package.json`: Project dependencies and scripts.
*   `drizzle.config.ts`: Configuration for Drizzle Kit.
*   `vite.config.ts`: Configuration for Vite.
*   `tsconfig.json`: TypeScript configuration.

## Key Technologies Used

*   **Backend**:
    *   Node.js
    *   Express.js
    *   Drizzle ORM (with NeonDB/PostgreSQL)
    *   Passport.js (for potential authentication, setup not fully detailed here)
    *   Zod (for validation)
    *   tsx (for running TypeScript directly in development)
    *   esbuild (for production server build)
*   **Frontend**:
    *   React
    *   Vite
    *   Wouter (routing)
    *   Tailwind CSS
    *   shadcn/ui (Radix UI components)
    *   TanStack Query (React Query)
    *   Lucide Icons
*   **Shared**:
    *   TypeScript
    *   Zod

## Environment Variables

The following environment variables are used by the application (typically set in a `.env` file):

*   `DATABASE_URL`: **Required**. The connection string for your PostgreSQL database.
*   `GITHUB_TOKEN`: **Optional**. A GitHub Personal Access Token for accessing the GitHub API. Needed for fetching issues, especially from private repositories or to avoid rate limiting.
*   `PORT`: **Optional**. The port on which the server will run. Defaults to `5000` if not set.
*   `NODE_ENV`: Set to `development` or `production` by scripts. Influences Vite behavior and logging.

## Contributing

(Placeholder for contribution guidelines, if any)

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature`).
6.  Open a pull request. 