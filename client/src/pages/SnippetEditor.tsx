import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Braces, MessageSquare, Sparkles, Trash2,
  Plus, X, ChevronLeft, ChevronRight, Bot, Send, Loader2,
} from "lucide-react";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";

// CodeMirror imports
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { indentOnInput, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, completionKeymap, autocompletion } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { java } from "@codemirror/lang-java";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";
import { sql } from "@codemirror/lang-sql";
import { markdown } from "@codemirror/lang-markdown";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { oneDark } from "@codemirror/theme-one-dark";


const LANGUAGES = [
  "javascript", "typescript", "python", "cpp", "java", "go", "rust",
  "html", "css", "sql", "json", "markdown", "xml", "php",
];

function getLanguageExtension(lang: string) {
  switch (lang) {
    case "javascript": return javascript();
    case "typescript": return javascript({ typescript: true });
    case "python": return python();
    case "cpp": case "c": return cpp();
    case "html": return html();
    case "css": return css();
    case "java": return java();
    case "rust": return rust();
    case "go": return go();
    case "php": return php();
    case "sql": return sql();
    case "markdown": return markdown();
    case "json": return json();
    case "xml": return xml();
    default: return javascript();
  }
}

// Custom dark theme matching our glassmorphism style
const codeVaultTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "oklch(0.88 0.005 270)",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  ".cm-content": {
    caretColor: "oklch(0.65 0.25 275)",
    padding: "8px 0",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "oklch(0.65 0.25 275)",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "oklch(0.65 0.25 275 / 20%)",
  },
  ".cm-panels": { backgroundColor: "oklch(0.13 0.012 270)", color: "oklch(0.88 0.005 270)" },
  ".cm-panels.cm-panels-top": { borderBottom: "1px solid oklch(1 0 0 / 8%)" },
  ".cm-panels.cm-panels-bottom": { borderTop: "1px solid oklch(1 0 0 / 8%)" },
  ".cm-searchMatch": {
    backgroundColor: "oklch(0.65 0.25 275 / 25%)",
    outline: "1px solid oklch(0.65 0.25 275 / 40%)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "oklch(0.65 0.25 275 / 40%)",
  },
  ".cm-activeLine": { backgroundColor: "oklch(1 0 0 / 3%)" },
  ".cm-selectionMatch": { backgroundColor: "oklch(0.65 0.25 275 / 15%)" },
  "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: "oklch(0.65 0.25 275 / 25%)",
    outline: "1px solid oklch(0.65 0.25 275 / 40%)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "oklch(0.5 0.01 270)",
    border: "none",
    paddingRight: "4px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "oklch(0.65 0.25 275)",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "oklch(0.2 0.015 270)",
    border: "none",
    color: "oklch(0.6 0.02 270)",
  },
  ".cm-tooltip": {
    backgroundColor: "oklch(0.16 0.015 270 / 95%)",
    border: "1px solid oklch(1 0 0 / 10%)",
    backdropFilter: "blur(20px)",
  },
  ".cm-tooltip .cm-tooltip-arrow:before": {
    borderTopColor: "oklch(1 0 0 / 10%)",
    borderBottomColor: "oklch(1 0 0 / 10%)",
  },
  ".cm-tooltip .cm-tooltip-arrow:after": {
    borderTopColor: "oklch(0.16 0.015 270)",
    borderBottomColor: "oklch(0.16 0.015 270)",
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: "oklch(0.65 0.25 275 / 20%)",
      color: "oklch(0.93 0.005 270)",
    },
  },
  ".cm-line": {
    padding: "0 8px",
  },
}, { dark: true });

