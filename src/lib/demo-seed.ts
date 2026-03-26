import { prisma } from "@/lib/prisma";

function monthStart(monthsBack: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function paymentDate(monthsBack: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(5);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function seedDemoData(ownerId: string): Promise<void> {
  const property = await prisma.property.create({
    data: {
      name: "Demo Kost Merdeka",
      address: "Jl. Merdeka No. 17, Jakarta",
      ownerId,
    },
  });

  const roomData = [
    { roomNumber: "101", monthlyRent: 1200000, status: "OCCUPIED" as const },
    { roomNumber: "102", monthlyRent: 1200000, status: "OCCUPIED" as const },
    { roomNumber: "103", monthlyRent: 1500000, status: "OCCUPIED" as const },
    { roomNumber: "104", monthlyRent: 1500000, status: "AVAILABLE" as const },
    { roomNumber: "201", monthlyRent: 1800000, status: "OCCUPIED" as const },
    { roomNumber: "202", monthlyRent: 1800000, status: "AVAILABLE" as const },
  ];

  const rooms = await Promise.all(
    roomData.map((r) =>
      prisma.room.create({
        data: {
          propertyId: property.id,
          roomNumber: r.roomNumber,
          monthlyRent: r.monthlyRent,
          status: r.status,
        },
      })
    )
  );

  const roomMap = Object.fromEntries(rooms.map((r) => [r.roomNumber, r]));

  const tenantData = [
    { name: "Budi Santoso", roomNumber: "101", movedInMonthsAgo: 6 },
    { name: "Siti Rahayu", roomNumber: "102", movedInMonthsAgo: 5 },
    { name: "Ahmad Fauzi", roomNumber: "103", movedInMonthsAgo: 8 },
    { name: "Dewi Lestari", roomNumber: "201", movedInMonthsAgo: 3 },
  ];

  await Promise.all(
    tenantData.map(async ({ name, roomNumber, movedInMonthsAgo }) => {
      const room = roomMap[roomNumber];
      const tenant = await prisma.tenant.create({
        data: {
          propertyId: property.id,
          roomId: room.id,
          name,
          movedInAt: monthStart(movedInMonthsAgo),
        },
      });

      await Promise.all(
        [3, 2, 1].map((monthsBack) =>
          prisma.payment.create({
            data: {
              tenantId: tenant.id,
              amount: room.monthlyRent,
              paymentDate: paymentDate(monthsBack),
            },
          })
        )
      );
    })
  );
}
