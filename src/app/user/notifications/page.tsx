"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

type N = { id: string; title: string; message: string; read: boolean; createdAt: string };

export default function UserNotifications() {
  const [items, setItems] = useState<N[]>([]);

  async function load() {
    const r = await fetch("/api/notifications").then((r) => r.json());
    setItems(r.notifications ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    const unread = items.filter((n) => !n.read).map((n) => n.id);
    if (unread.length === 0) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unread }),
    });
    load();
  }

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground text-sm">Alertas y actividad de tu cuenta</p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck />
          Marcar todas como leídas
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </header>

      <div className="grid gap-3">
        {items.map((n) => (
          <Card
            key={n.id}
            className={cn(
              "transition-colors",
              n.read ? "opacity-70" : "border-primary/40 bg-primary/[0.03]"
            )}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "size-9 rounded-md grid place-items-center shrink-0",
                    n.read
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/15 text-primary"
                  )}
                >
                  <Bell className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{n.title}</CardTitle>
                    {!n.read && (
                      <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                  <CardDescription className="mt-1">{n.message}</CardDescription>
                  <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
        {items.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Inbox className="mx-auto size-10 text-primary/60 mb-3" />
              <p className="font-medium text-foreground">Sin notificaciones</p>
              <p className="text-sm">Te avisaremos cuando haya novedades.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
