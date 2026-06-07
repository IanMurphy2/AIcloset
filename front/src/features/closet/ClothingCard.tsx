/**
 * Tarjeta de una prenda: imagen, descripción y metadatos (categoría/color).
 */

import { Card, CardContent } from "@/components/ui/card";
import { resolveImageUrl } from "@/features/closet/imageUrl";
import type { ClothingItem } from "@/features/closet/types";

interface ClothingCardProps {
  item: ClothingItem;
}

export function ClothingCard({ item }: ClothingCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <img
          src={resolveImageUrl(item.imageUrl)}
          alt={item.description}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="flex flex-col gap-2 p-4">
        <p className="text-sm font-medium leading-snug">{item.description}</p>
        {(item.category || item.color) && (
          <div className="flex flex-wrap gap-1.5">
            {item.category && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {item.category}
              </span>
            )}
            {item.color && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {item.color}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
