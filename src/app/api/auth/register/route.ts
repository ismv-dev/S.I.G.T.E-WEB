import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie, signToken } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  universityId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, schema);
  if (!parsed.ok) return parsed.response;

  const { name, email, password, universityId } = parsed.data;
  const emailLower = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) return jsonError(409, "El email ya está registrado");

  if (universityId) {
    const collision = await prisma.user.findUnique({ where: { universityId } });
    if (collision) return jsonError(409, "La credencial universitaria ya existe");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: emailLower,
      passwordHash,
      name,
      universityId: universityId || null,
      role: "USER",
    },
  });

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token,
  });
}
