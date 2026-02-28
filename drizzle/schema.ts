import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, longtext, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Projects table - organize snippets into projects/repositories
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6366f1"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Code snippets table
export const snippets = mysqlTable("snippets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  title: varchar("title", { length: 255 }).notNull(),
  code: longtext("code").notNull(),
  language: varchar("language", { length: 50 }).notNull().default("javascript"),
  description: text("description"),
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Snippet = typeof snippets.$inferSelect;
export type InsertSnippet = typeof snippets.$inferInsert;

// Line notes table - notes for specific lines in a snippet
export const lineNotes = mysqlTable("lineNotes", {
  id: int("id").autoincrement().primaryKey(),
  snippetId: int("snippetId").notNull(),
  userId: int("userId").notNull(),
  lineNumber: int("lineNumber").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LineNote = typeof lineNotes.$inferSelect;
export type InsertLineNote = typeof lineNotes.$inferInsert;

// Files table - uploaded files (PDF, images)
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileRecord = typeof files.$inferSelect;
export type InsertFileRecord = typeof files.$inferInsert;

// AI chat history table
export const aiChats = mysqlTable("aiChats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  snippetId: int("snippetId"),
  role: mysqlEnum("chatRole", ["user", "assistant", "system"]).notNull(),
  content: longtext("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiChat = typeof aiChats.$inferSelect;
export type InsertAiChat = typeof aiChats.$inferInsert;
