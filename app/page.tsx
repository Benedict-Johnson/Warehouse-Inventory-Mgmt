/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { ProductList } from "./components/product-list";

// Force dynamic to always fetch latest stock on page load
export const dynamic = "force-dynamic";

async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      inventory: {
        include: { warehouse: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map((product: any) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    inventory: product.inventory.map((inv: any) => ({
      id: inv.id,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse.name,
      totalUnits: inv.totalUnits,
      reservedUnits: inv.reservedUnits,
      availableUnits: inv.totalUnits - inv.reservedUnits,
    })),
  }));
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="bg-background min-h-screen">
      <ProductList initialProducts={products} />
    </main>
  );
}
