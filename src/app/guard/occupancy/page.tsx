"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftRight,
  Car,
  CircleParking,
  Inbox,
  Layers,
  LogOut,
  RefreshCw,
  Search,
  Star,
  User as UserIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type Block = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  occupied: number;
  free: number;
  isDefault: boolean;
};

type Totals = {
  inside: number;
  capacity: number;
  free: number;
  defaultBlockId: string | null;
};

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

export default function GuardLive() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [ts, setTs] = useState(Date.now());
  const [selected, setSelected] = useState<Vehicle | null>(null);

  async function loadAll() {
    const [p, v] = await Promise.all([
      fetch("/api/parking").then((r) => r.json()),
      fetch("/api/vehicles?inside=true").then((r) => r.json()),
    ]);
    setBlocks(p.blocks ?? []);
    setTotals(p.totals ?? null);
    setVehicles(v.vehicles ?? []);
    setTs(Date.now());
  }

  useEffect(() => {
    loadAll();
    const i = setInterval(loadAll, 5000);
    return () => clearInterval(i);
  }, []);

  const filtered = useMemo(() => {
    let list = vehicles;
    if (activeBlockId !== "ALL") {
      list = list.filter((v) => v.currentBlock?.id === activeBlockId);
    }
    if (search.trim()) {
      const q = search.toUpperCase();
      list = list.filter(
        (v) =>
          v.plate.includes(q) ||
          v.owner.name.toUpperCase().includes(q) ||
          (v.owner.universityId ?? "").toUpperCase().includes(q) ||
          v.owner.email.toUpperCase().includes(q)
      );
    }
    return list;
  }, [vehicles, activeBlockId, search]);

  async function moveVehicle(v: Vehicle, blockId: string) {
    const r = await fetch(`/api/vehicles/${v.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId }),
    });
    const data = await r.json();
    if (!r.ok) return toast.error(data.error ?? "Error");
    toast.success(`${v.plate} movido: ${data.from} → ${data.to}`);
    setSelected(null);
    loadAll();
  }

  async function registerExit(v: Vehicle) {
    if (!confirm(`¿Registrar SALIDA de ${v.plate}?`)) return;
    const r = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: v.id,
        method: "MANUAL",
        direction: "OUT",
      }),
    });
    const data = await r.json();
    if (!r.ok) return toast.error(data.error ?? "Error");
    toast.success(`${v.plate} salió del estacionamiento`);
    setSelected(null);
    loadAll();
  }

  const activeBlock = blocks.find((b) => b.id === activeBlockId) ?? null;
  const pctGlobal = totals && totals.capacity > 0
    ? Math.round((totals.inside / totals.capacity) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estacionamiento en vivo</h1>
          <p className="text-muted-foreground text-sm">
            Vehículos dentro del campus, agrupados por bloque
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <RefreshCw className="size-3" />
          {new Date(ts).toLocaleTimeString()}
        </Badge>
      </header>

      {/* CUENTA GENERAL */}
      {totals && (
        <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="uppercase tracking-wider text-xs">
                Cuenta general · tiempo real
              </CardDescription>
              <Layers className="size-4 text-primary" />
            </div>
            <div className="flex items-end gap-3">
              <div className="text-5xl font-bold tabular-nums">{totals.inside}</div>
              <div className="pb-2">
                <div className="text-muted-foreground">
                  de <span className="text-foreground font-medium">{totals.capacity}</span> capacidad
                </div>
                <div className="text-sm text-[hsl(var(--success))]">{totals.free} libres</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={pctGlobal} />
            <p className="text-xs text-muted-foreground mt-2">
              {pctGlobal}% de ocupación — suma de todos los bloques
            </p>
          </CardContent>
        </Card>
      )}

      {/* BLOQUES CLICKABLES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <BlockChip
          name="Todos"
          count={vehicles.length}
          capacity={totals?.capacity ?? 0}
          isActive={activeBlockId === "ALL"}
          onClick={() => setActiveBlockId("ALL")}
        />
        {blocks.map((b) => (
          <BlockChip
            key={b.id}
            name={b.name}
            count={b.occupied}
            capacity={b.capacity}
            isActive={activeBlockId === b.id}
            isDefault={b.isDefault}
            onClick={() => setActiveBlockId(b.id)}
          />
        ))}
      </div>

      {/* BARRA DE BÚSQUEDA + LISTA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                {activeBlockId === "ALL" ? (
                  <>
                    <Layers className="size-4 text-primary" />
                    Todos los vehículos dentro
                  </>
                ) : activeBlock?.isDefault ? (
                  <>
                    <Inbox className="size-4 text-primary" />
                    {activeBlock.name} · Sin asignar a un bloque específico
                  </>
                ) : (
                  <>
                    <CircleParking className="size-4 text-primary" />
                    {activeBlock?.name ?? "—"}
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {filtered.length} vehículo{filtered.length === 1 ? "" : "s"}
                {search ? ` · filtrado por "${search}"` : ""}
              </CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Patente o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Car className="mx-auto size-8 mb-2 opacity-50" />
              <p>No hay vehículos en esta vista.</p>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {filtered.map((v) => (
                <VehicleRow key={v.id} vehicle={v} onClick={() => setSelected(v)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG DETALLE + MOVER + SALIR */}
      <VehicleDialog
        vehicle={selected}
        blocks={blocks}
        onClose={() => setSelected(null)}
        onMove={(blockId) => selected && moveVehicle(selected, blockId)}
        onExit={() => selected && registerExit(selected)}
      />
    </div>
  );
}

function BlockChip({
  name,
  count,
  capacity,
  isActive,
  isDefault,
  onClick,
}: {
  name: string;
  count: number;
  capacity: number;
  isActive: boolean;
  isDefault?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-all",
        isActive
          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent"
      )}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{name}</span>
        {isDefault && <Star className="size-3 text-primary shrink-0" />}
      </div>
      <div className="text-2xl font-bold tabular-nums mt-0.5">
        {count}
        {capacity > 0 && <span className="text-muted-foreground text-sm"> / {capacity}</span>}
      </div>
    </button>
  );
}

function VehicleRow({ vehicle, onClick }: { vehicle: Vehicle; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
        <Car className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">{vehicle.plate}</span>
          {vehicle.currentBlock && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
              {vehicle.currentBlock.name}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {vehicle.owner.name}
          {vehicle.owner.universityId && (
            <span className="font-mono"> · {vehicle.owner.universityId}</span>
          )}
        </div>
      </div>
      {!vehicle.authorized && (
        <Badge variant="destructive" className="text-[10px]">
          BLOQ
        </Badge>
      )}
    </button>
  );
}

function VehicleDialog({
  vehicle,
  blocks,
  onClose,
  onMove,
  onExit,
}: {
  vehicle: Vehicle | null;
  blocks: Block[];
  onClose: () => void;
  onMove: (blockId: string) => void;
  onExit: () => void;
}) {
  const [target, setTarget] = useState<string>("");
  useEffect(() => {
    setTarget("");
  }, [vehicle]);

  return (
    <Dialog open={!!vehicle} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {vehicle && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-3xl tracking-tight">
                {vehicle.plate}
              </DialogTitle>
              <DialogDescription>
                {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"}
                {vehicle.color ? ` · ${vehicle.color}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{vehicle.owner.name}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.owner.email}</p>
                </div>
                <Badge variant="outline">{vehicle.owner.role}</Badge>
              </div>
              {vehicle.owner.universityId && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Credencial U</span>
                    <span className="font-mono">{vehicle.owner.universityId}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bloque actual</span>
                <Badge variant="secondary">{vehicle.currentBlock?.name ?? "—"}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Autorización</span>
                <Badge variant={vehicle.authorized ? "success" : "destructive"}>
                  {vehicle.authorized ? "Autorizado" : "Bloqueado"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Corregir bloque asignado
                </p>
                <Badge variant="outline" className="text-[10px]">
                  Actual: {vehicle.currentBlock?.name ?? "—"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar nuevo bloque…" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks
                      .filter((b) => b.id !== vehicle.currentBlock?.id)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id} disabled={b.free <= 0}>
                          {b.name} · {b.free}/{b.capacity} libres
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => target && onMove(target)} disabled={!target}>
                  <ArrowLeftRight />
                  Reasignar
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Reasignar solo mueve el vehículo de bloque; no registra entrada ni salida adicional.
              </p>
            </div>

            <DialogFooter>
              <Button variant="destructive" onClick={onExit}>
                <LogOut />
                Registrar salida
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
