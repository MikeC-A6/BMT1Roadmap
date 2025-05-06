import { RoadmapObjective, RoadmapCard } from "@/types";

// Roadmap objectives
export const objectives: RoadmapObjective[] = [
  {
    id: "obj1",
    text: "Increase Veteran satisfaction with web / mobile products <strong>+5 points</strong>"
  },
  {
    id: "obj2",
    text: "1.2 Cut Veteran wait‑time for a response by <strong>50%</strong> — target &lt; 4s / transaction"
  },
  {
    id: "obj3",
    text: "1.3 Ensure <strong>100%</strong> of transactions are processed correctly <em>or</em> the user receives an error notification"
  },
  {
    id: "obj4",
    text: "No <u>VA.gov</u> benefits transactions rely on services slated for deprecation within 24 months (legacy VBMS, BGS, BEP APIs, EVSS)"
  },
  {
    id: "obj5",
    text: "Other (does not neatly fit into a KR)"
  }
];

// Initial cards setup (matching the sample)
export const initialCards: RoadmapCard[] = [
  { id: "card-1", text: "CST – Claim Status Tool: Fast, Jitter‑Free First Load", location: { objective: "obj1", column: "now" } },
  { id: "card-2", text: "Route signed‑in Veterans directly to their Claim Status Tool (\"double loading\")", location: { objective: "obj1", column: "now" } },
  { id: "card-3", text: "Accurate claim titles", location: { objective: "obj1", column: "next" } },
  { id: "card-4", text: "Add link to file and view travel pay claims", location: { objective: "obj1", column: "next" } },
  { id: "card-5", text: "Discovery into C&P exam improvement opportunities", location: { objective: "obj1", column: "later" } },
  { id: "card-6", text: "Improve file history experience", location: { objective: "obj1", column: "later" } },
  { id: "card-7", text: "Kick‑off component modernization", location: { objective: "obj2", column: "now" } },
  { id: "card-8", text: "Continue component refactors", location: { objective: "obj2", column: "next" } },
  { id: "card-9", text: "Fix file‑upload error so users know when their upload fails", location: { objective: "obj3", column: "now" } },
  { id: "card-10", text: "5103 silent failure polling solution", location: { objective: "obj3", column: "later" } },
  { id: "card-11", text: "EVSS → Lighthouse letters download (discovery)", location: { objective: "obj4", column: "now" } },
  { id: "card-12", text: "Letter-download EVSS → Lighthouse migration (build)", location: { objective: "obj4", column: "next" } },
  { id: "card-13", text: "Fix all heading‑hierarchy violations that will break Cypress Axe tests when new rules activate on April 30", location: { objective: "obj5", column: "now" } },
  { id: "card-14", text: "Migration USWDS v3 file‑upload", location: { objective: "obj5", column: "next" } },
  { id: "card-15", text: "Automate Feedback survey sentiment analysis", location: { objective: "obj5", column: "later" } },
  { id: "card-16", text: "Pick up event‑based architecture & decision letter notification work", location: { objective: "obj5", column: "later" }, isAccent: true },
  { id: "card-17", text: "Expand claim letter sorting functionality", location: { objective: "obj1", column: "later" } },
  { id: "card-18", text: "Introduce C&P exam experience improvements", location: { objective: "obj1", column: "later" } },
  { id: "card-19", text: "High‑value performance optimizations", location: { objective: "obj2", column: "next" } },
  { id: "card-20", text: "Extend performance epic to lower‑impact files and test helpers", location: { objective: "obj2", column: "later" } },
  { id: "card-21", text: "Evidence request email notifications", location: { objective: "obj5", column: "later" } }
]; 