"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lock, MoreHorizontal, Search, Shield, Trash2 } from "lucide-react";

type Vehicle = {
  id: string;
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
  authorized: boolean;
  owner: { id: string; name: string; email: string };
  currentBlock: { id: string; name: string } | null;
};

export default function AdminVehicles() {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");

  async function load() {
    const q = search ? `?plate=${encodeURIComponent(search.toUpperCase())}` : "";
    const r = await fetch(`/api/vehicles${q}`).then((r) => r.json());
    setItems(r.vehicles ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function toggleAuth(v: Vehicle) {
    const r = await fetch(`/api/vehicles/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorized: !v.authorized }),
    });
    if (!r.ok) return toast.error("No se pudo actualizar");
    toast.success(v.authorized ? "Vehículo bloqueado" : "Vehículo autorizado");
    load();
  }

  async function remove(v: Vehicle) {
    if (!confirm(`¿Eliminar patente ${v.plate}?`)) return;
    const r = await fetch(`/api/vehicles/${v.id}`, { method: "DELETE" });
    if (!r.ok) return toast.error("No se pudo eliminar");
    toast.success("Vehículo eliminado");
    load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Vehículos</h1>
        <p className="text-muted-foreground text-sm">
          Registro completo del parque vehicular del campus
        </p>
      </header>

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9 font-mono uppercase"
            placeholder="Buscar patente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <Button onClick={load}>Buscar</Button>
      </div>

      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patente</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Dueño</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-semibold">{v.plate}</TableCell>
                  <TableCell>
                    {[v.make, v.model].filter(Boolean).join(" ") || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{v.color ?? "—"}</TableCell>
                  <TableCell>
                    <div className="font-medium">{v.owner.name}</div>
                    <div className="text-xs text-muted-foreground">{v.owner.email}</div>
                  </TableCell>
                  <TableCell>
                    {v.currentBlock ? (
                      <Badge variant="secondary">{v.currentBlock.name}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Fuera</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.authorized ? "success" : "destructive"}>
                      {v.authorized ? "Autorizado" : "Bloqueado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleAuth(v)}>
                          {v.authorized ? <Lock /> : <Shield />}
                          {v.authorized ? "Bloquear" : "Autorizar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => remove(v)}>
                          <Trash2 />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Sin vehículos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
