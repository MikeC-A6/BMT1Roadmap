import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { DndProvider } from "@/lib/dndProvider";

createRoot(document.getElementById("root")!).render(
  <DndProvider>
    <App />
  </DndProvider>
);
