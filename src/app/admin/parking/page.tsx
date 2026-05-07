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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Info,
  LogOut,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Block = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  occupied: number;
  free: number;
  isDefault: boolean;
};

type Totals = { inside: number; capacity: number; free: number; defaultBlockId: string | null };

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

export default function AdminParking() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [form, setForm] = useState({ name: "", description: "", capacity: 10 });
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [blockVehicles, setBlockVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleDetail, setVehicleDetail] = useState<Vehicle | null>(null);
  const [moveTarget, setMoveTarget] = useState<Record<string, string>>({});

  async function load() {
    const r = await fetch("/api/parking").then((r) => r.json());
    setBlocks(r.blocks ?? []);
    setTotals(r.totals ?? null);
  }

  async function loadBlockVehicles(blockId: string) {
    setLoadingVehicles(true);
    try {
      const r = await fetch(`/api/vehicles?blockId=${blockId}`);
      const data = await r.json();
      setBlockVehicles(data.vehicles ?? []);
    } finally {
      setLoadingVehicles(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openBlock(b: Block) {
    setSelectedBlock(b);
    setVehicleSearch("");
    setMoveTarget({});
    setBlockVehicles([]);
    loadBlockVehicles(b.id);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setSelectedBlock(null);
    setVehicleDetail(null);
  }

  async function moveVehicle(vehicle: Vehicle, blockId: string) {
    const r = await fetch(`/api/vehicles/${vehicle.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId }),
    });
    const data = await r.json();
    if (!r.ok) return toast.error(data.error ?? "Error al mover");
    toast.success(`${vehicle.plate} → ${data.to}`);
    setBlockVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
    setMoveTarget((prev) => { const n = { ...prev }; delete n[vehicle.id]; return n; });
    setVehicleDetail(null);
    load();
  }

  async function registerExit(vehicle: Vehicle) {
    if (!confirm(`¿Registrar SALIDA de ${vehicle.plate}?`)) return;
    const r = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId: vehicle.id, method: "MANUAL", direction: "OUT" }),
    });
    const data = await r.json();
    if (!r.ok) return toast.error(data.error ?? "Error");
    toast.success(`${vehicle.plate} salió del estacionamiento`);
    setBlockVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
    setVehicleDetail(null);
    load();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/parking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, description: form.description || undefined, capacity: Number(form.capacity) }),
    });
    const data = await r.json();
    if (!r.ok) return toast.error(data.error ?? "Error");
    toast.success("Bloque creado");
    setForm({ name: "", description: "", capacity: 10 });
    load();
  }

  async function setDefault(b: Block) {
    const r = await fetch(`/api/parking/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (!r.ok) return toast.error("Error");
    toast.success(`${b.name} es ahora el bloque por defecto`);
    load();
  }

  async function rename(b: Block) {
    if (!newName.trim() || newName === b.name) { setEditingName(null); return; }
    const r = await fetch(`/api/parking/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!r.ok) { const e = await r.json(); toast.error(e.error ?? "Error"); }
    else toast.success("Nombre actualizado");
    setEditingName(null);
    load();
  }

  async function remove(b: Block) {
    if (!confirm(`¿Eliminar ${b.name}?`)) return;
    const r = await fetch(`/api/parking/${b.id}`, { method: "DELETE" });
    const data = await r.json();
    if (!r.ok) return toast.error(data.error ?? "Error");
    toast.success("Bloque eliminado");
    load();
  }

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return blockVehicles;
    const q = vehicleSearch.toUpperCase();
    return blockVehicles.filter(
      (v) =>
        v.plate.includes(q) ||
        v.owner.name.toUpperCase().includes(q) ||
        (v.owner.universityId ?? "").toUpperCase().includes(q) ||
        v.owner.email.toUpperCase().includes(q)
    );
  }, [blockVehicles, vehicleSearch]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Bloques de estacionamiento</h1>
        <p className="text-muted-foreground text-sm">
          Configuración de zonas y capacidad.{" "}
          <span className="text-foreground font-medium">Haz click en un bloque</span> para ver y gestionar los vehículos dentro.
        </p>
      </header>

      {totals && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ocupación general</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {totals.inside}
                <span className="text-muted-foreground text-lg"> / {totals.capacity}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cupos libres</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-[hsl(var(--success))]">
                {totals.free}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bloques activos</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{blocks.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nuevo bloque</CardTitle>
          <CardDescription>Creá una subdivisión lógica del estacionamiento</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="n">Nombre</Label>
              <Input id="n" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c">Capacidad</Label>
              <Input id="c" type="number" min={1} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full"><Plus />Crear</Button>
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="d">Descripción</Label>
              <Input id="d" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blocks.map((b) => {
          const pct = Math.round((b.occupied / b.capacity) * 100);
          const tone =
            pct > 80 ? "[&>div]:bg-destructive" :
            pct > 50 ? "[&>div]:bg-[hsl(var(--warning))]" :
            "[&>div]:bg-[hsl(var(--success))]";
          const isSelected = selectedBlock?.id === b.id && sheetOpen;
          return (
            <Card
              key={b.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/60 hover:shadow-md",
                b.isDefault ? "border-primary/50" : "",
                isSelected ? "ring-2 ring-primary border-primary" : ""
              )}
              onClick={() => openBlock(b)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                      {b.isDefault ? <Inbox className="size-4" /> : <CircleParking className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingName === b.id ? (
                        <Input
                          autoFocus
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onBlur={() => rename(b)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") rename(b);
                            if (e.key === "Escape") setEditingName(null);
                          }}
                          className="h-7 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <CardTitle
                          className="text-base truncate"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingName(b.id);
                            setNewName(b.name);
                          }}
                          title="Doble click para renombrar"
                        >
                          {b.name}
                        </CardTitle>
                      )}
                      {b.description && (
                        <CardDescription className="text-xs truncate">{b.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openBlock(b); }}>
                        <Car className="size-4" />
                        Ver vehículos
                      </DropdownMenuItem>
                      {!b.isDefault && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDefault(b); }}>
                          <Star className="size-4" />
                          Marcar como default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingName(b.id); setNewName(b.name); }}>
                        Renombrar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); remove(b); }}>
                        <Trash2 className="size-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {b.isDefault && (
                  <Badge variant="default" className="mt-2 gap-1 w-fit">
                    <Star className="size-3" />
                    Bloque por defecto
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold tabular-nums">{b.occupied}</span>
                    <span className="text-muted-foreground text-lg"> / {b.capacity}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className={`mt-2 ${tone}`} />
                <p className="text-xs text-muted-foreground mt-2">{b.free} cupos libres</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Sheet: vehículos del bloque seleccionado ── */}
      <Sheet open={sheetOpen} onOpenChange={(o) => { if (!o) closeSheet(); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto flex flex-col gap-0 p-0">
          {selectedBlock && (
            <>
              <SheetHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                      {selectedBlock.isDefault ? <Inbox className="size-5" /> : <CircleParking className="size-5" />}
                    </div>
                    <div>
                      <SheetTitle className="text-lg">{selectedBlock.name}</SheetTitle>
                      <SheetDescription className="text-xs">
                        {selectedBlock.occupied} de {selectedBlock.capacity} cupos · {selectedBlock.free} libres
                      </SheetDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => loadBlockVehicles(selectedBlock.id)}
                    title="Actualizar lista"
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </div>

                {/* Mini barra de ocupación */}
                {(() => {
                  const pct = Math.round((selectedBlock.occupied / selectedBlock.capacity) * 100);
                  const tone =
                    pct > 80 ? "[&>div]:bg-destructive" :
                    pct > 50 ? "[&>div]:bg-[hsl(var(--warning))]" :
                    "[&>div]:bg-[hsl(var(--success))]";
                  return <Progress value={pct} className={`mt-3 ${tone}`} />;
                })()}
              </SheetHeader>

              <div className="px-6 py-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Patente, nombre o credencial..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 px-6 py-4 space-y-3">
                {loadingVehicles ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-lg bg-muted/40 animate-pulse" />
                  ))
                ) : filteredVehicles.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Car className="mx-auto size-10 mb-3 opacity-30" />
                    <p className="font-medium">
                      {vehicleSearch ? `Sin resultados para "${vehicleSearch}"` : "No hay vehículos en este bloque"}
                    </p>
                  </div>
                ) : (
                  filteredVehicles.map((v) => (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      blocks={blocks.filter((b) => b.id !== v.currentBlock?.id)}
                      moveTarget={moveTarget[v.id] ?? ""}
                      onMoveTargetChange={(bid) =>
                        setMoveTarget((prev) => ({ ...prev, [v.id]: bid }))
                      }
                      onMove={() => moveTarget[v.id] && moveVehicle(v, moveTarget[v.id])}
                      onExit={() => registerExit(v)}
                      onInfo={() => setVehicleDetail(v)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Dialog: detalle completo de vehículo + dueño ── */}
      <VehicleDetailDialog
        vehicle={vehicleDetail}
        blocks={blocks.filter((b) => b.id !== vehicleDetail?.currentBlock?.id)}
        onClose={() => setVehicleDetail(null)}
        onMove={(blockId) => vehicleDetail && moveVehicle(vehicleDetail, blockId)}
        onExit={() => vehicleDetail && registerExit(vehicleDetail)}
      />
    </div>
  );
}

// ── VehicleCard dentro del Sheet ────────────────────────────────────────────────

function VehicleCard({
  vehicle,
  blocks,
  moveTarget,
  onMoveTargetChange,
  onMove,
  onExit,
  onInfo,
}: {
  vehicle: Vehicle;
  blocks: Block[];
  moveTarget: string;
  onMoveTargetChange: (id: string) => void;
  onMove: () => void;
  onExit: () => void;
  onInfo: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Fila superior: vehículo + acciones */}
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
          <Car className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-lg">{vehicle.plate}</span>
            {!vehicle.authorized && (
              <Badge variant="destructive" className="text-[10px]">NO AUTORIZADO</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(" · ") || "Sin datos del vehículo"}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={onInfo} title="Ver información completa">
            <Info className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExit} title="Registrar salida" className="text-destructive hover:text-destructive">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      {/* Dueño */}
      <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
        <UserIcon className="size-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{vehicle.owner.name}</p>
          <p className="text-xs text-muted-foreground truncate">{vehicle.owner.email}</p>
        </div>
        {vehicle.owner.universityId && (
          <span className="font-mono text-xs text-muted-foreground shrink-0">
            {vehicle.owner.universityId}
          </span>
        )}
      </div>

      {/* Reasignar bloque */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Reasignar bloque</p>
        <div className="flex gap-2">
          <Select value={moveTarget} onValueChange={onMoveTargetChange}>
            <SelectTrigger className="flex-1 h-8 text-sm">
              <SelectValue placeholder="Seleccionar destino…" />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((b) => (
                <SelectItem key={b.id} value={b.id} disabled={b.free <= 0}>
                  {b.name} · {b.free}/{b.capacity} libres
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={onMove}
            disabled={!moveTarget}
            className="shrink-0"
          >
            <ArrowLeftRight className="size-3.5" />
            Mover
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Dialog de detalle completo ──────────────────────────────────────────────────

function VehicleDetailDialog({
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
  const [target, setTarget] = useState("");
  useEffect(() => { setTarget(""); }, [vehicle]);

  if (!vehicle) return null;

  return (
    <Dialog open={!!vehicle} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-3xl tracking-tight">
            {vehicle.plate}
          </DialogTitle>
          <DialogDescription>
            {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Sin datos del vehículo"}
            {vehicle.color ? ` · ${vehicle.color}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Info vehículo */}
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
              Datos del vehículo
            </p>
            <InfoRow label="Patente" value={<span className="font-mono font-bold">{vehicle.plate}</span>} />
            <InfoRow label="Marca / Modelo" value={[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"} />
            <InfoRow label="Color" value={vehicle.color ?? "—"} />
            <InfoRow
              label="Autorización"
              value={
                <Badge variant={vehicle.authorized ? "success" : "destructive"}>
                  {vehicle.authorized ? "Autorizado" : "Bloqueado"}
                </Badge>
              }
            />
            <InfoRow
              label="Bloque actual"
              value={<Badge variant="secondary">{vehicle.currentBlock?.name ?? "—"}</Badge>}
            />
          </div>

          {/* Info dueño */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
              Datos del propietario
            </p>
            <InfoRow label="Nombre" value={<span className="font-medium">{vehicle.owner.name}</span>} />
            <InfoRow label="Email" value={<span className="text-muted-foreground">{vehicle.owner.email}</span>} />
            <InfoRow
              label="Credencial U"
              value={vehicle.owner.universityId
                ? <span className="font-mono">{vehicle.owner.universityId}</span>
                : <span className="text-muted-foreground">—</span>
              }
            />
            <InfoRow label="Rol" value={<Badge variant="outline">{vehicle.owner.role}</Badge>} />
          </div>

          {/* Mover */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Reasignar bloque
            </p>
            <div className="flex gap-2">
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar nuevo bloque…" />
                </SelectTrigger>
                <SelectContent>
                  {blocks.map((b) => (
                    <SelectItem key={b.id} value={b.id} disabled={b.free <= 0}>
                      {b.name} · {b.free}/{b.capacity} libres
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => target && onMove(target)} disabled={!target}>
                <ArrowLeftRight />
                Mover
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button variant="destructive" size="sm" onClick={onExit}>
            <LogOut className="size-4" />
            Registrar salida
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
