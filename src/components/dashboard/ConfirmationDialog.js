"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ConfirmationDialog({ cart, isOpen, onClose, onConfirm }) {
  if (cart.length === 0) return null;

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Pedido</AlertDialogTitle>
          <AlertDialogDescription>
            Revise os itens antes de enviar para a cozinha.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Separator />
        <div className="max-h-60 overflow-y-auto my-4 pr-4">
          <ul className="space-y-3">
            {cart.map(item => (
              <li key={item.id} className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">{item.quantity}x {item.name}</span>
                <span className="font-semibold text-gray-800">{formatCurrency(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg mt-4">
          <span>Total do Pedido</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Enviar para a Cozinha</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}