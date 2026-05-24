export interface InventoryItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  inventory: InventoryItem[];
}

export interface Reservation {
  id: string;
  inventoryId: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
