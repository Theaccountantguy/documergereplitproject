import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar_url: text("avatar_url"),
  google_access_token: text("google_access_token"),
  google_refresh_token: text("google_refresh_token"),
  google_token_expires_at: timestamp("google_token_expires_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const googleCredentials = pgTable("google_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  client_id: text("client_id").notNull(),
  client_secret: text("client_secret").notNull(),
  api_key: text("api_key").notNull(),
  app_id: text("app_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  google_doc_id: text("google_doc_id").notNull(),
  google_sheet_id: text("google_sheet_id"),
  doc_name: text("doc_name").notNull(),
  sheet_name: text("sheet_name"),
  merge_fields: jsonb("merge_fields"),
  last_merge_at: timestamp("last_merge_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const mergeJobs = pgTable("merge_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  document_id: varchar("document_id").references(() => documents.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  total_records: integer("total_records"),
  processed_records: integer("processed_records").default(0),
  error_message: text("error_message"),
  download_urls: jsonb("download_urls"),
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export const insertGoogleCredentialsSchema = createInsertSchema(googleCredentials).omit({
  id: true,
  created_at: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  created_at: true,
});

export const insertMergeJobSchema = createInsertSchema(mergeJobs).omit({
  id: true,
  created_at: true,
  completed_at: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type GoogleCredentials = typeof googleCredentials.$inferSelect;
export type InsertGoogleCredentials = z.infer<typeof insertGoogleCredentialsSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type MergeJob = typeof mergeJobs.$inferSelect;
export type InsertMergeJob = z.infer<typeof insertMergeJobSchema>;
