import Nav, { type NavItem } from "@/components/Nav";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const items: NavItem[] = [
  { href: "/guard", label: "Control de acceso", icon: "Radio" },
  { href: "/guard/occupancy", label: "Estacionamiento", icon: "MapPin" },
  { href: "/guard/search", label: "Buscar vehículo", icon: "Search" },
  { href: "/guard/infractions", label: "Infracciones", icon: "ShieldAlert" },
  { href: "/guard/history", label: "Historial", icon: "ScrollText" },
];

export default async function GuardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "GUARD" && session.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-background md:flex">
      <Nav title="Guardia" items={items} userName={session.name} userRole={session.role} />
      <main className="flex-1 p-4 md:p-8 md:pt-6 grain min-h-screen">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
