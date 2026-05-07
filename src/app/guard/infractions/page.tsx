"use client";

import { useEffect, useState } from "react";
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
import { ShieldAlert, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

const TYPES = [
  { k: "WRONG_BLOCK", l: "Estacionado en bloque equivocado" },
  { k: "UNAUTHORIZED_ENTRY", l: "Ingreso no autorizado" },
  { k: "DOUBLE_PARKING", l: "Doble fila" },
  { k: "EXPIRED_PERMIT", l: "Permiso expirado" },
  { k: "BLOCKING_ACCESS", l: "Bloqueando accesos" },
  { k: "SPEEDING", l: "Exceso de velocidad" },
  { k: "OTHER", l: "Otra" },
];

type Infraction = {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  vehicle: { plate: string };
  user: { name: string } | null;
};

export default function GuardInfractions() {
  const [items, setItems] = useState<Infraction[]>([]);
  const [form, setForm] = useState({ plate: "", type: "OTHER", description: "" });

  async function load() {
    const r = await fetch("/api/infractions").then((r) => r.json());
    setItems(r.infractions ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/infractions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await r.json();
    if (!r.ok) return toast.error(data.error ?? "Error");
    toast.success("Infracción registrada");
    setForm({ plate: "", type: "OTHER", description: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Registrar infracción</h1>
        <p className="text-muted-foreground text-sm">Fiscalización digital interna</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-primary" />
            Nueva infracción
          </CardTitle>
          <CardDescription>
            Se notificará automáticamente al dueño del vehículo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="p">Patente</Label>
              <Input
                id="p"
                required
                className="font-mono uppercase"
                placeholder="AABB12"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.k} value={t.k}>
                      {t.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="d">Descripción</Label>
              <textarea
                id="d"
                required
                minLength={3}
                className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">
                <Send />
                Registrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis últimos registros</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Patente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Dueño</TableHead>
                <TableHead>Estado</TableHead>
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
                  <TableCell>
                    <Badge variant="secondary">{i.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Sin registros
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
