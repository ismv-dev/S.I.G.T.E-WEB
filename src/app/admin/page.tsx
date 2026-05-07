"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ActivitySquare,
  ArrowUpRight,
  Car,
  CircleParking,
  Clock,
  Eye,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

type Dashboard = {
  metrics: {
    totalUsers: number;
    totalGuards: number;
    totalAdmins: number;
    totalVehicles: number;
    authorizedVehicles: number;
    totalBlocks: number;
    totalAccessLogs: number;
    accessToday: number;
    currentInside: number;
    openInfractions: number;
    infractionsLast7: number;
    avgDailyAccess: number;
    authRate: number;
    peakHour: string | null;
  };
  series: { date: string; in: number; out: number }[];
  occupancy: { id: string; name: string; capacity: number; occupied: number; percentage: number }[];
  topVehicles: { plate: string; owner: string; count: number }[];
  methodDist: Record<string, number>;
};

const chartConfig = {
  in: { label: "Ingresos", color: "hsl(var(--chart-2))" },
  out: { label: "Salidas", color: "hsl(var(--chart-1))" },
  capacity: { label: "Capacidad", color: "hsl(var(--muted))" },
  occupied: { label: "Ocupado", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const METHOD_LABELS: Record<string, string> = {
  PLATE: "Patente",
  QR: "Código QR",
  CARD: "Credencial",
  MANUAL: "Manual",
};
const METHOD_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
    const interval = setInterval(() => {
      fetch("/api/dashboard").then((r) => r.json()).then(setData);
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }
  const m = data.metrics;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de administración</h1>
          <p className="text-muted-foreground text-sm">
            Supervisión global del sistema en tiempo real
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Auto-refresh cada 10s
        </Badge>
      </header>

      {/* KPIs principales */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi
          icon={<Users className="size-4" />}
          label="Usuarios"
          value={m.totalUsers}
          hint={`+${m.totalGuards} guardias`}
        />
        <Kpi
          icon={<Car className="size-4" />}
          label="Vehículos"
          value={m.totalVehicles}
          hint={`${m.authorizedVehicles} autorizados`}
        />
        <Kpi
          icon={<ArrowUpRight className="size-4" />}
          label="Accesos hoy"
          value={m.accessToday}
          hint={`${m.totalAccessLogs} totales`}
        />
        <Kpi
          icon={<Eye className="size-4" />}
          label="Dentro ahora"
          value={m.currentInside}
          hint={`${m.totalBlocks} bloques`}
          accent
        />
        <Kpi
          icon={<ShieldAlert className="size-4" />}
          label="Abiertas"
          value={m.openInfractions}
          hint="Infracciones"
          tone={m.openInfractions > 0 ? "danger" : undefined}
        />
        <Kpi
          icon={<ActivitySquare className="size-4" />}
          label="7 días"
          value={m.infractionsLast7}
          hint="Infracciones nuevas"
        />
      </section>

      {/* KPIs secundarios */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          icon={<TrendingUp className="size-4" />}
          label="Promedio diario"
          value={m.avgDailyAccess}
          hint="Accesos · 7 días"
        />
        <Kpi
          icon={<ShieldCheck className="size-4" />}
          label="Tasa autorización"
          value={m.authRate}
          hint="% accesos válidos"
          tone={m.authRate < 95 ? "danger" : "success"}
          suffix="%"
        />
        <Kpi
          icon={<Clock className="size-4" />}
          label="Hora pico"
          value={0}
          hint={m.peakHour ?? "—"}
          rawLabel={m.peakHour ?? "—"}
        />
        <Kpi
          icon={<QrCode className="size-4" />}
          label="Total histórico"
          value={m.totalAccessLogs}
          hint={`${m.totalBlocks} bloques activos`}
        />
      </section>

      {/* Serie temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivitySquare className="size-4 text-primary" />
            Accesos · últimos 7 días
          </CardTitle>
          <CardDescription>
            Ingresos y salidas agregadas por día (todos los bloques)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full aspect-auto">
            <LineChart data={data.series} margin={{ left: 0, right: 16, top: 6 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={30} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="in"
                stroke="var(--color-in)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="out"
                stroke="var(--color-out)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Métodos de acceso */}
      {data.methodDist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="size-4 text-primary" />
              Métodos de acceso · últimos 7 días
            </CardTitle>
            <CardDescription>Distribución por tipo de validación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ChartContainer config={chartConfig} className="h-[180px] w-[180px] shrink-0 aspect-square">
                <PieChart>
                  <Pie
                    data={Object.entries(data.methodDist).map(([k, v]) => ({ name: METHOD_LABELS[k] ?? k, value: v }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {Object.keys(data.methodDist).map((_, i) => (
                      <Cell key={i} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                {Object.entries(data.methodDist).map(([method, count], i) => {
                  const total = Object.values(data.methodDist).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={method} className="flex items-center gap-3 rounded-lg border p-3">
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ background: METHOD_COLORS[i % METHOD_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{METHOD_LABELS[method] ?? method}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{count} accesos · {pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ocupación por bloque + Top vehículos */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleParking className="size-4 text-primary" />
              Ocupación por bloque
            </CardTitle>
            <CardDescription>Distribución de cupos en este momento</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full aspect-auto">
              <BarChart data={data.occupancy} margin={{ left: 0, right: 8, top: 6 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v: string) => v.replace("Bloque ", "")}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={30} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="capacity" fill="var(--color-capacity)" radius={6} />
                <Bar dataKey="occupied" fill="var(--color-occupied)" radius={6} />
              </BarChart>
            </ChartContainer>

            <div className="mt-6 space-y-3">
              {data.occupancy.map((b) => {
                const pct = b.percentage;
                const tone =
                  pct > 80
                    ? "[&>div]:bg-destructive"
                    : pct > 50
                    ? "[&>div]:bg-[hsl(var(--warning))]"
                    : "[&>div]:bg-[hsl(var(--success))]";
                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {b.occupied}/{b.capacity} · {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className={tone} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="size-4 text-primary" />
              Top vehículos · 7 días
            </CardTitle>
            <CardDescription>Mayor frecuencia de ingreso</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patente</TableHead>
                  <TableHead>Dueño</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topVehicles.map((v) => (
                  <TableRow key={v.plate}>
                    <TableCell className="font-mono">{v.plate}</TableCell>
                    <TableCell className="text-muted-foreground">{v.owner}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      <Badge variant="secondary">{v.count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {data.topVehicles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      Sin registros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
  accent,
  suffix,
  rawLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  tone?: "danger" | "success";
  accent?: boolean;
  suffix?: string;
  rawLabel?: string;
}) {
  const iconColor =
    tone === "danger" ? "text-destructive" :
    tone === "success" ? "text-[hsl(var(--success))]" :
    "text-primary";
  return (
    <Card
      className={
        accent
          ? "border-primary/30 bg-primary/5"
          : tone === "danger"
          ? "border-destructive/30"
          : ""
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] uppercase tracking-wide">{label}</span>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="text-3xl font-bold tabular-nums">
          {rawLabel ?? (value.toLocaleString() + (suffix ?? ""))}
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
    </Card>
  );
}