export default function SnippetEditor() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const snippetId = params.id ? parseInt(params.id) : undefined;
  const isNew = !snippetId || isNaN(snippetId);

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [notesPanel, setNotesPanel] = useState(true);
  const [aiPanel, setAiPanel] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Queries
  const snippetQuery = trpc.snippets.getById.useQuery(
    { id: snippetId! },
    { enabled: !!snippetId && isAuthenticated }
  );
  const notesQuery = trpc.notes.getBySnippet.useQuery(
    { snippetId: snippetId! },
    { enabled: !!snippetId && isAuthenticated }
  );

  const utils = trpc.useUtils();

  // Mutations
  const createMut = trpc.snippets.create.useMutation({
    onSuccess: (data) => {
      setHasUnsavedChanges(false);
      toast.success("Fragmento creado");
      setLocation(`/snippet/${data.id}`);
    },
  });
  const updateMut = trpc.snippets.update.useMutation({
    onSuccess: () => {
      setHasUnsavedChanges(false);
      toast.success("Guardado");
      utils.snippets.getById.invalidate({ id: snippetId! });
    },
  });
  const upsertNoteMut = trpc.notes.upsert.useMutation({
    onSuccess: () => {
      utils.notes.getBySnippet.invalidate({ snippetId: snippetId! });
      setNoteInput("");
      toast.success("Nota guardada");
    },
  });
  const deleteNoteMut = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.getBySnippet.invalidate({ snippetId: snippetId! });
      toast.success("Nota eliminada");
    },
  });
  const aiChatMut = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setAiMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    },
    onError: () => toast.error("Error al comunicarse con la IA"),
  });

  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  // Load snippet data
  useEffect(() => {
    if (snippetQuery.data) {
      setTitle(snippetQuery.data.title);
      setLanguage(snippetQuery.data.language);
      setDescription(snippetQuery.data.description || "");
      setCode(snippetQuery.data.code);
    }
  }, [snippetQuery.data]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const state = EditorState.create({
      doc: code || "// Escribe tu código aquí\n",
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        langCompartment.current.of(getLanguageExtension(language)),
        codeVaultTheme,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const newCode = update.state.doc.toString();
            setCode(newCode);
            setHasUnsavedChanges(true);
          }
          // Track cursor line for notes
          if (update.selectionSet) {
            const line = update.state.doc.lineAt(update.state.selection.main.head).number;
            setSelectedLine(line);
          }
        }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Update editor content when snippet loads
  useEffect(() => {
    if (viewRef.current && snippetQuery.data?.code) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== snippetQuery.data.code) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: snippetQuery.data.code },
        });
      }
    }
  }, [snippetQuery.data?.code]);

  // Update language extension
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: langCompartment.current.reconfigure(getLanguageExtension(language)),
      });
    }
  }, [language]);

  const handleSave = useCallback(() => {
    if (isNew) {
      createMut.mutate({ title: title || "Sin título", code, language, description });
    } else {
      updateMut.mutate({ id: snippetId!, title, code, language, description });
    }
  }, [isNew, title, code, language, description, snippetId]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const handleAiSend = () => {
    if (!aiInput.trim() || aiChatMut.isPending) return;
    const msg = aiInput.trim();
    setAiMessages(prev => [...prev, { role: "user", content: msg }]);
    setAiInput("");
    aiChatMut.mutate({
      message: msg,
      snippetId: snippetId,
      context: code,
    });
  };

  const notesForLine = useMemo(() => {
    const map = new Map<number, typeof notesQuery.data>();
    notesQuery.data?.forEach(note => {
      const existing = map.get(note.lineNumber) || [];
      existing.push(note);
      map.set(note.lineNumber, existing);
    });
    return map;
  }, [notesQuery.data]);

  const linesWithNotes = useMemo(() => new Set(notesQuery.data?.map(n => n.lineNumber) || []), [notesQuery.data]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      {/* Top Bar */}
      <div className="h-14 border-b border-border/50 glass-strong flex items-center px-4 gap-3 shrink-0 relative z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            value={title}
            onChange={e => { setTitle(e.target.value); setHasUnsavedChanges(true); }}
            placeholder="Título del fragmento"
            className="bg-transparent border-none text-base font-medium h-9 px-2 focus-visible:ring-0 focus-visible:ring-offset-0 max-w-xs"
          />
          <Select value={language} onValueChange={v => { setLanguage(v); setHasUnsavedChanges(true); }}>
            <SelectTrigger className="w-[130px] h-8 bg-white/5 border-border/50 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-border/50">
              {LANGUAGES.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon" className={`h-8 w-8 ${notesPanel ? "bg-primary/15 text-primary" : ""}`}
                onClick={() => { setNotesPanel(!notesPanel); if (!notesPanel) setAiPanel(false); }}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notas</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon" className={`h-8 w-8 ${aiPanel ? "bg-primary/15 text-primary" : ""}`}
                onClick={() => { setAiPanel(!aiPanel); if (!aiPanel) setNotesPanel(false); }}
              >
                <Bot className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Asistente IA</TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createMut.isPending || updateMut.isPending}
            className={`h-8 ${hasUnsavedChanges ? "bg-primary hover:bg-primary/90 glow-primary-sm" : "bg-primary/50"}`}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {createMut.isPending || updateMut.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Description bar */}
          <div className="px-4 py-2 border-b border-border/30 bg-black/10">
            <Input
              value={description}
              onChange={e => { setDescription(e.target.value); setHasUnsavedChanges(true); }}
              placeholder="Descripción del fragmento (opcional)"
              className="bg-transparent border-none text-xs text-muted-foreground h-7 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {/* CodeMirror container */}
          <div className="flex-1 overflow-auto">
            <div ref={editorRef} className="h-full" />
          </div>
          {/* Status bar */}
          <div className="h-7 border-t border-border/30 bg-black/10 flex items-center px-4 text-[10px] text-muted-foreground/60 gap-4">
            <span>Línea {selectedLine || 1}</span>
            <span>{code.split("\n").length} líneas</span>
            <span>{code.length} caracteres</span>
            <span className="capitalize">{language}</span>
            {hasUnsavedChanges && <span className="text-yellow-500/70">Sin guardar</span>}
          </div>
        </div>

        {/* Notes Panel */}
        <AnimatePresence>
          {notesPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border/50 glass-strong flex flex-col overflow-hidden shrink-0"
            >
              <div className="p-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Notas</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {selectedLine ? `Línea ${selectedLine}` : "Selecciona una línea"}
                </span>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {notesQuery.data && notesQuery.data.length > 0 ? (
                    notesQuery.data.map(note => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass rounded-lg p-3 group transition-all ${
                          note.lineNumber === selectedLine ? "ring-1 ring-primary/30 bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-[10px] font-mono text-primary/70">Línea {note.lineNumber}</span>
                          <Button
                            variant="ghost" size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={() => deleteNoteMut.mutate({ id: note.id })}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{note.content}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/50">Sin notas aún</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-1">Haz clic en una línea y añade una nota</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              {/* Add note input */}
              {selectedLine && snippetId && (
                <div className="p-3 border-t border-border/50">
                  <div className="text-[10px] text-muted-foreground mb-1.5">Nota para línea {selectedLine}</div>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      if (noteInput.trim()) {
                        upsertNoteMut.mutate({ snippetId: snippetId!, lineNumber: selectedLine, content: noteInput.trim() });
                      }
                    }}
                    className="flex gap-2"
                  >
                    <Textarea
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      placeholder="Escribe una nota..."
                      className="flex-1 bg-white/5 border-border/50 text-xs min-h-[60px] resize-none"
                      rows={2}
                    />
                    <Button type="submit" size="icon" disabled={!noteInput.trim() || upsertNoteMut.isPending} className="h-[60px] w-9 bg-primary hover:bg-primary/90 glow-primary-sm shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Panel */}
        <AnimatePresence>
          {aiPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border/50 glass-strong flex flex-col overflow-hidden shrink-0"
            >
              <div className="p-3 border-b border-border/50 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center glow-primary-sm">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-medium">CodeVault AI</span>
                  <p className="text-[10px] text-muted-foreground">Analiza tu código actual</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-3">
                {aiMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 text-primary/20 mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground mb-3">Pregunta sobre tu código</p>
                    <div className="space-y-1.5">
                      {["Explica este código", "Sugiere mejoras", "Encuentra errores", "Documenta las funciones"].map(prompt => (
                        <button
                          key={prompt}
                          onClick={() => setAiInput(prompt)}
                          className="block w-full text-left text-[11px] px-3 py-1.5 glass rounded-lg hover:bg-white/[0.04] transition-colors text-muted-foreground"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-3 h-3 text-primary" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                          msg.role === "user" ? "bg-primary text-primary-foreground" : "glass"
                        }`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-xs prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, "<br/>") }} />
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {aiChatMut.isPending && (
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                        </div>
                        <div className="glass rounded-lg px-3 py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t border-border/50">
                <form onSubmit={e => { e.preventDefault(); handleAiSend(); }} className="flex gap-2">
                  <Input
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    placeholder="Pregunta sobre tu código..."
                    className="flex-1 bg-white/5 border-border/50 text-xs h-8"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSend(); } }}
                  />
                  <Button type="submit" size="icon" disabled={!aiInput.trim() || aiChatMut.isPending} className="h-8 w-8 bg-primary hover:bg-primary/90 glow-primary-sm shrink-0">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
