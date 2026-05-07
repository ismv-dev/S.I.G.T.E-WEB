"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, UserX, UserCheck, Trash2 } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "GUARD" | "ADMIN";
  universityId: string | null;
  active: boolean;
  _count: { vehicles: number };
};

const roleVariant: Record<
  User["role"],
  "default" | "secondary" | "outline"
> = {
  ADMIN: "default",
  GUARD: "secondary",
  USER: "outline",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as User["role"],
    universityId: "",
  });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/users").then((r) => r.json());
    setUsers(r.users ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const data = await r.json();
    if (!r.ok) return toast.error(data.error ?? "Error");
    toast.success("Usuario creado");
    setShowNew(false);
    setNewUser({ name: "", email: "", password: "", role: "USER", universityId: "" });
    load();
  }

  async function patchUser(id: string, patch: Partial<User>) {
    const r = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) {
      const e = await r.json();
      return toast.error(e.error ?? "Error");
    }
    toast.success("Usuario actualizado");
    load();
  }

  async function remove(u: User) {
    if (!confirm(`¿Eliminar a ${u.name}?`)) return;
    const r = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (!r.ok) {
      const e = await r.json();
      return toast.error(e.error ?? "Error");
    }
    toast.success("Usuario eliminado");
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground text-sm">Gestión de perfiles y roles del sistema</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)}>
          <Plus />
          {showNew ? "Cancelar" : "Nuevo usuario"}
        </Button>
      </header>

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle>Crear usuario</CardTitle>
            <CardDescription>Completá los datos del nuevo perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">Contraseña</Label>
                <Input
                  id="pw"
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uid">Credencial U</Label>
                <Input
                  id="uid"
                  value={newUser.universityId}
                  onChange={(e) => setNewUser({ ...newUser, universityId: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Rol</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v: User["role"]) => setNewUser({ ...newUser, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Usuario</SelectItem>
                    <SelectItem value="GUARD">Guardia</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Crear usuario</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Credencial</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-center">Autos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {u.universityId ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v: User["role"]) => patchUser(u.id, { role: v })}
                      >
                        <SelectTrigger size="sm" className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="GUARD">GUARD</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {u._count.vehicles}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.active ? "success" : "outline"}>
                        {u.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => patchUser(u.id, { active: !u.active })}
                          >
                            {u.active ? <UserX /> : <UserCheck />}
                            {u.active ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => remove(u)}
                          >
                            <Trash2 />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
