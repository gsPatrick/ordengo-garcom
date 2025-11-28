"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Clock, ShoppingCart, CircleDollarSign, Check } from "lucide-react";

// Função para formatar moeda
const formatCurrency = (value) => {
  if (typeof value !== 'number') return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export function TableDetailsSheet({ table, isOpen, onClose }) {
  if (!table) return null;

  const subtotal = table.orders?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  const serviceFee = subtotal * 0.1; // 10% de taxa de serviço
  const total = subtotal + serviceFee;

  const statusInfo = {
    occupied: { variant: "secondary", label: "Ocupada" },
    calling: { variant: "destructive", label: "Chamando" },
    free: { variant: "default", label: "Livre" },
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-2xl">Mesa {table.id}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            Status: <Badge variant={statusInfo[table.status]?.variant}>{statusInfo[table.status]?.label}</Badge>
          </SheetDescription>
        </SheetHeader>
        
        <Separator className="my-4" />
        
        {/* Corpo principal com scroll */}
        <div className="flex-1 overflow-y-auto pr-6 -mr-6">
          {/* Informações do Cliente */}
          {(table.status === "occupied" || table.status === "calling") && table.clientName && (
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-lg">Cliente</h3>
              <div className="flex items-center gap-4">
                <Users className="h-5 w-5 text-gray-500" />
                <span>{table.clientName}</span>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 text-gray-500" />
                <span>Aberto há {table.openSince}</span>
              </div>
            </div>
          )}
          
          {/* Pedidos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pedidos na Mesa</h3>
            {table.orders && table.orders.length > 0 ? (
              <ul className="space-y-3">
                {table.orders.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{item.quantity}x {item.name}</span>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} cada</p>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum pedido realizado ainda.</p>
            )}
          </div>
        </div>

        {/* Rodapé fixo */}
        <SheetFooter className="mt-auto border-t pt-4">
          <div className="w-full space-y-4">
            {/* Resumo Financeiro */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Taxa de serviço (10%)</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="grid grid-cols-2 gap-2">
              {table.status === 'calling' && (
                <Button className="col-span-2 bg-green-600 hover:bg-green-700">
                  <Check className="mr-2 h-4 w-4" /> Marcar como Atendido
                </Button>
              )}
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" /> Adicionar Pedido
              </Button>
              <Button variant="destructive">
                <CircleDollarSign className="mr-2 h-4 w-4" /> Fechar Conta
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}