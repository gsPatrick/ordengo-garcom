"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

export function QuantityDialog({ product, isOpen, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1);

  // Reseta a quantidade para 1 sempre que o modal for aberto para um novo produto
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription>Selecione a quantidade desejada.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-6 py-8">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
            <Minus className="h-6 w-6" />
          </Button>
          <span className="text-5xl font-bold w-20 text-center">{quantity}</span>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => setQuantity(q => q + 1)}>
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        <DialogFooter>
          <Button size="lg" className="w-full" onClick={() => onConfirm(product, quantity)}>
            Adicionar {quantity} ao Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}