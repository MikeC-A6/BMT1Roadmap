import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keep existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// GitHub issues table for caching
export const githubIssues = pgTable("github_issues", {
  id: text("id").primaryKey(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  labels: text("labels").array(),
  fetched_at: text("fetched_at").notNull()
});

export const insertGithubIssueSchema = createInsertSchema(githubIssues);

// Roadmap cards table for persistence
export const roadmapCards = pgTable("roadmap_cards", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  location: jsonb("location").notNull(),
  is_accent: boolean("is_accent").default(false),
  is_high_priority: boolean("is_high_priority").default(false),
  github_number: integer("github_number"),
  github_url: text("github_url"),
});

export const insertRoadmapCardSchema = createInsertSchema(roadmapCards)
  .omit({ id: true }); // Omit id to allow server to generate it

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGithubIssue = z.infer<typeof insertGithubIssueSchema>;
export type GithubIssue = typeof githubIssues.$inferSelect;

export type InsertRoadmapCard = z.infer<typeof insertRoadmapCardSchema>;
export type RoadmapCard = typeof roadmapCards.$inferSelect;
