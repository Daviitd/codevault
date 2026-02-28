import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Code2, FileText, Search, FolderGit2, Sparkles, MessageSquare,
  ArrowRight, Braces, Terminal, Shield, Zap, Download
} from "lucide-react";
import { useEffect } from "react";

const features = [
  {
    icon: Code2,
    title: "Editor con Resaltado",
    description: "Editor de código con resaltado de sintaxis para JavaScript, Python, C++, y más.",
  },
  {
    icon: FileText,
    title: "Notas Línea por Línea",
    description: "Documenta cada línea de tu código con notas inteligentes y anotaciones.",
  },
  {
    icon: FolderGit2,
    title: "Organiza por Proyectos",
    description: "Agrupa tus fragmentos de código en proyectos y repositorios personalizados.",
  },
  {
    icon: Search,
    title: "Buscador Interno",
    description: "Encuentra cualquier fragmento de código por contenido, nombre o proyecto.",
  },
  {
    icon: Sparkles,
    title: "Asistente de IA",
    description: "IA integrada que explica, mejora y documenta tu código automáticamente.",
  },
  {
    icon: Download,
    title: "Sube Archivos",
    description: "Adjunta PDFs, imágenes y documentos a tus proyectos de código.",
  },
];

const codeExample = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calcular los primeros 10 números
for (let i = 0; i < 10; i++) {
  console.log(fibonacci(i));
}`;

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[oklch(0.7_0.2_200)]/5 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-primary/3 blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(oklch(1 0 0 / 10%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 10%) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 glass-strong"
      >
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center glow-primary-sm">
              <Braces className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">CodeVault</span>
          </div>
          <div className="flex items-center gap-3">
            {loading ? null : (
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-primary/90 hover:bg-primary text-primary-foreground glow-primary-hover transition-all duration-300"
              >
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 md:pt-32 md:pb-40">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Potenciado con Inteligencia Artificial</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            >
              <span className="gradient-text text-glow">CodeVault</span>
              <br />
              <span className="text-foreground/90">Tu repositorio con</span>
              <br />
              <span className="text-foreground/90">notas inteligentes</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Tu espacio personal para guardar código y documentarlo línea por línea.
              Organiza, busca y mejora tus fragmentos con un asistente de IA integrado.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-semibold glow-primary glow-primary-hover transition-all duration-300 group"
              >
                Sube tu primer código y empieza a anotarlo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>

          {/* Code Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="max-w-4xl mx-auto mt-20"
          >
            <div className="glass-strong rounded-2xl overflow-hidden gradient-border">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-muted-foreground ml-2 font-mono">fibonacci.js</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">JavaScript</span>
                </div>
              </div>
              <div className="flex">
                <div className="flex-1 p-4 overflow-x-auto">
                  <pre className="text-sm font-mono leading-7">
                    {codeExample.split("\n").map((line, i) => (
                      <div key={i} className="flex items-start group hover:bg-white/[0.02] -mx-2 px-2 rounded">
                        <span className="w-8 text-right mr-4 text-muted-foreground/40 select-none text-xs leading-7 shrink-0">
                          {i + 1}
                        </span>
                        <code className="text-foreground/80">{line || "\u00A0"}</code>
                      </div>
                    ))}
                  </pre>
                </div>
                <div className="w-64 border-l border-border/30 p-3 hidden md:block">
                  <div className="text-xs text-muted-foreground/60 mb-3 font-medium uppercase tracking-wider">Notas</div>
                  <div className="space-y-2">
                    <div className="glass rounded-lg p-2.5 text-xs text-muted-foreground">
                      <span className="text-primary/70 font-mono">L1:</span> Función recursiva clásica
                    </div>
                    <div className="glass rounded-lg p-2.5 text-xs text-muted-foreground">
                      <span className="text-primary/70 font-mono">L2:</span> Caso base de la recursión
                    </div>
                    <div className="glass rounded-lg p-2.5 text-xs text-muted-foreground">
                      <span className="text-[oklch(0.7_0.2_200)]/70 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> IA:
                      </span> Considera usar memoización para O(n)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas para <span className="gradient-text">tu código</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Herramientas diseñadas para que guardes, documentes y mejores tu código de forma eficiente.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-xl p-6 hover:bg-white/[0.04] transition-all duration-300 group glow-primary-hover"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cómo <span className="gradient-text">funciona</span>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-8">
            {[
              { step: "01", icon: Shield, title: "Inicia sesión", desc: "Crea tu cuenta y accede a tu repositorio privado de código." },
              { step: "02", icon: Terminal, title: "Sube tu código", desc: "Pega o escribe tu código en el editor con resaltado de sintaxis." },
              { step: "03", icon: MessageSquare, title: "Añade notas", desc: "Documenta cada línea con notas y deja que la IA te ayude." },
              { step: "04", icon: Zap, title: "Organiza y busca", desc: "Agrupa por proyectos y encuentra cualquier fragmento al instante." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex items-start gap-6 glass rounded-xl p-6"
              >
                <div className="text-3xl font-extrabold gradient-text shrink-0 w-12">{item.step}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-2xl p-12 md:p-16 text-center gradient-border"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Empieza a documentar tu código <span className="gradient-text">hoy</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Únete a CodeVault y transforma la forma en que guardas y entiendes tu código.
            </p>
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-semibold glow-primary glow-primary-hover transition-all duration-300"
            >
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Braces className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">CodeVault</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CodeVault. Tu código, tus notas, tu conocimiento.
          </p>
        </div>
      </footer>
    </div>
  );
}
