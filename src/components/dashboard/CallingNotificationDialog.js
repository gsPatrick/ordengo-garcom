"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { User, CircleDollarSign, Loader2, CreditCard, Banknote, QrCode, Wallet } from "lucide-react";

export function CallingNotificationDialog({ table, isOpen, onConfirm, onCancel, isResolving }) {
  if (!table) return null;

  // Recupera a notificação ativa anexada à mesa
  const notification = table.activeNotification || {};
  const isPaymentCall = notification.type === 'REQUEST_BILL' || table.status === 'closing';

  // Helper para traduzir o método de pagamento
  const getPaymentDetails = (method) => {
    switch (method) {
      case 'credit': return { label: 'Tarjeta de Crédito', icon: <CreditCard className="h-6 w-6" /> };
      case 'debit': return { label: 'Tarjeta de Débito', icon: <CreditCard className="h-6 w-6" /> };
      case 'pix': return { label: 'PIX', icon: <QrCode className="h-6 w-6" /> };
      case 'cash': return { label: 'Efectivo', icon: <Banknote className="h-6 w-6" /> };
      default: return null;
    }
  };

  const paymentInfo = isPaymentCall && notification.paymentMethod
    ? getPaymentDetails(notification.paymentMethod)
    : null;

  const callInfo = {
    title: isPaymentCall ? "Solicitud de Cuenta" : "Llamada al Camarero",
    description: isPaymentCall ? "El cliente solicitó el cierre de la cuenta." : "El cliente está llamando a la mesa.",
    icon: isPaymentCall ?
      <CircleDollarSign className="h-12 w-12 text-red-500" /> :
      <User className="h-12 w-12 text-blue-500" />
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader className="flex flex-col items-center text-center space-y-4 pt-6">

          {/* Ícone Principal */}
          {callInfo.icon}

          {/* Título */}
          <AlertDialogTitle className="text-2xl font-bold">
            Mesa {table.number}
          </AlertDialogTitle>

          {/* Descrição */}
          <AlertDialogDescription className="text-lg text-gray-600 pb-2">
            {callInfo.description}
          </AlertDialogDescription>

          {/* --- EXIBIÇÃO DO MÉTODO DE PAGAMENTO --- */}
          {paymentInfo && (
            <div className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 mt-2 animate-in zoom-in duration-300">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Forma de Pago</span>
              <div className="flex items-center gap-2 text-gray-900">
                {paymentInfo.icon}
                <span className="text-xl font-bold">{paymentInfo.label}</span>
              </div>
            </div>
          )}

        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isResolving}
            className="w-full text-lg py-6 mt-4"
          >
            {isResolving ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
            ) : (
              "Confirmar y Atender"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}