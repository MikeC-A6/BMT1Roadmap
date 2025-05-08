import { useHeaderData } from "@/hooks/useHeaderData";
import { HeaderUI } from "./header/HeaderUI";

export default function Header() {
  const { lastRefreshed, isRefreshing, refreshIssues } = useHeaderData();
  
  return (
    <HeaderUI 
      lastRefreshed={lastRefreshed}
      isRefreshing={isRefreshing}
      onRefresh={refreshIssues}
    />
  );
}
