import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      inventory: {
        include: { warehouse: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const data = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    inventory: product.inventory.map((inv) => ({
      id: inv.id,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse.name,
      totalUnits: inv.totalUnits,
      reservedUnits: inv.reservedUnits,
      availableUnits: inv.totalUnits - inv.reservedUnits,
    })),
  }));

  return NextResponse.json(data);
}
