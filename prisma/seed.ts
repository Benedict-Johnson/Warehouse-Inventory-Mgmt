import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data first
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "CHS-001" },
      update: {},
      create: { name: "Chassis", sku: "CHS-001" },
    }),
    prisma.product.upsert({
      where: { sku: "ENG-002" },
      update: {},
      create: { name: "Engine", sku: "ENG-002" },
    }),
    prisma.product.upsert({
      where: { sku: "FAI-003" },
      update: {},
      create: { name: "Fairings", sku: "FAI-003" },
    }),
    prisma.product.upsert({
      where: { sku: "ECU-004" },
      update: {},
      create: { name: "ECU", sku: "ECU-004" },
    }),
  ]);

  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { id: "wh-lingarajapuram" },
      update: {},
      create: { id: "wh-lingarajapuram", name: "Lingarajapuram", location: "Bangalore" },
    }),
    prisma.warehouse.upsert({
      where: { id: "wh-kandigai" },
      update: {},
      create: { id: "wh-kandigai", name: "Kandigai", location: "Chennai" },
    }),
    prisma.warehouse.upsert({
      where: { id: "wh-whitefield" },
      update: {},
      create: { id: "wh-whitefield", name: "Whitefield", location: "Bangalore" },
    }),
    prisma.warehouse.upsert({
      where: { id: "wh-electronic-city" },
      update: {},
      create: { id: "wh-electronic-city", name: "Electronic City", location: "Bangalore" },
    }),
  ]);

  const inventoryData = [
    // Chassis
    { productId: products[0].id, warehouseId: warehouses[0].id, totalUnits: 15 },
    { productId: products[0].id, warehouseId: warehouses[1].id, totalUnits: 10 },
    { productId: products[0].id, warehouseId: warehouses[2].id, totalUnits: 5 },
    { productId: products[0].id, warehouseId: warehouses[3].id, totalUnits: 25 },
    
    // Engine
    { productId: products[1].id, warehouseId: warehouses[0].id, totalUnits: 8 },
    { productId: products[1].id, warehouseId: warehouses[1].id, totalUnits: 12 },
    { productId: products[1].id, warehouseId: warehouses[2].id, totalUnits: 20 },
    { productId: products[1].id, warehouseId: warehouses[3].id, totalUnits: 15 },
    
    // Fairings
    { productId: products[2].id, warehouseId: warehouses[0].id, totalUnits: 50 },
    { productId: products[2].id, warehouseId: warehouses[1].id, totalUnits: 45 },
    { productId: products[2].id, warehouseId: warehouses[2].id, totalUnits: 80 },
    { productId: products[2].id, warehouseId: warehouses[3].id, totalUnits: 60 },

    // ECU
    { productId: products[3].id, warehouseId: warehouses[0].id, totalUnits: 30 },
    { productId: products[3].id, warehouseId: warehouses[1].id, totalUnits: 25 },
    { productId: products[3].id, warehouseId: warehouses[2].id, totalUnits: 40 },
    { productId: products[3].id, warehouseId: warehouses[3].id, totalUnits: 35 },
  ];

  for (const inv of inventoryData) {
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: inv.productId,
          warehouseId: inv.warehouseId,
        },
      },
      update: { totalUnits: inv.totalUnits },
      create: inv,
    });
  }

  console.log(`Seeded: ${products.length} products, ${warehouses.length} warehouses, ${inventoryData.length} inventory records`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
