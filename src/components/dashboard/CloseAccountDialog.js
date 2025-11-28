"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CircleDollarSign 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function CloseAccountDialog({ isOpen, onClose, onConfirm, table, totalAmount, serviceFee }) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  // Se houver uma notificação de pagamento ativa, pré-seleciona o método escolhido pelo cliente
  useEffect(() => {
    if (isOpen && table?.activeNotification?.paymentMethod) {
      setSelectedMethod(table.activeNotification.paymentMethod);
    }
  }, [isOpen, table]);

  const finalTotal = totalAmount + serviceFee;

  const handleConfirm = async () => {
    if (!selectedMethod) return alert("Selecione a forma de pagamento.");
    
    setLoading(true);
    await onConfirm(selectedMethod);
    setLoading(false);
  };

  const paymentMethods = [
    { id: 'credit', label: 'Crédito', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'debit', label: 'Débito', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'pix', label: 'PIX', icon: <QrCode className="h-5 w-5" /> },
    { id: 'cash', label: 'Dinheiro', icon: <Banknote className="h-5 w-5" /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CircleDollarSign className="text-green-600" /> Fechar Conta
          </DialogTitle>
          <DialogDescription>
            Mesa {table?.number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* Resumo de Valores */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Serviço (10%)</span>
              <span>{serviceFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>Total</span>
              <span>{finalTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
          </div>

          {/* Seleção de Pagamento */}
          <div className="space-y-3">
            <Label>Forma de Pagamento</Label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedMethod === method.id 
                      ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}
                  `}
                >
                  {method.icon}
                  <span className="font-medium text-sm">{method.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || !selectedMethod}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Pagamento e Liberar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}