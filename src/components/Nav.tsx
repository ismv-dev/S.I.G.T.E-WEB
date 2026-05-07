"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LogOut,
  Menu,
  LayoutDashboard,
  Users,
  Car,
  Squircle,
  ScrollText,
  ShieldAlert,
  Home,
  QrCode,
  Bell,
  Radio,
  MapPin,
  ShieldCheck,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export type NavItem = {
  href: string;
  label: string;
  icon?: keyof typeof ICONS;
};

const ICONS = {
  LayoutDashboard,
  Users,
  Car,
  Squircle,
  ScrollText,
  ShieldAlert,
  Home,
  QrCode,
  Bell,
  Radio,
  MapPin,
  ShieldCheck,
  Search,
};

export default function Nav({
  title,
  items,
  userName,
  userRole,
}: {
  title: string;
  items: NavItem[];
  userName: string;
  userRole: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Menú</SheetTitle>
                <SheetDescription>Navegación principal</SheetDescription>
              </SheetHeader>
              <NavBody
                title={title}
                items={items}
                userName={userName}
                userRole={userRole}
                onNavigate={() => setOpen(false)}
                onLogout={logout}
              />
            </SheetContent>
          </Sheet>
          <BrandMark small title={title} />
        </div>
        <Avatar size="sm">
          <AvatarFallback>{initials(userName)}</AvatarFallback>
        </Avatar>
      </header>

      <aside className="hidden md:flex md:w-64 md:sticky md:top-0 md:h-screen md:flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <NavBody
          title={title}
          items={items}
          userName={userName}
          userRole={userRole}
          onLogout={logout}
        />
      </aside>
    </>
  );
}

function NavBody({
  title,
  items,
  userName,
  userRole,
  onNavigate,
  onLogout,
}: {
  title: string;
  items: NavItem[];
  userName: string;
  userRole: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const path = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5">
        <BrandMark title={title} />
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const Icon = it.icon ? ICONS[it.icon] : undefined;
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              {Icon && <Icon className="size-4 shrink-0" />}
              <span>{it.label}</span>
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
        })}
      </nav>
      <Separator className="bg-sidebar-border" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/60">{userRole}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onLogout}
          >
            <LogOut className="size-3.5" />
            Cerrar sesión
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Cambiar tema"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )
            ) : null}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BrandMark({ title, small = false }: { title: string; small?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div
        className={cn(
          "grid place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold",
          small ? "size-7 text-sm" : "size-9"
        )}
      >
        S
      </div>
      <div className="leading-tight">
        <p className={cn("font-semibold", small ? "text-sm" : "")}>{title}</p>
        <p className="text-[10px] tracking-[0.2em] text-sidebar-foreground/50 uppercase">
          S.I.G.T.E.
        </p>
      </div>
    </Link>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
