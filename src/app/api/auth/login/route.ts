import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  setSessionCookie,
  setRefreshCookie,
  signToken,
  signRefreshToken,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, schema);
  if (!parsed.ok) return parsed.response;

  const { email, password } = parsed.data;

  // MODO DEMO: Permitir acceso sin base de datos para credenciales específicas
  const DEMO_USERS: Record<string, { password: string; name: string; role: "ADMIN" | "GUARD" | "USER"; id: string }> = {
    "admin@sigte.cl": { password: "password123", name: "Administrador Demo", role: "ADMIN", id: "demo-admin" },
    "guard@sigte.cl": { password: "password123", name: "Guardia Demo", role: "GUARD", id: "demo-guard" },
    "user@sigte.cl": { password: "password123", name: "Usuario Demo", role: "USER", id: "demo-user" },
  };

  const demoUser = DEMO_USERS[email.toLowerCase()];
  if (demoUser && demoUser.password === password) {
    const token = await signToken({
      sub: demoUser.id,
      email: email.toLowerCase(),
      role: demoUser.role,
      name: demoUser.name,
    });
    const refreshToken = await signRefreshToken({
      sub: demoUser.id,
      email: email.toLowerCase(),
      role: demoUser.role,
      name: demoUser.name,
    });
    await setSessionCookie(token);
    await setRefreshCookie(refreshToken);

    return NextResponse.json({
      id: demoUser.id,
      email: email.toLowerCase(),
      name: demoUser.name,
      role: demoUser.role,
      token,
      refreshToken,
    });
  }

  // IMPORTANTE: Solo intentamos conectar con Prisma si NO es un usuario demo
  // Para evitar que la inicialización de Prisma lance errores antes de llegar aquí
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
// ...existing code...
// ...existing code...
    if (!user || !user.active) return jsonError(401, "Credenciales inválidas");

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return jsonError(401, "Credenciales inválidas");

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    const refreshToken = await signRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    await setSessionCookie(token);
    await setRefreshCookie(refreshToken);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
      refreshToken,
    });
  } catch (e) {
    if (demoUser) return jsonError(401, "Credenciales demo incorrectas");
    return jsonError(500, "Error de conexión con la base de datos");
  }
}
