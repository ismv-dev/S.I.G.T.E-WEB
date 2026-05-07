"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Camera,
  CreditCard,
  Eye,
  Layers,
  LogIn,
  LogOut,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  ShieldX,
  Star,
} from "lucide-react";

type Vehicle = {
  id: string;
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
  authorized: boolean;
  owner: { id: string; name: string; email: string; universityId: string | null };
  currentBlock: { id: string; name: string } | null;
};
type Block = {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  free: number;
  isDefault: boolean;
};
type Totals = { inside: number; capacity: number; free: number; defaultBlockId: string | null };
type LookupResponse = { vehicle: Vehicle | null; openInfractions?: number };

export default function GuardAccess() {
  const [mode, setMode] = useState<"plate" | "qr" | "uid">("plate");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string>(""); // "" = usar default
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refreshParking();
  }, []);

  async function refreshParking() {
    const r = await fetch("/api/parking").then((r) => r.json());
    setBlocks(r.blocks ?? []);
    setTotals(r.totals ?? null);
  }

  async function lookup() {
    if (!query.trim()) return;
    const r = await fetch(
      `/api/access/lookup?${mode}=${encodeURIComponent(query.trim())}`
    ).then((r) => r.json());
    setResult(r);
    if (!r.vehicle) toast.error("Vehículo no encontrado en el sistema");
  }

  async function register(direction: "IN" | "OUT") {
    if (!result?.vehicle) return;
    setBusy(true);
    try {
      const r = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: result.vehicle.id,
          method: mode === "plate" ? "PLATE" : mode === "qr" ? "QR" : "CARD",
          direction,
          blockId: direction === "IN" ? selectedBlock || undefined : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "Error al registrar");
      } else {
        toast.success(direction === "IN" ? "Ingreso registrado" : "Salida registrada");
        setQuery("");
        setResult(null);
        refreshParking();
      }
    } finally {
      setBusy(false);
    }
  }

  const defaultBlock = blocks.find((b) => b.isDefault);
  const pctGlobal = totals && totals.capacity > 0
    ? Math.round((totals.inside / totals.capacity) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control de acceso</h1>
          <p className="text-muted-foreground text-sm">
            Validación por patente, código QR o credencial universitaria
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/guard/occupancy">
            <Eye />
            Ver estacionamiento en vivo
          </Link>
        </Button>
      </header>

      {/* CUENTA GENERAL en vivo */}
      {totals && (
        <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="uppercase tracking-wider text-xs">
                Vehículos dentro · tiempo real
              </CardDescription>
              <Layers className="size-4 text-primary" />
            </div>
            <div className="flex items-end gap-3">
              <div className="text-4xl font-bold tabular-nums">{totals.inside}</div>
              <div className="pb-1.5">
                <div className="text-muted-foreground text-sm">
                  de <span className="text-foreground font-medium">{totals.capacity}</span>
                  <span className="text-[hsl(var(--success))] ml-2">· {totals.free} libres</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={pctGlobal} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identificar vehículo</CardTitle>
          <CardDescription>Elegí el método y escaneá / ingresá el valor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as typeof mode);
              setResult(null);
              setQuery("");
            }}
          >
            <TabsList className="grid w-full grid-cols-3 md:w-fit">
              <TabsTrigger value="plate">
                <Camera />
                Patente
              </TabsTrigger>
              <TabsTrigger value="qr">
                <QrCode />
                QR
              </TabsTrigger>
              <TabsTrigger value="uid">
                <CreditCard />
                U-Card
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9 font-mono"
                placeholder={
                  mode === "plate"
                    ? "AABB12"
                    : mode === "qr"
                    ? "sigte:v1:..."
                    : "USR-2026-123"
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
              />
            </div>
            <Button onClick={lookup}>
              <Search />
              Buscar
            </Button>
          </div>

          {result?.vehicle && (
            <>
              <Separator />
              <VehicleCard
                vehicle={result.vehicle}
                openInfractions={result.openInfractions ?? 0}
                blocks={blocks}
                defaultBlock={defaultBlock}
                selectedBlock={selectedBlock}
                onBlockChange={setSelectedBlock}
                busy={busy}
                onIn={() => register("IN")}
                onOut={() => register("OUT")}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VehicleCard({
  vehicle,
  openInfractions,
  blocks,
  defaultBlock,
  selectedBlock,
  onBlockChange,
  busy,
  onIn,
  onOut,
}: {
  vehicle: Vehicle;
  openInfractions: number;
  blocks: Block[];
  defaultBlock?: Block;
  selectedBlock: string;
  onBlockChange: (id: string) => void;
  busy: boolean;
  onIn: () => void;
  onOut: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card/50 p-5 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-3xl font-bold tracking-tight">{vehicle.plate}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"}
            {vehicle.color ? ` · ${vehicle.color}` : ""}
          </p>
          <p className="text-sm mt-2">
            <span className="text-muted-foreground">Dueño: </span>
            <span className="font-medium">{vehicle.owner.name}</span>
            {vehicle.owner.universityId && (
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                ({vehicle.owner.universityId})
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge variant={vehicle.authorized ? "success" : "destructive"} className="gap-1">
            {vehicle.authorized ? <ShieldCheck className="size-3" /> : <ShieldX className="size-3" />}
            {vehicle.authorized ? "AUTORIZADO" : "BLOQUEADO"}
          </Badge>
          {vehicle.currentBlock && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="size-3" />
              {vehicle.currentBlock.name}
            </Badge>
          )}
          {openInfractions > 0 && (
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="size-3" />
              {openInfractions} infracción(es)
            </Badge>
          )}
        </div>
      </div>

      {!vehicle.currentBlock && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Bloque a asignar (opcional)
            </p>
            {defaultBlock && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Star className="size-3 text-primary" />
                Default: {defaultBlock.name}
              </Badge>
            )}
          </div>
          <Select value={selectedBlock} onValueChange={onBlockChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Usar default (${defaultBlock?.name ?? "No definido"})`} />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((b) => (
                <SelectItem key={b.id} value={b.id} disabled={b.free <= 0}>
                  {b.isDefault && "⭐ "}
                  {b.name} · {b.free}/{b.capacity} libres
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Si no elegís un bloque, el vehículo queda en{" "}
            <span className="text-foreground">{defaultBlock?.name ?? "el bloque default"}</span> y
            lo podés mover luego desde "Estacionamiento en vivo".
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={onIn}
          disabled={busy || !vehicle.authorized || !!vehicle.currentBlock}
          className="flex-1"
          size="lg"
        >
          <LogIn />
          Registrar ingreso
        </Button>
        <Button
          onClick={onOut}
          disabled={busy || !vehicle.currentBlock}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          <LogOut />
          Registrar salida
        </Button>
      </div>
    </div>
  );
}
