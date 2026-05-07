"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, Timer } from "lucide-react";

type Vehicle = { id: string; plate: string };
type QRData = { token: string; dataUrl: string; vehicle: Vehicle; expiresAt: number };

const TTL_MS = 5 * 60_000;

export default function UserQR() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [qr, setQr] = useState<QRData | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => {
        setVehicles(d.vehicles ?? []);
        if (d.vehicles?.[0]) setSelected(d.vehicles[0].id);
      });
  }, []);

  useEffect(() => {
    if (!qr) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.round((qr.expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) setQr(null);
    }, 500);
    return () => clearInterval(t);
  }, [qr]);

  async function generate() {
    if (!selected) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/qr?vehicleId=${selected}`).then((r) => r.json());
      setQr(r);
    } finally {
      setLoading(false);
    }
  }

  const pct = qr ? Math.round((secondsLeft / (TTL_MS / 1000)) * 100) : 0;

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mi código QR de acceso</h1>
        <p className="text-muted-foreground text-sm">
          Generá un QR único por vehículo. Válido 5 minutos.
        </p>
      </header>

      {vehicles.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>
              Primero registrá un vehículo en la sección{" "}
              <span className="text-foreground font-medium">Mis vehículos</span>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="size-4 text-primary" />
              Generar código
            </CardTitle>
            <CardDescription>Elegí el vehículo para el cual generarás el QR</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Vehículo</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generate} disabled={loading || !selected} className="w-full" size="lg">
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <QrCode />
                  Generar QR
                </>
              )}
            </Button>

            {qr && (
              <div className="rounded-xl border bg-white p-6 flex flex-col items-center">
                <img src={qr.dataUrl} alt="QR" className="w-64 h-64" />
                <div className="mt-4 w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="gap-1 text-slate-900 border-slate-300">
                      <Timer className="size-3" />
                      {secondsLeft}s restantes
                    </Badge>
                    <Badge className="bg-slate-900 text-white">{qr.vehicle.plate}</Badge>
                  </div>
                  <Progress value={pct} className="bg-slate-200 [&>div]:bg-primary" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
