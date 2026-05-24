import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const warehouses = await prisma.warehouse.findMany({
    include: {
      inventory: {
        include: { product: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const data = warehouses.map((warehouse) => ({
    id: warehouse.id,
    name: warehouse.name,
    location: warehouse.location,
    inventory: warehouse.inventory.map((inv) => ({
      id: inv.id,
      productId: inv.productId,
      productName: inv.product.name,
      productSku: inv.product.sku,
      totalUnits: inv.totalUnits,
      reservedUnits: inv.reservedUnits,
      availableUnits: inv.totalUnits - inv.reservedUnits,
    })),
  }));

  return NextResponse.json(data);
}
