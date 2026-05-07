"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Car, QrCode, ShieldAlert, ArrowUpRight } from "lucide-react";

type Metrics = {
  vehicles: number;
  accessToday: number;
  openInfractions: number;
  unreadNotifs: number;
};

export default function UserHome() {
  const [m, setM] = useState<Metrics | null>(null);
  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => setM(d.metrics));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>
        <p className="text-muted-foreground text-sm">Resumen de tu actividad en el campus</p>
      </header>

      {m && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi
            icon={<Car className="size-4" />}
            label="Mis vehículos"
            value={m.vehicles}
            href="/user/vehicles"
          />
          <Kpi
            icon={<ArrowUpRight className="size-4" />}
            label="Accesos hoy"
            value={m.accessToday}
          />
          <Kpi
            icon={<ShieldAlert className="size-4" />}
            label="Infracciones"
            value={m.openInfractions}
            href="/user/infractions"
            tone={m.openInfractions > 0 ? "danger" : undefined}
          />
          <Kpi
            icon={<Bell className="size-4" />}
            label="Notificaciones"
            value={m.unreadNotifs}
            href="/user/notifications"
            tone={m.unreadNotifs > 0 ? "warning" : undefined}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/user/qr">
          <Card className="transition-all hover:border-primary/50 hover:bg-accent/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
                  <QrCode className="size-5" />
                </div>
                <div className="flex-1">
                  <CardTitle>Generar mi QR</CardTitle>
                  <CardDescription>
                    Código válido por 5 minutos para presentar al guardia
                  </CardDescription>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/user/vehicles">
          <Card className="transition-all hover:border-primary/50 hover:bg-accent/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
                  <Car className="size-5" />
                </div>
                <div className="flex-1">
                  <CardTitle>Administrar vehículos</CardTitle>
                  <CardDescription>Registrá o editá tus patentes autorizadas</CardDescription>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
  tone?: "danger" | "warning";
}) {
  const body = (
    <Card
      className={
        tone === "danger"
          ? "border-destructive/30"
          : tone === "warning"
          ? "border-warning/30"
          : ""
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] uppercase tracking-wide">{label}</span>
          <span
            className={
              tone === "danger"
                ? "text-destructive"
                : tone === "warning"
                ? "text-[hsl(var(--warning))]"
                : "text-primary"
            }
          >
            {icon}
          </span>
        </div>
        <div className="text-3xl font-bold tabular-nums">{value}</div>
      </CardHeader>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
