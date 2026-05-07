import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BASE = new Date("2026-05-06T12:00:00.000Z");

function ago(days: number, h: number, m = 0): Date {
  const d = new Date(BASE);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("→ Seeding S.I.G.T.E. demo data...");

  // ─── Bloques ─────────────────────────────────────────────────────────────────
  await prisma.parkingBlock.updateMany({ data: { isDefault: false } });

  const blockDefs = [
    { name: "No definido",      capacity: 200, description: "Bloque por defecto — asignar luego", isDefault: true },
    { name: "Bloque A · Norte", capacity: 15,  description: "Frente al casino — ingreso principal", isDefault: false },
    { name: "Bloque B · Sur",   capacity: 12,  description: "Junto al auditorio — zona cubierta",  isDefault: false },
    { name: "Bloque C · Este",  capacity: 20,  description: "Biblioteca central — doble fila",     isDefault: false },
    { name: "Bloque D · Oeste", capacity: 10,  description: "Sector funcionarios — acceso restringido", isDefault: false },
  ];

  const blockMap: Record<string, string> = {};
  for (const b of blockDefs) {
    const rec = await prisma.parkingBlock.upsert({
      where: { name: b.name },
      update: { capacity: b.capacity, description: b.description, isDefault: b.isDefault },
      create: b,
    });
    blockMap[b.name] = rec.id;
  }

  const bA = blockMap["Bloque A · Norte"];
  const bB = blockMap["Bloque B · Sur"];
  const bC = blockMap["Bloque C · Este"];
  const bD = blockMap["Bloque D · Oeste"];

  // ─── Usuarios ─────────────────────────────────────────────────────────────────
  const userDefs = [
    // Equipo
    { email: "admin@sigte.cl",    password: "admin123", name: "Alejandro Vera Espinoza",     role: "ADMIN" as const, universityId: "ADM-0001" },
    { email: "guardia@sigte.cl",  password: "guard123", name: "Carlos Guardia Soto",          role: "GUARD" as const, universityId: "GRD-0001" },
    { email: "guardia2@sigte.cl", password: "guard123", name: "María Vigía Rojas",            role: "GUARD" as const, universityId: "GRD-0002" },
    { email: "user@sigte.cl",     password: "user123",  name: "Juan Pablo González Astudillo",role: "USER"  as const, universityId: "USR-0001" },
    { email: "pedro@sigte.cl",    password: "user123",  name: "Pedro Fernández Araya",        role: "USER"  as const, universityId: "USR-0002" },
    { email: "jose@sigte.cl",     password: "user123",  name: "José Hidalgo Palacios",        role: "USER"  as const, universityId: "USR-0003" },
    { email: "nicolas@sigte.cl",  password: "user123",  name: "Nicolás Sepúlveda Cabello",    role: "USER"  as const, universityId: "USR-0004" },
    { email: "ismael@sigte.cl",   password: "user123",  name: "Ismael Galindo Acuña",         role: "USER"  as const, universityId: "USR-0005" },
    // Estudiantes adicionales
    { email: "andrea@sigte.cl",   password: "user123",  name: "Andrea López Contreras",       role: "USER"  as const, universityId: "USR-0006" },
    { email: "diego@sigte.cl",    password: "user123",  name: "Diego Muñoz Reyes",             role: "USER"  as const, universityId: "USR-0007" },
    { email: "camila@sigte.cl",   password: "user123",  name: "Camila Torres Vidal",           role: "USER"  as const, universityId: "USR-0008" },
    { email: "rodrigo@sigte.cl",  password: "user123",  name: "Rodrigo Salinas Pino",          role: "USER"  as const, universityId: "USR-0009" },
    { email: "valentina@sigte.cl",password: "user123",  name: "Valentina Rivas Moreno",        role: "USER"  as const, universityId: "USR-0010" },
    { email: "matias@sigte.cl",   password: "user123",  name: "Matías Pérez Fuentes",          role: "USER"  as const, universityId: "USR-0011" },
    { email: "barbara@sigte.cl",  password: "user123",  name: "Bárbara Castro Herrera",        role: "USER"  as const, universityId: "USR-0012" },
    { email: "fernando@sigte.cl", password: "user123",  name: "Fernando Ortega Campos",        role: "USER"  as const, universityId: "USR-0013" },
  ];

  const uMap: Record<string, string> = {};
  for (const u of userDefs) {
    const hash = await bcrypt.hash(u.password, 10);
    const rec = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: hash, name: u.name, role: u.role, universityId: u.universityId },
      create: { email: u.email, passwordHash: hash, name: u.name, role: u.role, universityId: u.universityId },
    });
    uMap[u.email] = rec.id;
  }

  const guard1 = uMap["guardia@sigte.cl"];
  const guard2 = uMap["guardia2@sigte.cl"];

  // ─── Vehículos ────────────────────────────────────────────────────────────────
  // plate, make, model, color, owner, authorized, currentBlock (null = outside)
  const vehicleDefs: {
    plate: string; make: string; model: string; color: string;
    owner: string; authorized: boolean; block: string | null;
  }[] = [
    // Juan Pablo González (2 vehículos)
    { plate: "AABB12", make: "Toyota",    model: "Yaris",      color: "Rojo",     owner: "user@sigte.cl",     authorized: true,  block: bC },
    { plate: "CCDD34", make: "Chevrolet", model: "Sail",       color: "Azul",     owner: "user@sigte.cl",     authorized: true,  block: null },
    // Pedro Fernández
    { plate: "EEFF56", make: "Nissan",    model: "Versa",      color: "Blanco",   owner: "pedro@sigte.cl",    authorized: true,  block: bA },
    // José Hidalgo
    { plate: "GGHH78", make: "Hyundai",   model: "Accent",     color: "Negro",    owner: "jose@sigte.cl",     authorized: true,  block: bB },
    // Nicolás Sepúlveda
    { plate: "JJKK90", make: "Kia",       model: "Rio",        color: "Gris",     owner: "nicolas@sigte.cl",  authorized: true,  block: bC },
    // Ismael Galindo
    { plate: "LLMM21", make: "Suzuki",    model: "Baleno",     color: "Blanco",   owner: "ismael@sigte.cl",   authorized: true,  block: bA },
    // Andrea López
    { plate: "NNPP43", make: "Mazda",     model: "Mazda 2",    color: "Rojo",     owner: "andrea@sigte.cl",   authorized: true,  block: bC },
    // Diego Muñoz
    { plate: "QQRR65", make: "Fiat",      model: "Cronos",     color: "Negro",    owner: "diego@sigte.cl",    authorized: true,  block: bB },
    // Camila Torres
    { plate: "SSTT87", make: "Renault",   model: "Kwid",       color: "Blanco",   owner: "camila@sigte.cl",   authorized: true,  block: bD },
    // Rodrigo Salinas
    { plate: "UUVV09", make: "Volkswagen",model: "Gol",        color: "Plateado", owner: "rodrigo@sigte.cl",  authorized: true,  block: bA },
    // Valentina Rivas
    { plate: "WWXX31", make: "Chevrolet", model: "Aveo",       color: "Azul",     owner: "valentina@sigte.cl",authorized: true,  block: bC },
    // Matías Pérez
    { plate: "YYZZ53", make: "Honda",     model: "Fit",        color: "Plateado", owner: "matias@sigte.cl",   authorized: true,  block: bD },
    // Bárbara Castro
    { plate: "BBCC75", make: "Kia",       model: "Morning",    color: "Blanco",   owner: "barbara@sigte.cl",  authorized: true,  block: bB },
    // Fernando Ortega
    { plate: "DDEE97", make: "Toyota",    model: "Corolla",    color: "Gris",     owner: "fernando@sigte.cl", authorized: true,  block: bC },
    // Vehículo no autorizado (para demo de infracción)
    { plate: "FFGG19", make: "Mitsubishi",model: "Lancer",     color: "Verde",    owner: "diego@sigte.cl",    authorized: false, block: null },
    // Vehículo extra Juan Pablo
    { plate: "HHII41", make: "Peugeot",   model: "208",        color: "Blanco",   owner: "jose@sigte.cl",     authorized: true,  block: bD },
  ];

  const vMap: Record<string, string> = {};
  for (const v of vehicleDefs) {
    const ownerId = uMap[v.owner];
    const rec = await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: { make: v.make, model: v.model, color: v.color, ownerId, authorized: v.authorized, currentBlockId: v.block },
      create: { plate: v.plate, make: v.make, model: v.model, color: v.color, ownerId, authorized: v.authorized, currentBlockId: v.block },
    });
    vMap[v.plate] = rec.id;
  }

  // ─── Logs de acceso ───────────────────────────────────────────────────────────
  await prisma.accessLog.deleteMany({});

  // Vehículos con historial activo (los que están dentro o tuvieron actividad reciente)
  const activeVehicles = [
    "AABB12","CCDD34","EEFF56","GGHH78","JJKK90",
    "LLMM21","NNPP43","QQRR65","SSTT87","UUVV09",
    "WWXX31","YYZZ53","BBCC75","DDEE97","HHII41",
  ];

  const methods: Array<"PLATE" | "QR" | "CARD" | "MANUAL"> = ["PLATE","PLATE","PLATE","QR","QR","CARD","MANUAL"];
  const guardIds = [guard1, guard2];

  // Días 1-29: pares IN/OUT completos (vehículos ya salieron)
  for (const plate of activeVehicles) {
    const vid = vMap[plate];
    const uid = vehicleDefs.find(v => v.plate === plate)!;
    const ownerId = uMap[uid.owner];
    const assignedBlock = uid.block ?? bA;

    // Cada vehículo tiene actividad 3-5 veces por semana en los últimos 29 días
    for (let day = 29; day >= 1; day--) {
      // Simula ~70% de días con actividad
      if (Math.random() > 0.70) continue;

      const inHour  = pick([7,7,8,8,8,9]);
      const inMin   = pick([15,20,30,35,40,45,50]);
      const outHour = pick([17,17,18,18,19]);
      const outMin  = pick([0,10,15,20,30,45]);
      const method  = pick(methods);
      const gid     = pick(guardIds);

      await prisma.accessLog.create({
        data: {
          vehicleId: vid,
          userId: ownerId,
          guardId: gid,
          method,
          direction: "IN",
          blockId: assignedBlock,
          timestamp: ago(day, inHour, inMin),
          authorized: true,
        },
      });
      await prisma.accessLog.create({
        data: {
          vehicleId: vid,
          userId: ownerId,
          guardId: gid,
          method,
          direction: "OUT",
          blockId: assignedBlock,
          timestamp: ago(day, outHour, outMin),
          authorized: true,
        },
      });
    }
  }

  // Hoy (día 0): solo IN en la mañana — están dentro
  const insideToday = vehicleDefs.filter(v => v.block !== null).map(v => v.plate);
  for (const plate of insideToday) {
    const vid = vMap[plate];
    const uid = vehicleDefs.find(v => v.plate === plate)!;
    const ownerId = uMap[uid.owner];
    const blockId = uid.block!;
    const inHour = pick([7,7,8,8,8,9]);
    const inMin  = pick([0,15,20,30,35,40]);
    await prisma.accessLog.create({
      data: {
        vehicleId: vid,
        userId: ownerId,
        guardId: pick(guardIds),
        method: pick(methods),
        direction: "IN",
        blockId,
        timestamp: ago(0, inHour, inMin),
        authorized: true,
      },
    });
  }

  // Algunos accesos rechazados para mostrar en historial
  for (let i = 0; i < 8; i++) {
    const day = Math.floor(Math.random() * 20) + 1;
    await prisma.accessLog.create({
      data: {
        vehicleId: vMap["FFGG19"],
        guardId: pick(guardIds),
        method: pick(["PLATE","MANUAL"] as Array<"PLATE"|"MANUAL">),
        direction: "IN",
        blockId: bA,
        timestamp: ago(day, pick([8,9,10,14,15]), pick([0,15,30])),
        authorized: false,
        note: "Vehículo no autorizado — acceso denegado",
      },
    });
  }

  // ─── Infracciones ─────────────────────────────────────────────────────────────
  await prisma.infraction.deleteMany({});

  const infractions = [
    {
      plate: "AABB12", guardEmail: "guardia@sigte.cl",
      type: "DOUBLE_PARKING" as const,
      description: "Vehículo estacionado en doble fila frente a Bloque A, bloqueando salida",
      status: "OPEN" as const,
      daysAgo: 0,
    },
    {
      plate: "GGHH78", guardEmail: "guardia2@sigte.cl",
      type: "WRONG_BLOCK" as const,
      description: "Vehículo estacionado en sector de funcionarios sin autorización",
      status: "ACKNOWLEDGED" as const,
      daysAgo: 2,
    },
    {
      plate: "FFGG19", guardEmail: "guardia@sigte.cl",
      type: "UNAUTHORIZED_ENTRY" as const,
      description: "Intento de ingreso con patente no registrada en el sistema",
      status: "RESOLVED" as const,
      daysAgo: 5,
    },
    {
      plate: "QQRR65", guardEmail: "guardia@sigte.cl",
      type: "BLOCKING_ACCESS" as const,
      description: "Vehículo bloqueando rampa de acceso peatonal en Bloque B",
      status: "OPEN" as const,
      daysAgo: 1,
    },
    {
      plate: "CCDD34", guardEmail: "guardia2@sigte.cl",
      type: "EXPIRED_PERMIT" as const,
      description: "Permiso vehicular vencido desde hace 15 días — notificar al propietario",
      status: "ACKNOWLEDGED" as const,
      daysAgo: 4,
    },
    {
      plate: "WWXX31", guardEmail: "guardia@sigte.cl",
      type: "SPEEDING" as const,
      description: "Vehículo circulando a velocidad excesiva en zona de peatones frente a biblioteca",
      status: "RESOLVED" as const,
      daysAgo: 8,
    },
    {
      plate: "NNPP43", guardEmail: "guardia2@sigte.cl",
      type: "WRONG_BLOCK" as const,
      description: "Vehículo ocupando lugar reservado sin credencial de acceso correspondiente",
      status: "DISMISSED" as const,
      daysAgo: 12,
    },
    {
      plate: "EEFF56", guardEmail: "guardia@sigte.cl",
      type: "OTHER" as const,
      description: "Vehículo con alarma activada por más de 20 minutos — se notificó al dueño",
      status: "RESOLVED" as const,
      daysAgo: 15,
    },
  ];

  for (const inf of infractions) {
    const vehicle = await prisma.vehicle.findUnique({ where: { plate: inf.plate } });
    if (!vehicle) continue;
    const ts = ago(inf.daysAgo, 10, 30);
    await prisma.infraction.create({
      data: {
        vehicleId: vehicle.id,
        userId: vehicle.ownerId,
        guardId: uMap[inf.guardEmail],
        type: inf.type,
        description: inf.description,
        status: inf.status,
        createdAt: ts,
        updatedAt: ts,
      },
    });
  }

  // ─── Notificaciones ───────────────────────────────────────────────────────────
  await prisma.notification.deleteMany({});

  const notifications = [
    { email: "user@sigte.cl",      title: "Infracción registrada",         message: "Se registró una infracción (Doble fila) para tu vehículo AABB12. Por favor comunícate con Seguridad.", read: false },
    { email: "user@sigte.cl",      title: "Bienvenido a S.I.G.T.E.",       message: "Tu cuenta fue creada exitosamente. Podés generar tu QR de acceso desde el panel.", read: true },
    { email: "pedro@sigte.cl",     title: "Bienvenido a S.I.G.T.E.",       message: "Tu cuenta fue creada exitosamente. Podés generar tu QR de acceso desde el panel.", read: true },
    { email: "jose@sigte.cl",      title: "Bienvenido a S.I.G.T.E.",       message: "Tu cuenta fue creada exitosamente. Podés generar tu QR de acceso desde el panel.", read: true },
    { email: "nicolas@sigte.cl",   title: "Bienvenido a S.I.G.T.E.",       message: "Tu cuenta fue creada. Registrá tu vehículo para obtener tu código QR de acceso.", read: false },
    { email: "ismael@sigte.cl",    title: "Bienvenido a S.I.G.T.E.",       message: "Tu cuenta fue creada. Registrá tu vehículo para obtener tu código QR de acceso.", read: false },
    { email: "gghh78@owner",       title: "Infracción — Bloque incorrecto", message: "Tu vehículo GGHH78 fue registrado en sector no autorizado. Estado: Notificado.", read: false },
    { email: "ccdd34@owner",       title: "Permiso próximo a vencer",       message: "El permiso de tu vehículo CCDD34 está vencido. Renovalo en Administración.", read: false },
    { email: "andrea@sigte.cl",    title: "Bienvenido a S.I.G.T.E.",       message: "Tu cuenta fue creada exitosamente. Podés generar tu QR de acceso desde el panel.", read: true },
    { email: "diego@sigte.cl",     title: "Vehículo no autorizado",         message: "Se detectó un intento de ingreso con tu vehículo FFGG19 que no tiene autorización activa.", read: false },
  ];

  // Solo insertamos notificaciones para emails que existen en uMap
  const validNotifs = notifications.filter(n => uMap[n.email]);
  for (const n of validNotifs) {
    await prisma.notification.create({
      data: { userId: uMap[n.email], title: n.title, message: n.message, read: n.read },
    });
  }

  // Notificación de infracción para dueño de GGHH78 (jose@sigte.cl)
  await prisma.notification.create({
    data: {
      userId: uMap["jose@sigte.cl"],
      title: "Infracción — Bloque incorrecto",
      message: "Tu vehículo GGHH78 fue registrado en sector no autorizado. Estado: Notificado.",
      read: false,
    },
  });
  // Notificación para dueño de CCDD34 (user@sigte.cl)
  await prisma.notification.create({
    data: {
      userId: uMap["user@sigte.cl"],
      title: "Permiso próximo a vencer",
      message: "El permiso de tu vehículo CCDD34 está vencido. Renovalo en Administración.",
      read: false,
    },
  });

  console.log("✓ Seed finalizado.");
  console.log(`  Bloques: ${blockDefs.length} | Usuarios: ${userDefs.length} | Vehículos: ${vehicleDefs.length}`);
  const logCount = await prisma.accessLog.count();
  const infrCount = await prisma.infraction.count();
  const notifCount = await prisma.notification.count();
  console.log(`  AccessLogs: ${logCount} | Infracciones: ${infrCount} | Notificaciones: ${notifCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
