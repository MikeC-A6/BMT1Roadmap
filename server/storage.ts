import { users, type User, type InsertUser, roadmapCards, type RoadmapCard, type InsertRoadmapCard, githubIssues, type GithubIssue, type InsertGithubIssue } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Roadmap card methods
  getAllRoadmapCards(): Promise<RoadmapCard[]>;
  getRoadmapCard(id: string): Promise<RoadmapCard | undefined>;
  createRoadmapCard(card: InsertRoadmapCard): Promise<RoadmapCard>;
  updateRoadmapCard(id: string, updates: Partial<InsertRoadmapCard>): Promise<RoadmapCard | undefined>;
  deleteRoadmapCard(id: string): Promise<boolean>;
  
  // GitHub issues methods
  saveGithubIssues(issues: InsertGithubIssue[]): Promise<GithubIssue[]>;
  getAllGithubIssues(): Promise<GithubIssue[]>;
  getLatestGithubIssue(): Promise<GithubIssue | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Roadmap card methods
  async getAllRoadmapCards(): Promise<RoadmapCard[]> {
    return await db.select().from(roadmapCards);
  }
  
  async getRoadmapCard(id: string): Promise<RoadmapCard | undefined> {
    const [card] = await db.select().from(roadmapCards).where(eq(roadmapCards.id, id));
    return card;
  }
  
  async createRoadmapCard(card: InsertRoadmapCard & { id?: string }): Promise<RoadmapCard> {
    // Ensure the card has an ID
    const cardWithId = card.id 
      ? card 
      : { ...card, id: `card-${Date.now()}` };
    
    const [newCard] = await db
      .insert(roadmapCards)
      .values(cardWithId as any) // Type assertion needed due to Drizzle types
      .returning();
    return newCard;
  }
  
  async updateRoadmapCard(id: string, updates: Partial<InsertRoadmapCard>): Promise<RoadmapCard | undefined> {
    const [updatedCard] = await db
      .update(roadmapCards)
      .set(updates)
      .where(eq(roadmapCards.id, id))
      .returning();
    return updatedCard;
  }
  
  async deleteRoadmapCard(id: string): Promise<boolean> {
    const [deletedCard] = await db
      .delete(roadmapCards)
      .where(eq(roadmapCards.id, id))
      .returning();
    return !!deletedCard;
  }
  
  // GitHub issues methods
  async saveGithubIssues(issues: InsertGithubIssue[]): Promise<GithubIssue[]> {
    // First clear existing issues
    await db.delete(githubIssues);
    
    // Then insert all new issues
    if (issues.length === 0) return [];
    
    const savedIssues = await db
      .insert(githubIssues)
      .values(issues)
      .returning();
    
    return savedIssues;
  }
  
  async getAllGithubIssues(): Promise<GithubIssue[]> {
    return await db.select().from(githubIssues);
  }
  
  async getLatestGithubIssue(): Promise<GithubIssue | undefined> {
    const [latestIssue] = await db
      .select()
      .from(githubIssues)
      .orderBy(desc(githubIssues.fetched_at))
      .limit(1);
    
    return latestIssue;
  }
}

export const storage = new DatabaseStorage();
