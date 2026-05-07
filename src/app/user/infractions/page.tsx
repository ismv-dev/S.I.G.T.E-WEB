"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Smile } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Infraction = {
  id: string;
  type: string;
  description: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  vehicle: { plate: string };
  guard: { name: string };
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

export default function UserInfractions() {
  const [items, setItems] = useState<Infraction[]>([]);
  useEffect(() => {
    fetch("/api/infractions")
      .then((r) => r.json())
      .then((d) => setItems(d.infractions ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mis infracciones</h1>
        <p className="text-muted-foreground text-sm">Historial de fiscalización interna</p>
      </header>

      <div className="grid gap-3">
        {items.map((i) => (
          <Card key={i.id} className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-md bg-destructive/10 text-destructive grid place-items-center">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="font-mono tracking-tight">
                      {i.vehicle.plate}
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">{i.type}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">{i.description}</CardDescription>
                    <p className="text-xs text-muted-foreground mt-2">
                      Registrada por{" "}
                      <span className="text-foreground">{i.guard.name}</span>
                      {" · "}
                      {formatDate(i.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[i.status]}>{STATUS_LABEL[i.status]}</Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
        {items.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Smile className="mx-auto size-10 text-primary/60 mb-3" />
              <p className="font-medium text-foreground">Sin infracciones</p>
              <p className="text-sm">¡Bien hecho! Tu historial está limpio.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
