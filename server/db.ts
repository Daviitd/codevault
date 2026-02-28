import { eq, and, like, or, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  projects, InsertProject,
  snippets, InsertSnippet,
  lineNotes, InsertLineNote,
  files, InsertFileRecord,
  aiChats, InsertAiChat,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
  return result[0];
}

export async function createProject(data: Omit<InsertProject, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(projects).values(data);
  return { id: result[0].insertId };
}

export async function updateProject(id: number, userId: number, data: Partial<Pick<InsertProject, "name" | "description" | "color">>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(projects).set(data).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function deleteProject(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Also delete related snippets, notes, and files
  const projectSnippets = await db.select({ id: snippets.id }).from(snippets).where(and(eq(snippets.projectId, id), eq(snippets.userId, userId)));
  for (const s of projectSnippets) {
    await db.delete(lineNotes).where(eq(lineNotes.snippetId, s.id));
  }
  await db.delete(snippets).where(and(eq(snippets.projectId, id), eq(snippets.userId, userId)));
  await db.delete(files).where(and(eq(files.projectId, id), eq(files.userId, userId)));
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// ─── Snippets ────────────────────────────────────────────────────────────────

export async function getUserSnippets(userId: number, projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(snippets.userId, userId)];
  if (projectId) conditions.push(eq(snippets.projectId, projectId));
  return db.select().from(snippets).where(and(...conditions)).orderBy(desc(snippets.updatedAt));
}

export async function getSnippetById(snippetId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(snippets).where(and(eq(snippets.id, snippetId), eq(snippets.userId, userId))).limit(1);
  return result[0];
}

export async function createSnippet(data: Omit<InsertSnippet, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(snippets).values(data);
  return { id: result[0].insertId };
}

export async function updateSnippet(id: number, userId: number, data: Partial<Pick<InsertSnippet, "title" | "code" | "language" | "description" | "projectId" | "isFavorite">>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(snippets).set(data).where(and(eq(snippets.id, id), eq(snippets.userId, userId)));
}

export async function deleteSnippet(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(lineNotes).where(and(eq(lineNotes.snippetId, id), eq(lineNotes.userId, userId)));
  await db.delete(snippets).where(and(eq(snippets.id, id), eq(snippets.userId, userId)));
}

export async function searchSnippets(userId: number, query: string, projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query}%`;
  const conditions = [
    eq(snippets.userId, userId),
    or(
      like(snippets.title, searchPattern),
      like(snippets.code, searchPattern),
      like(snippets.description, searchPattern)
    )!,
  ];
  if (projectId) conditions.push(eq(snippets.projectId, projectId));
  return db.select().from(snippets).where(and(...conditions)).orderBy(desc(snippets.updatedAt));
}

// ─── Line Notes ──────────────────────────────────────────────────────────────

export async function getSnippetNotes(snippetId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lineNotes).where(and(eq(lineNotes.snippetId, snippetId), eq(lineNotes.userId, userId))).orderBy(asc(lineNotes.lineNumber));
}

export async function upsertLineNote(data: Omit<InsertLineNote, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Check if note exists for this line
  const existing = await db.select().from(lineNotes).where(
    and(eq(lineNotes.snippetId, data.snippetId), eq(lineNotes.lineNumber, data.lineNumber), eq(lineNotes.userId, data.userId))
  ).limit(1);
  if (existing.length > 0) {
    await db.update(lineNotes).set({ content: data.content }).where(eq(lineNotes.id, existing[0].id));
    return { id: existing[0].id };
  } else {
    const result = await db.insert(lineNotes).values(data);
    return { id: result[0].insertId };
  }
}

export async function deleteLineNote(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(lineNotes).where(and(eq(lineNotes.id, id), eq(lineNotes.userId, userId)));
}

// ─── Files ───────────────────────────────────────────────────────────────────

export async function getUserFiles(userId: number, projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(files.userId, userId)];
  if (projectId) conditions.push(eq(files.projectId, projectId));
  return db.select().from(files).where(and(...conditions)).orderBy(desc(files.createdAt));
}

export async function createFile(data: Omit<InsertFileRecord, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(files).values(data);
  return { id: result[0].insertId };
}

export async function deleteFile(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(files).where(and(eq(files.id, id), eq(files.userId, userId)));
}

// ─── AI Chats ────────────────────────────────────────────────────────────────

export async function getAiChatHistory(userId: number, snippetId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(aiChats.userId, userId)];
  if (snippetId) conditions.push(eq(aiChats.snippetId, snippetId));
  return db.select().from(aiChats).where(and(...conditions)).orderBy(asc(aiChats.createdAt)).limit(limit);
}

export async function saveAiChat(data: Omit<InsertAiChat, "id">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(aiChats).values(data);
  return { id: result[0].insertId };
}

export async function clearAiChatHistory(userId: number, snippetId?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const conditions = [eq(aiChats.userId, userId)];
  if (snippetId) conditions.push(eq(aiChats.snippetId, snippetId));
  await db.delete(aiChats).where(and(...conditions));
}
