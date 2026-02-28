import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Braces, Plus, Search, FolderGit2, Code2, FileText, Sparkles,
  MoreVertical, Trash2, Edit3, Star, StarOff, LogOut, ChevronRight,
  Upload, File, Image, FileUp, X, Clock, Filter, Bot, Menu, PanelLeft,
} from "lucide-react";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";

const LANGUAGES = [
  "javascript", "typescript", "python", "cpp", "java", "go", "rust",
  "html", "css", "sql", "json", "markdown", "xml", "php", "ruby", "swift", "kotlin",
];

const LANG_COLORS: Record<string, string> = {
  javascript: "#f7df1e", typescript: "#3178c6", python: "#3776ab", cpp: "#00599c",
  java: "#ed8b00", go: "#00add8", rust: "#ce422b", html: "#e34c26",
  css: "#1572b6", sql: "#e38c00", json: "#292929", php: "#777bb4",
  ruby: "#cc342d", swift: "#fa7343", kotlin: "#7f52ff", markdown: "#083fa1", xml: "#f26522",
};

const PROJECT_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

type TabType = "snippets" | "files" | "ai";

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ tab?: string }>();
  const activeTab: TabType = (params.tab as TabType) || "snippets";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#6366f1");
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editProject, setEditProject] = useState<{ id: number; name: string; description: string; color: string } | null>(null);
  const [newSnippetOpen, setNewSnippetOpen] = useState(false);
  const [newSnippetTitle, setNewSnippetTitle] = useState("");
  const [newSnippetLang, setNewSnippetLang] = useState("javascript");
  const [newSnippetDesc, setNewSnippetDesc] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filterLang, setFilterLang] = useState<string>("");
  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Queries
  const projectsQuery = trpc.projects.list.useQuery(undefined, { enabled: isAuthenticated });
  const snippetsQuery = trpc.snippets.list.useQuery(
    selectedProjectId ? { projectId: selectedProjectId } : undefined,
    { enabled: isAuthenticated }
  );
  const searchResults = trpc.snippets.search.useQuery(
    { query: searchQuery, projectId: selectedProjectId },
    { enabled: isAuthenticated && searchQuery.length > 0 }
  );
  const filesQuery = trpc.files.list.useQuery(
    selectedProjectId ? { projectId: selectedProjectId } : undefined,
    { enabled: isAuthenticated && activeTab === "files" }
  );

  const utils = trpc.useUtils();

  // Mutations
  const createProjectMut = trpc.projects.create.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); setNewProjectOpen(false); setNewProjectName(""); setNewProjectDesc(""); toast.success("Proyecto creado"); },
  });
  const updateProjectMut = trpc.projects.update.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); setEditProjectOpen(false); toast.success("Proyecto actualizado"); },
  });
  const deleteProjectMut = trpc.projects.delete.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); utils.snippets.list.invalidate(); setSelectedProjectId(undefined); toast.success("Proyecto eliminado"); },
  });
  const createSnippetMut = trpc.snippets.create.useMutation({
    onSuccess: (data) => { utils.snippets.list.invalidate(); setNewSnippetOpen(false); setLocation(`/snippet/${data.id}`); toast.success("Fragmento creado"); },
  });
  const deleteSnippetMut = trpc.snippets.delete.useMutation({
    onSuccess: () => { utils.snippets.list.invalidate(); toast.success("Fragmento eliminado"); },
  });
  const toggleFavMut = trpc.snippets.update.useMutation({
    onSuccess: () => utils.snippets.list.invalidate(),
  });
  const uploadFileMut = trpc.files.upload.useMutation({
    onSuccess: () => { utils.files.list.invalidate(); setUploadOpen(false); toast.success("Archivo subido"); },
  });
  const deleteFileMut = trpc.files.delete.useMutation({
    onSuccess: () => { utils.files.list.invalidate(); toast.success("Archivo eliminado"); },
  });

  const displaySnippets = searchQuery.length > 0 ? (searchResults.data ?? []) : (snippetsQuery.data ?? []);
  const filteredSnippets = filterLang ? displaySnippets.filter(s => s.language === filterLang) : displaySnippets;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("El archivo no debe superar 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadFileMut.mutate({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        base64Data: base64,
        projectId: selectedProjectId ?? null,
      });
    };
    reader.readAsDataURL(file);
  };

  const selectedProject = projectsQuery.data?.find(p => p.id === selectedProjectId);

  const SidebarContent = () => (
    <>
      {/* Logo & User */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary-sm">
              <Braces className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm">CodeVault</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setMobileSidebar(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 glass rounded-lg p-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.name || "Usuario"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={logout}>
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 border-b border-border/50">
        <div className="space-y-1">
          {[
            { tab: "snippets" as TabType, icon: Code2, label: "Fragmentos" },
            { tab: "files" as TabType, icon: FileText, label: "Archivos" },
            { tab: "ai" as TabType, icon: Bot, label: "Asistente IA" },
          ].map(item => (
            <button
              key={item.tab}
              onClick={() => { setLocation(item.tab === "snippets" ? "/dashboard" : `/dashboard/${item.tab}`); setMobileSidebar(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                activeTab === item.tab
                  ? "bg-primary/15 text-primary glow-primary-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proyectos</span>
          <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-border/50">
              <DialogHeader>
                <DialogTitle>Nuevo Proyecto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Input
                  placeholder="Nombre del proyecto"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className="bg-white/5 border-border/50"
                />
                <Textarea
                  placeholder="Descripción (opcional)"
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  className="bg-white/5 border-border/50"
                  rows={2}
                />
                <div className="flex gap-2">
                  {PROJECT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewProjectColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${newProjectColor === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createProjectMut.mutate({ name: newProjectName, description: newProjectDesc, color: newProjectColor })}
                  disabled={!newProjectName.trim() || createProjectMut.isPending}
                  className="bg-primary hover:bg-primary/90 glow-primary-sm"
                >
                  Crear Proyecto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 pb-3">
            <button
              onClick={() => setSelectedProjectId(undefined)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                !selectedProjectId ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              Todos los fragmentos
            </button>
            {projectsQuery.data?.map(project => (
              <div key={project.id} className="group flex items-center">
                <button
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedProjectId === project.id ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color || "#6366f1" }} />
                  <span className="truncate">{project.name}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass-strong border-border/50">
                    <DropdownMenuItem onClick={() => { setEditProject({ id: project.id, name: project.name, description: project.description || "", color: project.color || "#6366f1" }); setEditProjectOpen(true); }}>
                      <Edit3 className="w-3.5 h-3.5 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteProjectMut.mutate({ id: project.id })}>
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/3 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[oklch(0.7_0.2_200)]/3 blur-[100px]" />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:relative z-50 lg:z-auto h-full w-[280px] glass-strong border-r border-border/50 flex flex-col shrink-0 transition-transform duration-300 ${
          mobileSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Bar */}
        <div className="h-14 border-b border-border/50 glass-strong flex items-center px-4 gap-3 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setMobileSidebar(true)}>
            <PanelLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fragmentos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-border/50 h-9"
              />
            </div>
            {activeTab === "snippets" && (
              <Select value={filterLang} onValueChange={v => setFilterLang(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[140px] h-9 bg-white/5 border-border/50">
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Lenguaje" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border/50">
                  <SelectItem value="all">Todos</SelectItem>
                  {LANGUAGES.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "snippets" && (
              <Dialog open={newSnippetOpen} onOpenChange={setNewSnippetOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 glow-primary-sm h-9">
                    <Plus className="w-4 h-4 mr-1.5" /> Nuevo
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-border/50">
                  <DialogHeader>
                    <DialogTitle>Nuevo Fragmento de Código</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <Input
                      placeholder="Título del fragmento"
                      value={newSnippetTitle}
                      onChange={e => setNewSnippetTitle(e.target.value)}
                      className="bg-white/5 border-border/50"
                    />
                    <Select value={newSnippetLang} onValueChange={setNewSnippetLang}>
                      <SelectTrigger className="bg-white/5 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-strong border-border/50">
                        {LANGUAGES.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Descripción (opcional)"
                      value={newSnippetDesc}
                      onChange={e => setNewSnippetDesc(e.target.value)}
                      className="bg-white/5 border-border/50"
                      rows={2}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createSnippetMut.mutate({
                        title: newSnippetTitle,
                        language: newSnippetLang,
                        description: newSnippetDesc,
                        code: `// ${newSnippetTitle}\n`,
                        projectId: selectedProjectId ?? null,
                      })}
                      disabled={!newSnippetTitle.trim() || createSnippetMut.isPending}
                      className="bg-primary hover:bg-primary/90 glow-primary-sm"
                    >
                      Crear Fragmento
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {activeTab === "files" && (
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 glow-primary-sm h-9">
                    <Upload className="w-4 h-4 mr-1.5" /> Subir
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-border/50">
                  <DialogHeader>
                    <DialogTitle>Subir Archivo</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <label className="flex flex-col items-center justify-center w-full h-40 glass rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                      <FileUp className="w-10 h-10 text-muted-foreground mb-3" />
                      <span className="text-sm text-muted-foreground">Arrastra o haz clic para seleccionar</span>
                      <span className="text-xs text-muted-foreground/60 mt-1">PDF, imágenes (máx. 10MB)</span>
                      <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg" onChange={handleFileUpload} />
                    </label>
                    {uploadFileMut.isPending && (
                      <div className="mt-3 text-center text-sm text-muted-foreground">Subiendo archivo...</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {selectedProject ? (
                  <>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedProject.color || "#6366f1" }} />
                    {selectedProject.name}
                  </>
                ) : (
                  activeTab === "snippets" ? "Todos los Fragmentos" :
                  activeTab === "files" ? "Archivos" :
                  "Asistente IA"
                )}
              </h1>
              {selectedProject?.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedProject.description}</p>
              )}
            </div>

            {/* Snippets Tab */}
            {activeTab === "snippets" && (
              <div className="space-y-3">
                {filteredSnippets.length === 0 ? (
                  <div className="glass rounded-xl p-12 text-center">
                    <Code2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-medium text-muted-foreground mb-2">
                      {searchQuery ? "Sin resultados" : "Sin fragmentos aún"}
                    </h3>
                    <p className="text-sm text-muted-foreground/60 mb-4">
                      {searchQuery ? "Intenta con otra búsqueda" : "Crea tu primer fragmento de código"}
                    </p>
                    {!searchQuery && (
                      <Button size="sm" className="bg-primary hover:bg-primary/90 glow-primary-sm" onClick={() => setNewSnippetOpen(true)}>
                        <Plus className="w-4 h-4 mr-1.5" /> Nuevo Fragmento
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredSnippets.map((snippet, i) => (
                    <motion.div
                      key={snippet.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass rounded-xl p-4 hover:bg-white/[0.04] transition-all group cursor-pointer glow-primary-hover"
                      onClick={() => setLocation(`/snippet/${snippet.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{snippet.title}</h3>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                              style={{
                                backgroundColor: `${LANG_COLORS[snippet.language] || "#666"}20`,
                                color: LANG_COLORS[snippet.language] || "#999",
                              }}
                            >
                              {snippet.language}
                            </span>
                          </div>
                          {snippet.description && (
                            <p className="text-xs text-muted-foreground truncate mb-2">{snippet.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(snippet.updatedAt).toLocaleDateString("es-ES")}
                            </span>
                            <span>{snippet.code.split("\n").length} líneas</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={e => { e.stopPropagation(); toggleFavMut.mutate({ id: snippet.id, isFavorite: !snippet.isFavorite }); }}
                          >
                            {snippet.isFavorite ? <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> : <StarOff className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={e => { e.stopPropagation(); deleteSnippetMut.mutate({ id: snippet.id }); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {/* Code preview */}
                      <div className="mt-3 bg-black/20 rounded-lg p-3 overflow-hidden">
                        <pre className="text-xs font-mono text-muted-foreground/70 line-clamp-3 whitespace-pre-wrap">
                          {snippet.code.slice(0, 200)}
                        </pre>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Files Tab */}
            {activeTab === "files" && (
              <div className="space-y-3">
                {(filesQuery.data ?? []).length === 0 ? (
                  <div className="glass rounded-xl p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-medium text-muted-foreground mb-2">Sin archivos aún</h3>
                    <p className="text-sm text-muted-foreground/60 mb-4">Sube PDFs, imágenes y documentos</p>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 glow-primary-sm" onClick={() => setUploadOpen(true)}>
                      <Upload className="w-4 h-4 mr-1.5" /> Subir Archivo
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filesQuery.data?.map((file, i) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass rounded-xl p-4 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                            {file.mimeType.startsWith("image/") ? <Image className="w-5 h-5 text-primary" /> : <File className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.filename}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {(file.fileSize / 1024).toFixed(1)} KB · {new Date(file.createdAt).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(file.url, "_blank")}>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteFileMut.mutate({ id: file.id })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Tab */}
            {activeTab === "ai" && <AIAssistantTab />}
          </div>
        </ScrollArea>
      </main>

      {/* Edit Project Dialog */}
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle>Editar Proyecto</DialogTitle>
          </DialogHeader>
          {editProject && (
            <div className="space-y-4 py-2">
              <Input
                placeholder="Nombre"
                value={editProject.name}
                onChange={e => setEditProject({ ...editProject, name: e.target.value })}
                className="bg-white/5 border-border/50"
              />
              <Textarea
                placeholder="Descripción"
                value={editProject.description}
                onChange={e => setEditProject({ ...editProject, description: e.target.value })}
                className="bg-white/5 border-border/50"
                rows={2}
              />
              <div className="flex gap-2">
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setEditProject({ ...editProject, color: c })}
                    className={`w-7 h-7 rounded-full transition-all ${editProject.color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => editProject && updateProjectMut.mutate({ id: editProject.id, name: editProject.name, description: editProject.description, color: editProject.color })}
              disabled={updateProjectMut.isPending}
              className="bg-primary hover:bg-primary/90 glow-primary-sm"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// AI Assistant Tab Component
function AIAssistantTab() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const chatMut = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    },
    onError: () => {
      toast.error("Error al comunicarse con la IA");
    },
  });

  const handleSend = () => {
    if (!input.trim() || chatMut.isPending) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    chatMut.mutate({ message: userMsg });
  };

  return (
    <div className="glass rounded-xl overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary-sm">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">CodeVault AI</h3>
            <p className="text-[10px] text-muted-foreground">Pregunta lo que quieras sobre programación</p>
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Sparkles className="w-16 h-16 text-primary/20 mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">Asistente de Programación</h3>
              <p className="text-sm text-muted-foreground/60 max-w-sm mb-6">
                Pregúntame sobre código, buenas prácticas, debugging o cualquier tema de programación.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {["¿Cómo funciona async/await?", "Explica los closures en JS", "Mejores prácticas en Python"].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="text-xs px-3 py-1.5 glass rounded-full hover:bg-white/[0.06] transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "glass"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, "<br/>") }} />
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {chatMut.isPending && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="glass rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t border-border/50">
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 bg-white/5 border-border/50"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <Button type="submit" disabled={!input.trim() || chatMut.isPending} className="bg-primary hover:bg-primary/90 glow-primary-sm">
              <Sparkles className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
