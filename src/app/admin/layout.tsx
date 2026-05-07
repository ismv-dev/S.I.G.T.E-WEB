import Nav, { type NavItem } from "@/components/Nav";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const items: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Usuarios", icon: "Users" },
  { href: "/admin/vehicles", label: "Vehículos", icon: "Car" },
  { href: "/admin/parking", label: "Bloques", icon: "Squircle" },
  { href: "/admin/access", label: "Accesos", icon: "ScrollText" },
  { href: "/admin/infractions", label: "Infracciones", icon: "ShieldAlert" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-background md:flex">
      <Nav title="Administración" items={items} userName={session.name} userRole="ADMIN" />
      <main className="flex-1 p-4 md:p-8 md:pt-6 grain min-h-screen">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
