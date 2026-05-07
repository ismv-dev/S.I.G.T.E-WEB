"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type Infraction = {
  id: string;
  type: string;
  description: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  vehicle: { id: string; plate: string };
  user: { id: string; name: string; email: string } | null;
  guard: { id: string; name: string };
};

const STATUS_VARIANT: Record<
  Infraction["status"],
  "destructive" | "warning" | "success" | "outline"
> = {
  OPEN: "destructive",
  ACKNOWLEDGED: "warning",
  RESOLVED: "success",
  DISMISSED: "outline",
};

const STATUS_LABEL: Record<Infraction["status"], string> = {
  OPEN: "Abierta",
  ACKNOWLEDGED: "Notificada",
  RESOLVED: "Resuelta",
  DISMISSED: "Descartada",
};

export default function AdminInfractions() {
  const [items, setItems] = useState<Infraction[]>([]);

  async function load() {
    const r = await fetch("/api/infractions").then((r) => r.json());
    setItems(r.infractions ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: Infraction["status"]) {
    const r = await fetch(`/api/infractions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!r.ok) return toast.error("Error al actualizar");
    toast.success("Estado actualizado");
    load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Infracciones</h1>
        <p className="text-muted-foreground text-sm">
          Gestión del ciclo de fiscalización interna
        </p>
      </header>

      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Patente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Dueño</TableHead>
                <TableHead>Guardia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[140px]">Cambiar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {formatDate(i.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono font-semibold">{i.vehicle.plate}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{i.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {i.description}
                  </TableCell>
                  <TableCell>{i.user?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{i.guard.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[i.status]}>
                      {STATUS_LABEL[i.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={i.status}
                      onValueChange={(v: Infraction["status"]) => setStatus(i.id, v)}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Abierta</SelectItem>
                        <SelectItem value="ACKNOWLEDGED">Notificada</SelectItem>
                        <SelectItem value="RESOLVED">Resuelta</SelectItem>
                        <SelectItem value="DISMISSED">Descartada</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    Sin infracciones
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
