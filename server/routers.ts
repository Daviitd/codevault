import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getUserProjects, getProjectById, createProject, updateProject, deleteProject,
  getUserSnippets, getSnippetById, createSnippet, updateSnippet, deleteSnippet, searchSnippets,
  getSnippetNotes, upsertLineNote, deleteLineNote,
  getUserFiles, createFile, deleteFile,
  getAiChatHistory, saveAiChat, clearAiChatHistory,
} from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Projects ──────────────────────────────────────────────────────────────
  projects: router({
    list: protectedProcedure.query(({ ctx }) => getUserProjects(ctx.user.id)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getProjectById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      color: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      createProject({ ...input, userId: ctx.user.id })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      color: z.string().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateProject(id, ctx.user.id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      deleteProject(input.id, ctx.user.id)
    ),
  }),

  // ─── Snippets ──────────────────────────────────────────────────────────────
  snippets: router({
    list: protectedProcedure.input(z.object({ projectId: z.number().optional() }).optional()).query(({ ctx, input }) =>
      getUserSnippets(ctx.user.id, input?.projectId)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getSnippetById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1).max(255),
      code: z.string(),
      language: z.string().default("javascript"),
      description: z.string().optional(),
      projectId: z.number().nullable().optional(),
    })).mutation(({ ctx, input }) =>
      createSnippet({ ...input, userId: ctx.user.id })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      code: z.string().optional(),
      language: z.string().optional(),
      description: z.string().optional(),
      projectId: z.number().nullable().optional(),
      isFavorite: z.boolean().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateSnippet(id, ctx.user.id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      deleteSnippet(input.id, ctx.user.id)
    ),
    search: protectedProcedure.input(z.object({
      query: z.string().min(1),
      projectId: z.number().optional(),
    })).query(({ ctx, input }) =>
      searchSnippets(ctx.user.id, input.query, input.projectId)
    ),
  }),

  // ─── Line Notes ────────────────────────────────────────────────────────────
  notes: router({
    getBySnippet: protectedProcedure.input(z.object({ snippetId: z.number() })).query(({ ctx, input }) =>
      getSnippetNotes(input.snippetId, ctx.user.id)
    ),
    upsert: protectedProcedure.input(z.object({
      snippetId: z.number(),
      lineNumber: z.number(),
      content: z.string().min(1),
    })).mutation(({ ctx, input }) =>
      upsertLineNote({ ...input, userId: ctx.user.id })
    ),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      deleteLineNote(input.id, ctx.user.id)
    ),
  }),

  // ─── Files ─────────────────────────────────────────────────────────────────
  files: router({
    list: protectedProcedure.input(z.object({ projectId: z.number().optional() }).optional()).query(({ ctx, input }) =>
      getUserFiles(ctx.user.id, input?.projectId)
    ),
    upload: protectedProcedure.input(z.object({
      filename: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      base64Data: z.string(),
      projectId: z.number().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64Data, "base64");
      const fileKey = `${ctx.user.id}-files/${nanoid()}-${input.filename}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      return createFile({
        userId: ctx.user.id,
        projectId: input.projectId ?? null,
        filename: input.filename,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        url,
        fileKey,
      });
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      deleteFile(input.id, ctx.user.id)
    ),
  }),

  // ─── AI Assistant ──────────────────────────────────────────────────────────
  ai: router({
    chat: protectedProcedure.input(z.object({
      message: z.string().min(1),
      snippetId: z.number().optional(),
      context: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Save user message
      await saveAiChat({
        userId: ctx.user.id,
        snippetId: input.snippetId ?? null,
        role: "user",
        content: input.message,
      });

      // Get recent history
      const history = await getAiChatHistory(ctx.user.id, input.snippetId, 20);

      const systemPrompt = `Eres un asistente de programación experto integrado en CodeVault, una plataforma de repositorio de código. Tu nombre es CodeVault AI.

Responde siempre en español.
Puedes:
- Explicar fragmentos de código línea por línea
- Sugerir mejoras y optimizaciones
- Ayudar con documentación y notas
- Responder preguntas técnicas de programación
- Detectar errores y problemas en el código
- Sugerir buenas prácticas

${input.context ? `Contexto del código actual:\n\`\`\`\n${input.context}\n\`\`\`` : ""}

Sé conciso pero completo. Usa formato Markdown para las respuestas.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.map(h => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      const response = await invokeLLM({ messages });
      const aiContent = typeof response.choices[0]?.message?.content === "string"
        ? response.choices[0].message.content
        : "Lo siento, no pude generar una respuesta.";

      // Save AI response
      await saveAiChat({
        userId: ctx.user.id,
        snippetId: input.snippetId ?? null,
        role: "assistant",
        content: aiContent,
      });

      return { content: aiContent };
    }),
    history: protectedProcedure.input(z.object({
      snippetId: z.number().optional(),
    }).optional()).query(({ ctx, input }) =>
      getAiChatHistory(ctx.user.id, input?.snippetId)
    ),
    clearHistory: protectedProcedure.input(z.object({
      snippetId: z.number().optional(),
    }).optional()).mutation(({ ctx, input }) =>
      clearAiChatHistory(ctx.user.id, input?.snippetId)
    ),
  }),
});

export type AppRouter = typeof appRouter;
