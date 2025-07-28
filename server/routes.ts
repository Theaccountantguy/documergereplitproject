import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertGoogleCredentialsSchema, insertDocumentSchema, insertMergeJobSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Google credentials routes
  app.get("/api/users/:userId/credentials", async (req, res) => {
    try {
      const credentials = await storage.getGoogleCredentials(req.params.userId);
      if (!credentials) {
        return res.status(404).json({ error: "Credentials not found" });
      }
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: "Failed to get credentials" });
    }
  });

  app.post("/api/users/:userId/credentials", async (req, res) => {
    try {
      const credentialsData = insertGoogleCredentialsSchema.parse({
        ...req.body,
        user_id: req.params.userId,
      });
      const credentials = await storage.createGoogleCredentials(credentialsData);
      res.status(201).json(credentials);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create credentials" });
    }
  });

  // Document routes
  app.get("/api/users/:userId/documents", async (req, res) => {
    try {
      const documents = await storage.getDocumentsByUser(req.params.userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  app.post("/api/users/:userId/documents", async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        user_id: req.params.userId,
      });
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.updateDocument(req.params.id, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  // Merge job routes
  app.get("/api/users/:userId/merge-jobs", async (req, res) => {
    try {
      const jobs = await storage.getMergeJobsByUser(req.params.userId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get merge jobs" });
    }
  });

  app.post("/api/users/:userId/merge-jobs", async (req, res) => {
    try {
      const jobData = insertMergeJobSchema.parse({
        ...req.body,
        user_id: req.params.userId,
      });
      const job = await storage.createMergeJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create merge job" });
    }
  });

  app.patch("/api/merge-jobs/:id", async (req, res) => {
    try {
      const job = await storage.updateMergeJob(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ error: "Merge job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to update merge job" });
    }
  });

  // Google APIs proxy routes
  app.post("/api/google/documents/:documentId/content", async (req, res) => {
    try {
      const { access_token } = req.body;
      
      const response = await fetch(
        `https://docs.googleapis.com/v1/documents/${req.params.documentId}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch document content');
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document content" });
    }
  });

  app.post("/api/google/spreadsheets/:spreadsheetId/values", async (req, res) => {
    try {
      const { access_token, range = 'A1:Z1000' } = req.body;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${req.params.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sheet data');
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sheet data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
