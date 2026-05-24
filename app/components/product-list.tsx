"use client";

import { useState, useCallback } from "react";
import { Product, InventoryItem, Reservation } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ReserveDialog } from "./reserve-dialog";
import { ReservationBanner } from "./reservation-banner";

import { RefreshCw } from "lucide-react";

interface ProductListProps {
  initialProducts: Product[];
}

export function ProductList({ initialProducts }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [reservedProductContext, setReservedProductContext] = useState<{
    productName: string;
    warehouseName: string;
  } | null>(null);

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    product: Product | null;
    inventory: InventoryItem | null;
  }>({
    isOpen: false,
    product: null,
    inventory: null,
  });

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Failed to fetch products:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReserveClick = (product: Product, inventory: InventoryItem) => {
    setDialogState({
      isOpen: true,
      product,
      inventory,
    });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleReservationSuccess = (reservation: Reservation) => {
    setActiveReservation(reservation);
    setReservedProductContext({
      productName: dialogState.product!.name,
      warehouseName: dialogState.inventory!.warehouseName,
    });
    closeDialog();
    refreshProducts();
  };

  const handleBannerCleared = () => {
    setActiveReservation(null);
    setReservedProductContext(null);
    refreshProducts();
  };

  return (
    <div className="relative min-h-screen pb-12 flex flex-col">
      {activeReservation && reservedProductContext && (
        <ReservationBanner
          reservation={activeReservation}
          productName={reservedProductContext.productName}
          warehouseName={reservedProductContext.warehouseName}
          onCleared={handleBannerCleared}
        />
      )}

      {/* Clean horizontal header with light orange accent */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto p-4 max-w-5xl flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ben&apos;s <span className="text-primary">Warehouse</span> Inventory
          </h1>
          <button 
            onClick={refreshProducts} 
            disabled={loading}
            aria-label="Refresh Data"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="container mx-auto p-4 max-w-5xl flex-1 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onReserveClick={handleReserveClick}
              disabled={!!activeReservation && activeReservation.status === "PENDING"}
            />
          ))}
        </div>

        {dialogState.isOpen && dialogState.product && dialogState.inventory && (
          <ReserveDialog
            product={dialogState.product}
            inventory={dialogState.inventory}
            isOpen={dialogState.isOpen}
            onClose={closeDialog}
            onSuccess={handleReservationSuccess}
          />
        )}
      </div>
    </div>
  );
}
