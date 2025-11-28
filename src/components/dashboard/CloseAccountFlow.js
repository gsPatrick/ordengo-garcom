"use client";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CircleDollarSign, Minus, Plus, X } from "lucide-react";

const formatCurrency = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CloseAccountFlow({ table, onConfirm }) {
  const [isSplitterOpen, setIsSplitterOpen] = useState(false);
  const [people, setPeople] = useState(1);

  if (!table) return null;

  const subtotal = table.orders?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;
  const valuePerPerson = total / people;

  const handleConfirmClose = () => {
    setIsSplitterOpen(true);
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="lg" variant="destructive">
            <CircleDollarSign className="mr-2 h-4 w-4" /> Fechar Conta
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja fechar a conta da Mesa {table.id}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Sim, fechar conta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- MUDANÇA PRINCIPAL: Conteúdo do Dialog de Fechamento --- */}
      <Dialog open={isSplitterOpen} onOpenChange={setIsSplitterOpen}>
        <DialogContent className="sm:max-w-md flex flex-col h-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Fechamento - Mesa {table.id}</DialogTitle>
             <DialogClose className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-gray-100">
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
            </DialogClose>
          </DialogHeader>
          
          <Separator />

          {/* Lista de Itens com Scroll */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-6">
            <h4 className="font-semibold mb-4">Itens Consumidos</h4>
            <ul className="space-y-4">
              {table.orders && table.orders.length > 0 ? (
                table.orders.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium text-gray-700">{item.quantity}x {item.name}</span>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} cada</p>
                    </div>
                    <span className="font-semibold text-gray-800">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhum item consumido.</p>
              )}
            </ul>
          </div>

          <Separator />
          
          {/* Resumo e Divisão da Conta */}
          <div className="mt-auto space-y-4">
            <div className="space-y-2 text-md">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Taxa de serviço (10%)</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Separator />

            <div className="text-center space-y-2">
              <h4 className="font-medium">Dividir a conta?</h4>
              <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setPeople(p => Math.max(1, p - 1))}>
                      <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-3xl font-bold w-16 text-center">{people}</span>
                  <Button variant="outline" size="icon" onClick={() => setPeople(p => p + 1)}>
                      <Plus className="h-4 w-4" />
                  </Button>
              </div>
              <p className="text-sm text-gray-500">Valor por pessoa</p>
              <p className="text-2xl font-bold">{formatCurrency(valuePerPerson)}</p>
            </div>

            <Button size="lg" className="w-full">Confirmar Pagamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}