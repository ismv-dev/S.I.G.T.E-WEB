import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJson, withAuth } from "@/lib/api";

const patchSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"]),
});

export const PATCH = withAuth<{ id: string }>(
  async (req, { params }) => {
    const parsed = await parseJson(req, patchSchema);
    if (!parsed.ok) return parsed.response;
    const infraction = await prisma.infraction.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ infraction });
  },
  { roles: ["GUARD", "ADMIN"] }
);
