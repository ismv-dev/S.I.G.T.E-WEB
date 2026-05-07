import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Camera,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export default async function Home() {
  const session = await getSession();
  if (session) {
    if (session.role === "ADMIN") redirect("/admin");
    if (session.role === "GUARD") redirect("/guard");
    redirect("/user");
  }

  return (
    <main className="min-h-screen flex flex-col bg-background grain">
      <header className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
            S
          </div>
          <div>
            <h1 className="font-semibold leading-tight">S.I.G.T.E.</h1>
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              VanillaSoft · 2026
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              Registrarse
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <section className="flex-1 px-6 py-16 max-w-6xl mx-auto w-full">
        <Badge variant="outline" className="mb-5 gap-1.5 py-1.5 px-3">
          <Sparkles className="size-3.5 text-primary" />
          Hito 1 · Prototipo funcional
        </Badge>
        <h2 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
          Sistema Inteligente
          <br />
          de Gestión del{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tránsito y Estacionamiento
          </span>
        </h2>
        <p className="mt-6 text-muted-foreground max-w-2xl text-lg leading-relaxed">
          Plataforma web y móvil para automatizar el control vehicular del
          campus: reconocimiento de patentes, códigos QR, credencial universitaria,
          gestión por bloques y fiscalización en tiempo real.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Acceder al panel
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <Feature
            icon={<Camera className="size-5" />}
            title="Acceso multimodal"
            body="Validación por matrícula (LPR), código QR dinámico o credencial universitaria."
          />
          <Feature
            icon={<LayoutGrid className="size-5" />}
            title="Gestión por bloques"
            body="Ocupación en tiempo real por zona de estacionamiento, con asignación automática."
          />
          <Feature
            icon={<ShieldCheck className="size-5" />}
            title="Fiscalización digital"
            body="Registro y trazabilidad de infracciones con estados y notificaciones al dueño."
          />
        </div>

        <div className="mt-12 grid gap-3 md:grid-cols-4">
          <Stat label="Métodos de validación" value="3" />
          <Stat label="Roles diferenciados" value="3" />
          <Stat label="Bloques configurables" value="∞" />
          <Stat label="Latencia promedio" value="<200ms" />
        </div>
      </section>

      <footer className="px-6 py-6 border-t border-border text-center text-sm text-muted-foreground">
        <Zap className="inline size-3.5 mr-1 text-primary" />
        S.I.G.T.E. · VanillaSoft · Hito 1 · 2026
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="border-border/50 transition-colors hover:border-primary/50">
      <CardHeader>
        <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
          {icon}
        </div>
        <CardTitle className="mt-2">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
