"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Credenciales inválidas");
        return;
      }
      const next = sp.get("next");
      if (next) router.replace(next);
      else if (data.role === "ADMIN") router.replace("/admin");
      else if (data.role === "GUARD") router.replace("/guard");
      else router.replace("/user");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(email: string, password: string) {
    setEmail(email);
    setPassword(password);
  }

  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
            S
          </div>
          <div>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription className="text-[11px] uppercase tracking-[0.2em]">
              S.I.G.T.E.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="admin@sigte.cl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <LogIn />
                Ingresar
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Registrate
            </Link>
          </p>
        </CardContent>
      </form>
      <Separator />
      <CardFooter className="flex-col items-stretch pt-0">
        <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Credenciales demo
        </p>
        <div className="grid gap-1.5 text-xs">
          <DemoRow role="Admin" email="admin@sigte.cl" pw="admin123" onClick={fillDemo} />
          <DemoRow role="Guardia" email="guardia@sigte.cl" pw="guard123" onClick={fillDemo} />
          <DemoRow role="Usuario" email="user@sigte.cl" pw="user123" onClick={fillDemo} />
        </div>
      </CardFooter>
    </>
  );
}

function DemoRow({
  role,
  email,
  pw,
  onClick,
}: {
  role: string;
  email: string;
  pw: string;
  onClick: (email: string, pw: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(email, pw)}
      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent text-left transition-colors"
    >
      <span className="font-medium">{role}</span>
      <span className="text-muted-foreground font-mono">{email}</span>
    </button>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center p-6 bg-background grain">
      <Card className="w-full max-w-sm">
        <Suspense fallback={<CardHeader><CardTitle>Cargando...</CardTitle></CardHeader>}>
          <LoginForm />
        </Suspense>
      </Card>
    </main>
  );
}
