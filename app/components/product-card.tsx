import { Product, InventoryItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  onReserveClick: (product: Product, inventory: InventoryItem) => void;
  disabled: boolean;
}

export function ProductCard({ product, onReserveClick, disabled }: ProductCardProps) {
  const totalAvailable = product.inventory.reduce((sum, inv) => sum + inv.availableUnits, 0);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl">{product.name}</CardTitle>
            <CardDescription className="font-mono mt-1 text-xs">{product.sku}</CardDescription>
          </div>
          <Badge variant={totalAvailable > 0 ? "default" : "destructive"} className="shrink-0">
            {totalAvailable > 0 ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y">
          {product.inventory.map((inv) => (
            <div key={inv.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1 flex-1">
                <p className="font-medium text-sm">{inv.warehouseName}</p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>Available: <strong className={inv.availableUnits > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}>{inv.availableUnits}</strong></span>
                  <span>Reserved: <strong>{inv.reservedUnits}</strong></span>
                  <span>Total: <strong>{inv.totalUnits}</strong></span>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="secondary"
                disabled={disabled || inv.availableUnits <= 0}
                onClick={() => onReserveClick(product, inv)}
                className="w-full sm:w-auto shrink-0"
              >
                Reserve
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
