"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Clock, ShoppingCart, CircleDollarSign, Check, X } from "lucide-react";

const formatCurrency = (value) => {
  if (typeof value !== 'number') return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// Adicionar a prop 'onCloseAccount' que será chamada pelo Alert
export function TableDetailsDialog({ table, isOpen, onClose, onCloseAccount }) {
  if (!table) return null;

  const subtotal = table.orders?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  const statusInfo = {
    occupied: { variant: "secondary", label: "Ocupada" },
    calling: { variant: "destructive", label: "Chamando" },
    free: { variant: "default", label: "Livre" },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] flex flex-col h-auto max-h-[90vh] p-6 rounded-2xl">
        <DialogHeader className="pr-10"> {/* Espaço para o botão de fechar */}
          <DialogTitle className="text-3xl font-bold text-gray-800">Mesa {table.id}</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-gray-500">Status:</span>
            <Badge variant={statusInfo[table.status]?.variant}>{statusInfo[table.status]?.label}</Badge>
          </div>
          <DialogClose className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-gray-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>
        </DialogHeader>
        
        <Separator className="my-4" />
        
        <div className="flex-1 overflow-y-auto space-y-8 pr-2 -mr-6">
          {(table.status === "occupied" || table.status === "calling") && table.clientName && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-700">Cliente</h3>
              <div className="flex items-center gap-3 text-gray-600">
                <Users className="h-5 w-5" />
                <span>{table.clientName}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="h-5 w-5" />
                <span>Aberto há {table.openSince}</span>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Pedidos na Mesa</h3>
            {table.orders && table.orders.length > 0 ? (
              <ul className="space-y-4">
                {table.orders.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium text-gray-700">{item.quantity}x {item.name}</span>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} cada</p>
                    </div>
                    <span className="font-semibold text-gray-800">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum pedido realizado ainda.</p>
            )}
          </div>
        </div>

        <div className="mt-auto pt-6 space-y-6">
          <Separator />
          <div className="space-y-2 text-md">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Taxa de serviço (10%)</span>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {table.status === 'calling' && (
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" /> Marcar como Atendido
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {/* CORREÇÃO: Removido variant="secondary" para usar o padrão (fundo escuro, texto branco) */}
              <Button size="lg" className="bg-gray-800 text-white hover:bg-gray-700">
                <ShoppingCart className="mr-2 h-4 w-4" /> Adicionar Pedido
              </Button>
              {/* Ação de Fechar Conta será encapsulada no Alert */}
              {onCloseAccount}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}