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
import { Car, MapPin, Plus, ShieldCheck, ShieldX, Trash2 } from "lucide-react";

type Vehicle = {
  id: string;
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
  authorized: boolean;
  currentBlock: { id: string; name: string } | null;
};

export default function UserVehicles() {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ plate: "", make: "", model: "", color: "" });

  async function load() {
    const r = await fetch("/api/vehicles").then((r) => r.json());
    setItems(r.vehicles ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plate: form.plate,
        make: form.make || undefined,
        model: form.model || undefined,
        color: form.color || undefined,
      }),
    });
    const data = await r.json();
    if (!r.ok) return toast.error(data.error ?? "Error");
    toast.success("Vehículo registrado");
    setForm({ plate: "", make: "", model: "", color: "" });
    load();
  }

  async function remove(v: Vehicle) {
    if (!confirm(`¿Eliminar ${v.plate}?`)) return;
    const r = await fetch(`/api/vehicles/${v.id}`, { method: "DELETE" });
    if (!r.ok) return toast.error("No se pudo eliminar");
    toast.success("Vehículo eliminado");
    load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mis vehículos</h1>
        <p className="text-muted-foreground text-sm">
          Patentes autorizadas para ingreso al campus
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Registrar vehículo</CardTitle>
          <CardDescription>Agregá los datos de tu patente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="p">Patente *</Label>
              <Input
                id="p"
                required
                className="font-mono uppercase"
                placeholder="AABB12"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mk">Marca</Label>
              <Input
                id="mk"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="md">Modelo</Label>
              <Input
                id="md"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl">Color</Label>
              <Input
                id="cl"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div className="md:col-span-4">
              <Button type="submit">
                <Plus />
                Registrar vehículo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((v) => (
          <Card key={v.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
                    <Car className="size-5" />
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold tracking-tight">{v.plate}</p>
                    <p className="text-sm text-muted-foreground">
                      {[v.make, v.model].filter(Boolean).join(" ") || "Sin datos"}
                      {v.color ? ` · ${v.color}` : ""}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(v)}>
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              <Badge variant={v.authorized ? "success" : "destructive"} className="gap-1">
                {v.authorized ? <ShieldCheck className="size-3" /> : <ShieldX className="size-3" />}
                {v.authorized ? "Autorizado" : "Bloqueado"}
              </Badge>
              {v.currentBlock && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="size-3" />
                  Dentro: {v.currentBlock.name}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-muted-foreground">Aún no registraste vehículos.</p>
        )}
      </div>
    </div>
  );
}
