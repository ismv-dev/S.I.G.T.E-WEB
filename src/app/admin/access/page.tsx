"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight, Camera, CreditCard, QrCode } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Log = {
  id: string;
  method: "PLATE" | "QR" | "CARD" | "MANUAL";
  direction: "IN" | "OUT";
  timestamp: string;
  authorized: boolean;
  note: string | null;
  vehicle: { id: string; plate: string; owner: { id: string; name: string } | null };
  guard: { id: string; name: string } | null;
  block: { id: string; name: string } | null;
};

const methodIcon = {
  PLATE: Camera,
  QR: QrCode,
  CARD: CreditCard,
  MANUAL: CreditCard,
};

export default function AdminAccess() {
  const [logs, setLogs] = useState<Log[]>([]);
  useEffect(() => {
    fetch("/api/access?limit=200")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Historial de accesos</h1>
        <p className="text-muted-foreground text-sm">
          Trazabilidad completa de ingresos y salidas al campus
        </p>
      </header>

      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Patente</TableHead>
                <TableHead>Dueño</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Bloque</TableHead>
                <TableHead>Guardia</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => {
                const Icon = methodIcon[l.method];
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {formatDate(l.timestamp)}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">{l.vehicle.plate}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.vehicle.owner?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Icon className="size-3" />
                        {l.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {l.direction === "IN" ? (
                        <Badge variant="success" className="gap-1">
                          <ArrowUpRight className="size-3" />
                          Ingreso
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="gap-1">
                          <ArrowDownRight className="size-3" />
                          Salida
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.block?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.guard?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={l.authorized ? "success" : "destructive"}>
                        {l.authorized ? "OK" : "Rechazado"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
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
