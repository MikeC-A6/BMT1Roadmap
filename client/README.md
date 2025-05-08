# Client Application

This directory contains the frontend React application for the Project Roadmap tool. It is built using Vite, styled with Tailwind CSS and shadcn/ui (Radix UI components), and uses TanStack Query for managing server state and Wouter for routing.

## Overview

The client application provides the user interface for:
*   Viewing and managing roadmap cards.
*   Visualizing project timelines and statuses.
*   Integrating with GitHub issues to link them to roadmap items.

## Technologies Used

*   **Framework/Library**: React 18
*   **Build Tool**: Vite
*   **Routing**: Wouter
*   **Styling**: Tailwind CSS, PostCSS
*   **UI Components**: shadcn/ui (built on Radix UI & Tailwind CSS)
*   **Icons**: Lucide React
*   **State Management**: TanStack Query (for server state, API caching, etc.)
*   **Language**: TypeScript
*   **Forms**: React Hook Form (implied by `@hookform/resolvers` in root `package.json`)
*   **Utility Libraries**: `clsx`, `tailwind-merge` (for conditional class names)

## Project Structure (`client/src/`)

```
client/
├── public/               # Static assets (e.g., favicons, images)
├── src/
│   ├── components/       # Shared UI components (e.g., buttons, cards)
│   │   └── ui/           # shadcn/ui generated components
│   ├── config/           # Client-specific configurations
│   ├── hooks/            # Custom React hooks (e.g., for API calls, business logic)
│   ├── lib/              # Utility functions, queryClient setup
│   ├── pages/            # Top-level route components (e.g., Home, NotFound)
│   ├── types/            # Client-specific TypeScript type definitions
│   ├── App.tsx           # Main application component, sets up providers and router
│   ├── main.tsx          # Entry point, renders the App component
│   └── index.css         # Global styles and Tailwind CSS base layers
├── index.html            # Main HTML entry point for Vite
└── ... (other config files like vite.config.ts, tsconfig.json at root level)
```

*   **`main.tsx`**: The main entry point that renders the `App` component into the DOM.
*   **`App.tsx`**: Sets up global providers like `QueryClientProvider` (for TanStack Query), `TooltipProvider`, and the main `Router` using `wouter`.
*   **`pages/`**: Contains components that represent different views/pages of the application (e.g., `Home.tsx`).
*   **`components/`**: Reusable UI elements. The `ui/` subdirectory typically holds components generated or customized from shadcn/ui.
*   **`hooks/`**: Custom React Hooks for encapsulating logic, such as fetching data or interacting with browser APIs.
*   **`lib/`**: Utility functions, helper modules, and client-side library initializations (e.g., `queryClient.ts` for TanStack Query).
*   **`config/`**: Client-side configuration values.
*   **`types/`**: TypeScript interfaces and type definitions specific to the client.

## Development

The client development server is typically managed by the root `npm run dev` command, which starts the backend server. The backend server, in development mode, uses Vite as middleware to serve the client application with Hot Module Replacement (HMR).

*   **Access**: Usually `http://localhost:5000` (or the port specified in your `.env` or by the `dev` script).
*   **Hot Reloading**: Changes to client code should automatically update in the browser.

### Key Scripts (from root `package.json`)

*   `npm run dev`: Starts the backend server, which in turn serves the client in development mode using Vite.
*   `npm run build`: Builds the client application for production. Vite will output optimized static assets (typically into `dist/client` or a similar directory configured in `vite.config.ts` at the root).
*   `npm run check`: Runs TypeScript type checking for the entire project, including the client.

## Building for Production

To build the client application for production, run the following command from the **root directory** of the project:

```bash
npm run build
```

This command, as defined in the root `package.json`, will first execute `vite build` (which builds the client) and then build the server. The client assets will be placed in a distribution folder, ready to be served by the production server.

## Interacting with the API

*   The client uses TanStack Query (`@tanstack/react-query`) to fetch, cache, and manage data from the backend API.
*   API calls are typically encapsulated within custom hooks in the `src/hooks/` directory or directly within components where appropriate.
*   The base URL for API requests is implicitly `/api/...` as the client and server are served from the same origin.

## Styling

*   **Tailwind CSS**: Used for utility-first styling. Configuration is in `tailwind.config.ts` at the root.
*   **shadcn/ui**: Provides a set of pre-built, customizable React components that are integrated with Tailwind CSS. These are often found in `src/components/ui/`.
*   **Global Styles**: `src/index.css` contains base Tailwind directives and any custom global styles. 