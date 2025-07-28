import { type User, type InsertUser, type GoogleCredentials, type InsertGoogleCredentials, type Document, type InsertDocument, type MergeJob, type InsertMergeJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Google credentials operations
  getGoogleCredentials(userId: string): Promise<GoogleCredentials | undefined>;
  createGoogleCredentials(credentials: InsertGoogleCredentials): Promise<GoogleCredentials>;
  updateGoogleCredentials(userId: string, updates: Partial<GoogleCredentials>): Promise<GoogleCredentials | undefined>;

  // Document operations
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;

  // Merge job operations
  getMergeJob(id: string): Promise<MergeJob | undefined>;
  getMergeJobsByUser(userId: string): Promise<MergeJob[]>;
  createMergeJob(job: InsertMergeJob): Promise<MergeJob>;
  updateMergeJob(id: string, updates: Partial<MergeJob>): Promise<MergeJob | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private googleCredentials: Map<string, GoogleCredentials>;
  private documents: Map<string, Document>;
  private mergeJobs: Map<string, MergeJob>;

  constructor() {
    this.users = new Map();
    this.googleCredentials = new Map();
    this.documents = new Map();
    this.mergeJobs = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      created_at: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Google credentials operations
  async getGoogleCredentials(userId: string): Promise<GoogleCredentials | undefined> {
    return Array.from(this.googleCredentials.values()).find(cred => cred.user_id === userId);
  }

  async createGoogleCredentials(insertCredentials: InsertGoogleCredentials): Promise<GoogleCredentials> {
    const id = randomUUID();
    const credentials: GoogleCredentials = {
      ...insertCredentials,
      id,
      created_at: new Date(),
    };
    this.googleCredentials.set(id, credentials);
    return credentials;
  }

  async updateGoogleCredentials(userId: string, updates: Partial<GoogleCredentials>): Promise<GoogleCredentials | undefined> {
    const credentials = Array.from(this.googleCredentials.values()).find(cred => cred.user_id === userId);
    if (!credentials) return undefined;

    const updatedCredentials = { ...credentials, ...updates };
    this.googleCredentials.set(credentials.id, updatedCredentials);
    return updatedCredentials;
  }

  // Document operations
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.user_id === userId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      created_at: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  // Merge job operations
  async getMergeJob(id: string): Promise<MergeJob | undefined> {
    return this.mergeJobs.get(id);
  }

  async getMergeJobsByUser(userId: string): Promise<MergeJob[]> {
    return Array.from(this.mergeJobs.values()).filter(job => job.user_id === userId);
  }

  async createMergeJob(insertJob: InsertMergeJob): Promise<MergeJob> {
    const id = randomUUID();
    const job: MergeJob = {
      ...insertJob,
      id,
      created_at: new Date(),
    };
    this.mergeJobs.set(id, job);
    return job;
  }

  async updateMergeJob(id: string, updates: Partial<MergeJob>): Promise<MergeJob | undefined> {
    const job = this.mergeJobs.get(id);
    if (!job) return undefined;

    const updatedJob = { ...job, ...updates };
    this.mergeJobs.set(id, updatedJob);
    return updatedJob;
  }
}

export const storage = new MemStorage();
