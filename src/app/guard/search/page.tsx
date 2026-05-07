"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  Database,
  Eye,
  MapPin,
  Search,
  User as UserIcon,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Vehicle = {
  id: string;
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
  authorized: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
    universityId: string | null;
  };
  currentBlock: { id: string; name: string } | null;
};

export default function GuardSearch() {
  const [scope, setScope] = useState<"inside" | "all">("inside");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      run();
    }, 250);
    return () => clearTimeout(t);
  }, [q, scope]);

  async function run() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (scope === "inside") params.set("inside", "true");
      const r = await fetch(`/api/vehicles?${params.toString()}`).then((r) => r.json());
      setResults(r.vehicles ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Buscar vehículos</h1>
        <p className="text-muted-foreground text-sm">
          Por patente, nombre del usuario, email o credencial universitaria
        </p>
      </header>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Tabs value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
            <TabsList className="grid w-full grid-cols-2 md:w-fit">
              <TabsTrigger value="inside">
                <Eye />
                En el estacionamiento ahora
              </TabsTrigger>
              <TabsTrigger value="all">
                <Database />
                Todos los registrados
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              autoFocus
              className="pl-9"
              placeholder={
                scope === "inside"
                  ? "Patente o nombre del dueño..."
                  : "Buscar en toda la base..."
              }
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {loading ? "Buscando..." : `${results.length} resultado${results.length === 1 ? "" : "s"}`}
          </CardTitle>
          <CardDescription>
            {scope === "inside"
              ? "Vehículos actualmente dentro del campus"
              : "Cualquier patente del sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 && !loading ? (
            <p className="text-center py-8 text-muted-foreground">
              {q ? "Sin coincidencias" : "Escribí algo para buscar…"}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {results.map((v) => (
                <ResultCard key={v.id} v={v} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultCard({ v }: { v: Vehicle }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
            <Car className="size-5" />
          </div>
          <div>
            <p className="font-mono font-bold text-lg">{v.plate}</p>
            <p className="text-xs text-muted-foreground">
              {[v.make, v.model].filter(Boolean).join(" ") || "Sin datos"}
              {v.color ? ` · ${v.color}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={v.authorized ? "success" : "destructive"} className="text-[10px]">
            {v.authorized ? "Autorizado" : "Bloqueado"}
          </Badge>
          {v.currentBlock ? (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <MapPin className="size-3" />
              {v.currentBlock.name}
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground">Fuera del campus</span>
          )}
        </div>
      </div>
      <Separator />
      <div className="flex items-center gap-2">
        <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{v.owner.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {v.owner.email}
            {v.owner.universityId && ` · ${v.owner.universityId}`}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {v.owner.role}
        </Badge>
      </div>
    </div>
  );
}
