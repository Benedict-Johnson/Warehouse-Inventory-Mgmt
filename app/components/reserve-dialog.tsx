import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InventoryItem, Product, Reservation } from "@/lib/types";

interface ReserveDialogProps {
  product: Product;
  inventory: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reservation: Reservation) => void;
}

export function ReserveDialog({ product, inventory, isOpen, onClose, onSuccess }: ReserveDialogProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: inventory.id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Error 409: Exceeding stock available. Try a different location.");
        }
        throw new Error(data.message || "Failed to reserve");
      }

      onSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg sm:rounded-2xl">
        <h2 className="text-xl font-semibold mb-2">Reserve {product.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          From {inventory.warehouseName} ({inventory.availableUnits} available)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-1">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || quantity < 1}>
              {loading ? "Reserving..." : "Confirm Reservation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
