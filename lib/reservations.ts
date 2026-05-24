import { prisma } from "@/lib/prisma";

const RESERVATION_TTL_MINUTES = 5;

interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  totalUnits: number;
  reservedUnits: number;
}

export class ReservationError extends Error {
  constructor(
    message: string,
    public code: "INSUFFICIENT_STOCK" | "RESERVATION_EXPIRED" | "INVALID_STATE" | "NOT_FOUND",
    public statusCode: number
  ) {
    super(message);
  }
}

export async function createReservation(inventoryId: string, quantity: number) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Inventory[]>`
      SELECT "id", "productId", "warehouseId", "totalUnits", "reservedUnits"
      FROM "Inventory"
      WHERE "id" = ${inventoryId}
      FOR UPDATE
    `;

    const inventory = rows[0];
    if (!inventory) {
      throw new ReservationError("Inventory not found", "NOT_FOUND", 404);
    }

    const available = inventory.totalUnits - inventory.reservedUnits;
    if (available < quantity) {
      throw new ReservationError(
        `Insufficient stock. Available: ${available}, Requested: ${quantity}`,
        "INSUFFICIENT_STOCK",
        409
      );
    }

    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

    const reservation = await tx.reservation.create({
      data: {
        inventoryId,
        quantity,
        status: "PENDING",
        expiresAt,
      },
    });

    await tx.inventory.update({
      where: { id: inventoryId },
      data: { reservedUnits: { increment: quantity } },
    });

    return reservation;
  }, { timeout: 10000 });
}

export async function confirmReservation(reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new ReservationError("Reservation not found", "NOT_FOUND", 404);
    }

    if (reservation.status !== "PENDING") {
      throw new ReservationError(
        `Reservation is already ${reservation.status.toLowerCase()}`,
        "INVALID_STATE",
        400
      );
    }

    if (reservation.expiresAt < new Date()) {
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: { reservedUnits: { decrement: reservation.quantity } },
      });

      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "RELEASED" },
      });

      throw new ReservationError("Reservation has expired", "RESERVATION_EXPIRED", 410);
    }

    const confirmed = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CONFIRMED" },
    });

    return confirmed;
  }, { timeout: 10000 });
}

export async function releaseReservation(reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new ReservationError("Reservation not found", "NOT_FOUND", 404);
    }

    if (reservation.status !== "PENDING") {
      throw new ReservationError(
        `Reservation is already ${reservation.status.toLowerCase()}`,
        "INVALID_STATE",
        400
      );
    }

    await tx.$queryRaw`
      SELECT "id" FROM "Inventory"
      WHERE "id" = ${reservation.inventoryId}
      FOR UPDATE
    `;

    await tx.inventory.update({
      where: { id: reservation.inventoryId },
      data: { reservedUnits: { decrement: reservation.quantity } },
    });

    const released = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "RELEASED" },
    });

    return released;
  }, { timeout: 10000 });
}
