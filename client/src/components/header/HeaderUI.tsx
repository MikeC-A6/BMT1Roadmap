import GitHubLogo from "../GitHubLogo";

export interface HeaderUIProps {
  lastRefreshed: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function HeaderUI({ lastRefreshed, isRefreshing, onRefresh }: HeaderUIProps) {
  return (
    <header className="sticky bg-gradient-to-br from-[#fafaff] to-[#eef3ff] py-5 shadow-sm max-w-7xl mx-auto">
      <div className="relative max-w-7xl mx-auto w-full">
        {/* Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-3xl font-bold text-[hsl(var(--va-blue))]">Mavericks BMT1 Roadmap</h1>
            <p className="text-[hsl(var(--va-blue-lighter))] text-lg font-semibold">Benefits Management Tools Team 1</p>
            <p className="text-sm text-[hsl(var(--va-blue-lighter))] mt-1">
              Issues last refreshed: {lastRefreshed}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-[hsl(var(--va-blue))] text-white py-2 px-4 rounded-lg shadow hover:bg-[#00529c] transition-colors disabled:opacity-70"
            >
              <GitHubLogo className={`h-5 w-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh from GitHub
            </button>
            {isRefreshing && <span className="text-[hsl(var(--va-blue-lighter))] italic">Loading issues...</span>}
          </div>
        </div>
      </div>
    </header>
  );
} 