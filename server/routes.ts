import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRoadmapCardSchema } from "@shared/schema";
import { z } from "zod";
import { gitHubService } from "./services/githubService";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/github/issues", async (_req, res) => {
    try {
      const { issues, lastRefreshed } = await gitHubService.getCachedIssues();
      return res.json({ issues, lastRefreshed });
    } catch (error) {
      console.error("Error fetching cached GitHub issues:", error);
      return res.status(500).json({ message: "Failed to fetch GitHub issues" });
    }
  });

  app.get("/api/github/issues/refresh", async (_req, res) => {
    try {
      const issues = await gitHubService.refreshIssuesFromApi();
      return res.json({
        message: "GitHub issues refreshed successfully",
        count: issues.length,
        lastRefreshed: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error refreshing GitHub issues:", error);
      return res.status(500).json({ message: "Failed to refresh GitHub issues" });
    }
  });

  // Roadmap Cards API Endpoints
  app.get("/api/roadmap/cards", async (_req, res) => {
    try {
      const cards = await storage.getAllRoadmapCards();
      return res.json({ cards });
    } catch (error) {
      console.error("Error fetching roadmap cards:", error);
      return res.status(500).json({ message: "Failed to fetch roadmap cards" });
    }
  });

  app.get("/api/roadmap/cards/:id", async (req, res) => {
    try {
      const card = await storage.getRoadmapCard(req.params.id);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      return res.json(card);
    } catch (error) {
      console.error("Error fetching roadmap card:", error);
      return res.status(500).json({ message: "Failed to fetch roadmap card" });
    }
  });

  app.post("/api/roadmap/cards", async (req, res) => {
    try {
      const cardData = insertRoadmapCardSchema.parse(req.body);
      const id = `card-${Date.now()}`;
      const newCard = await storage.createRoadmapCard({ ...cardData, id });
      return res.status(201).json(newCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error creating roadmap card:", error.errors);
        return res.status(400).json({
          message: "Invalid card data",
          errors: error.errors,
        });
      }
      console.error("Error creating roadmap card:", error);
      return res.status(500).json({ message: "Failed to create roadmap card" });
    }
  });

  app.patch("/api/roadmap/cards/:id", async (req, res) => {
    try {
      const cardId = req.params.id;
      const existingCard = await storage.getRoadmapCard(cardId);
      if (!existingCard) {
        return res.status(404).json({ message: "Card not found" });
      }
      const updateSchema = insertRoadmapCardSchema.partial();
      const updateData = updateSchema.parse(req.body);
      const updatedCard = await storage.updateRoadmapCard(cardId, updateData);
      return res.json(updatedCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: error.errors,
        });
      }
      console.error("Error updating roadmap card:", error);
      return res.status(500).json({ message: "Failed to update roadmap card" });
    }
  });

  app.delete("/api/roadmap/cards/:id", async (req, res) => {
    try {
      const cardId = req.params.id;
      const existingCard = await storage.getRoadmapCard(cardId);
      if (!existingCard) {
        return res.status(404).json({ message: "Card not found" });
      }
      const deleted = await storage.deleteRoadmapCard(cardId);
      if (deleted) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ message: "Failed to delete card" });
      }
    } catch (error) {
      console.error("Error deleting roadmap card:", error);
      return res.status(500).json({ message: "Failed to delete roadmap card" });
    }
  });

  app.post("/api/roadmap/cards/batch", async (req, res) => {
    try {
      const fullCardSchema = z.object({
        id: z.string(),
        text: z.string(),
        location: z.any(),
        isAccent: z.boolean().optional(),
        is_accent: z.boolean().optional(),
        githubNumber: z.number().optional().nullable(),
        github_number: z.number().optional().nullable(),
        githubUrl: z.string().optional().nullable(),
        github_url: z.string().optional().nullable(),
      });

      const batchSchema = z.array(fullCardSchema);
      const cardsData = batchSchema.parse(req.body);

      const createdCards = [] as any[];
      for (const cardData of cardsData) {
        const normalizedData = {
          id: cardData.id,
          text: cardData.text,
          location: cardData.location,
          is_accent: cardData.isAccent || cardData.is_accent,
          github_number: cardData.githubNumber || cardData.github_number,
          github_url: cardData.githubUrl || cardData.github_url,
        };
        const newCard = await storage.createRoadmapCard(normalizedData);
        createdCards.push(newCard);
      }

      return res.status(201).json({ cards: createdCards });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error creating batch of roadmap cards:", error.errors);
        return res.status(400).json({
          message: "Invalid batch data",
          errors: error.errors,
        });
      }
      console.error("Error creating batch of roadmap cards:", error);
      return res.status(500).json({ message: "Failed to create batch of roadmap cards" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
