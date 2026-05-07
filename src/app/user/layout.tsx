import Nav, { type NavItem } from "@/components/Nav";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const items: NavItem[] = [
  { href: "/user", label: "Inicio", icon: "Home" },
  { href: "/user/vehicles", label: "Mis vehículos", icon: "Car" },
  { href: "/user/qr", label: "QR de acceso", icon: "QrCode" },
  { href: "/user/infractions", label: "Infracciones", icon: "ShieldAlert" },
  { href: "/user/notifications", label: "Notificaciones", icon: "Bell" },
];

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-background md:flex">
      <Nav title="Mi panel" items={items} userName={session.name} userRole={session.role} />
      <main className="flex-1 p-4 md:p-8 md:pt-6 grain min-h-screen">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
