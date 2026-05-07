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
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Log = {
  id: string;
  method: string;
  direction: "IN" | "OUT";
  timestamp: string;
  vehicle: { plate: string; owner: { name: string } | null };
  block: { name: string } | null;
};

export default function GuardHistory() {
  const [logs, setLogs] = useState<Log[]>([]);
  useEffect(() => {
    fetch("/api/access?limit=100")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Historial reciente</h1>
        <p className="text-muted-foreground text-sm">Últimos 100 accesos al campus</p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {formatDate(l.timestamp)}
                  </TableCell>
                  <TableCell className="font-mono font-semibold">{l.vehicle.plate}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {l.vehicle.owner?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.method}</Badge>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
