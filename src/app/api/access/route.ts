import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, parseJson, withAuth } from "@/lib/api";

/**
 * GET /api/access — últimos accesos (guardia / admin ven todo, usuario solo los suyos)
 */
export const GET = withAuth(async (req, { session }) => {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 500);

  const where: Record<string, unknown> = {};
  if (session.role === "USER") {
    where.vehicle = { ownerId: session.sub };
  }

  const logs = await prisma.accessLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
    include: {
      vehicle: { include: { owner: { select: { id: true, name: true } } } },
      guard: { select: { id: true, name: true } },
      block: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ logs });
});

const logSchema = z.object({
  plate: z.string().optional(),
  vehicleId: z.string().optional(),
  qrToken: z.string().optional(),
  universityId: z.string().optional(),
  method: z.enum(["PLATE", "QR", "CARD", "MANUAL"]),
  direction: z.enum(["IN", "OUT"]),
  blockId: z.string().optional(),
  note: z.string().optional(),
});

/**
 * POST /api/access — registra entrada o salida.
 *  - GUARD/ADMIN pueden registrar.
 *  - Si en IN no se especifica blockId, el vehículo cae en el bloque marcado isDefault.
 *  - En OUT: libera el bloque y baja la cuenta general.
 */
export const POST = withAuth(
  async (req, { session }) => {
    const parsed = await parseJson(req, logSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    let vehicle = null;
    if (body.vehicleId) {
      vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
    } else if (body.plate) {
      const plate = body.plate.toUpperCase().replace(/\s+/g, "");
      vehicle = await prisma.vehicle.findUnique({ where: { plate } });
    } else if (body.qrToken) {
      const parts = body.qrToken.split(":");
      if (parts[0] !== "sigte" || parts[1] !== "v1")
        return jsonError(400, "QR inválido");
      const vehicleId = parts[2];
      const issuedAt = parseInt(parts[3] ?? "0", 10);
      if (!vehicleId) return jsonError(400, "QR inválido");
      if (Date.now() - issuedAt > 5 * 60_000)
        return jsonError(400, "QR expirado (válido por 5 minutos)");
      vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    } else if (body.universityId) {
      const owner = await prisma.user.findUnique({ where: { universityId: body.universityId } });
      if (owner) {
        vehicle = await prisma.vehicle.findFirst({
          where: { ownerId: owner.id },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    if (!vehicle) return jsonError(404, "Vehículo no encontrado");
    if (session.role === "USER") return jsonError(403, "Solo un guardia puede registrar accesos");

    // Resolver bloque para IN: si no se especificó, usar el bloque default
    let blockToAssign: string | null | undefined = body.blockId;
    if (body.direction === "IN" && !blockToAssign) {
      const defaultBlock = await prisma.parkingBlock.findFirst({
        where: { isDefault: true },
      });
      blockToAssign = defaultBlock?.id;
    }

    const log = await prisma.accessLog.create({
      data: {
        vehicleId: vehicle.id,
        userId: vehicle.ownerId,
        guardId: session.sub,
        method: body.method,
        direction: body.direction,
        blockId: blockToAssign ?? null,
        authorized: vehicle.authorized,
        note: body.note,
      },
      include: {
        vehicle: { include: { owner: { select: { id: true, name: true, email: true } } } },
        block: true,
      },
    });

    // Actualiza ubicación del vehículo (la fuente de verdad para la cuenta general)
    if (body.direction === "IN") {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { currentBlockId: blockToAssign ?? null },
      });
    } else {
      // OUT: el vehículo queda fuera → cuenta general y bloque bajan
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { currentBlockId: null },
      });
    }

    if (vehicle.ownerId) {
      await prisma.notification.create({
        data: {
          userId: vehicle.ownerId,
          title: body.direction === "IN" ? "Ingreso registrado" : "Salida registrada",
          message:
            body.direction === "IN"
              ? `Vehículo ${vehicle.plate} ingresó al campus${log.block ? ` (${log.block.name})` : ""}.`
              : `Vehículo ${vehicle.plate} salió del campus.`,
        },
      });
    }

    return NextResponse.json({ log, authorized: vehicle.authorized }, { status: 201 });
  },
  { roles: ["GUARD", "ADMIN"] }
);
