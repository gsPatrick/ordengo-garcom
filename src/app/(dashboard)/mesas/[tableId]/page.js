'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  MoreVertical,
  Users,
  Clock,
  Loader2,
  ShoppingCart,
  Check,
  CircleDollarSign,
  Lock,
  DoorOpen,
  UserCheck,
  Tablet,       // Ícone para Tablet
  Trash2,       // Ícone para Excluir/Desvincular
  Copy,         // Ícone para Copiar
  RefreshCw     // Ícone de Atualizar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from '@/lib/api';

// --- Componente de Item de Pedido (Mantido igual) ---
function OrderItem({ item, onUpdateStatus }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${item.waiterId ? 'bg-green-500' : 'bg-blue-500'}`}
          title={item.waiterId ? "Garçom" : "Cliente"} />
        <div>
          <span className="font-medium text-gray-800 text-sm">
            {item.quantity}x {item.Product?.name?.pt || 'Item'}
          </span>
          {item.modifiers && item.modifiers.length > 0 && (
            <p className="text-[10px] text-gray-500">
              {item.modifiers.map(m => m.name.pt).join(', ')}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">
            {Number(item.unitPrice).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} cada
          </p>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <span className="font-semibold text-gray-800 text-sm">
          {Number(item.totalPrice).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
        </span>
        {item.Order?.status !== 'delivered' && item.Order?.status !== 'cancelled' && (
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:bg-green-50" onClick={() => onUpdateStatus(item.orderId, 'delivered')}>
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// --- NOVO COMPONENTE: Gerenciador de Dispositivos ---
function DeviceManagerDialog({ table, isOpen, onClose, onUnbind, onCopyCode }) {
  if (!table) return null;

  // Assume que a API retorna os dispositivos dentro do objeto da mesa (table.Devices)
  // Caso contrário, precisaríamos fazer um fetch específico aqui.
  const devices = table.Devices || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogDescription>
            Mesa {table.number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {/* Área do Código de Pareamento */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Código de Conexión</span>
            <div className="flex items-center justify-center gap-3">
              <code className="text-3xl font-mono font-bold text-gray-900 tracking-widest">
                {table.code || '----'}
              </code>
              <Button size="icon" variant="outline" onClick={() => onCopyCode(table.code)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400">Use este código para conectar una nueva tablet.</p>
          </div>

          {/* Lista de Dispositivos Conectados */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-gray-700">Dispositivos Conectados</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {devices.length > 0 ? (
                devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-gray-800">
                        {device.name || `Tablet ${device.id.substr(0, 4)}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        Bateria: {device.batteryLevel ? `${device.batteryLevel}%` : 'N/A'} • v{device.appVersion || '1.0'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onUnbind(device.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm italic border-2 border-dashed rounded-lg">
                  Ninguna tablet conectada en esta mesa.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TableDetailsPage() {
  const router = useRouter();
  const { tableId } = useParams();

  const [table, setTable] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para controlar o modal de dispositivos
  const [isDeviceManagerOpen, setIsDeviceManagerOpen] = useState(false);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        // 1. Pegar todas as mesas e encontrar a atual
        const tablesRes = await api.get('/tables');

        // Estamos assumindo que o backend retorna a propriedade 'Devices' dentro de cada mesa
        // ou que precisamos chamar /tables/devices. 
        // Pela estrutura padrão de ORMs (Sequelize/Prisma), geralmente vem junto se solicitado.
        const currentTable = tablesRes.data.data.tables.find(t => String(t.id) === String(tableId));

        if (!currentTable) {
          alert("Mesa não encontrada");
          router.push('/');
          return;
        }
        setTable(currentTable);

        // 2. Se tiver sessão ativa, buscar pedidos
        if (currentTable.currentSessionId) {
          const sessionRes = await api.get(`/orders/session/${currentTable.currentSessionId}`);
          setOrders(sessionRes.data.data.orders);
        } else {
          setOrders([]);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [tableId, router]);

  // Função Wrapper para uso fora do useEffect (se necessário recarregar)
  const reloadTableData = async () => {
    try {
      const tablesRes = await api.get('/tables');
      const currentTable = tablesRes.data.data.tables.find(t => String(t.id) === String(tableId));
      if (currentTable) {
        setTable(currentTable);
        if (currentTable.currentSessionId) {
          const sessionRes = await api.get(`/orders/session/${currentTable.currentSessionId}`);
          setOrders(sessionRes.data.data.orders);
        } else {
          setOrders([]);
        }
      }
    } catch (e) { console.error(e); }
  };

  // Ações de Mesa
  const handleChangeStatus = async (newStatus) => {
    try {
      await api.patch(`/tables/${tableId}/status`, { status: newStatus });
      reloadTableData();
    } catch (error) {
      alert('Erro ao atualizar status');
    }
  };

  // Ações de Pedido
  const handleDeliverOrder = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      reloadTableData();
    } catch (error) {
      alert('Erro ao atualizar pedido');
    }
  };

  // --- NOVAS AÇÕES: DISPOSITIVOS ---
  const handleUnbindDevice = async (deviceId) => {
    if (!confirm("¿Está seguro de que desea desconectar esta tablet? Volverá a la pantalla de configuración.")) return;

    try {
      await api.patch(`/tables/devices/${deviceId}/unbind`);
      alert("¡Tablet desconectada con éxito!");
      reloadTableData(); // Recarrega para atualizar a lista
    } catch (error) {
      console.error(error);
      alert("Erro ao desconectar dispositivo.");
    }
  };

  const handleCopyCode = (code) => {
    if (code) {
      navigator.clipboard.writeText(code);
      alert("¡Código copiado al portapapeles!");
    } else {
      alert("Código no disponible.");
    }
  };

  // Processar Itens
  const allItems = useMemo(() => {
    const items = [];
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          items.push({
            ...item,
            Order: { status: order.status, id: order.id }
          });
        });
      }
    });
    return items;
  }, [orders]);

  const pendingItems = allItems.filter(i => ['pending', 'accepted', 'preparing', 'ready'].includes(i.Order.status));
  const deliveredItems = allItems.filter(i => i.Order.status === 'delivered');

  const totalAmount = allItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
  const serviceFee = totalAmount * 0.1;
  const finalTotal = totalAmount + serviceFee;
  const hasConsumption = totalAmount > 0;
  const isTableBusy = table && ['occupied', 'calling', 'closing'].includes(table.status);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!table) return null;

  const statusInfo = {
    occupied: { variant: "secondary", label: "Ocupada", color: "bg-blue-100 text-blue-800" },
    calling: { variant: "destructive", label: "Llamando", color: "bg-red-100 text-red-800" },
    free: { variant: "outline", label: "Libre", color: "bg-green-100 text-green-800" },
    closing: { variant: "destructive", label: "Cierre", color: "bg-orange-100 text-orange-800" },
  };

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* Header */}
      <header className="flex items-center p-4 border-b sticky top-0 bg-white z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col ml-3 flex-1">
          {/* TÍTULO ATUALIZADO: Mostra "Mesa X" onde X é o número/nome */}
          <h1 className="text-xl font-bold text-gray-900">Mesa {table.number}</h1>
          <div className="flex items-center gap-2">
            <Badge className={statusInfo[table.status]?.color} variant="outline">
              {statusInfo[table.status]?.label}
            </Badge>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Acciones de la Mesa</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSeparator />

            {/* AÇÃO: OCUPAR */}
            <DropdownMenuItem
              onClick={() => handleChangeStatus('occupied')}
              disabled={isTableBusy}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              <span>Ocupar Mesa</span>
            </DropdownMenuItem>

            {/* AÇÃO: FECHAMENTO */}
            <DropdownMenuItem
              onClick={() => handleChangeStatus('closing')}
              disabled={!hasConsumption}
            >
              <Lock className="mr-2 h-4 w-4" />
              <span>Iniciar Cierre</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* AÇÃO: LIBERAR */}
            <DropdownMenuItem
              onClick={() => handleChangeStatus('free')}
              disabled={hasConsumption}
              className="text-red-600 focus:text-red-600"
            >
              <DoorOpen className="mr-2 h-4 w-4" />
              <span>Liberar Mesa</span>
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Info Sessão */}
        {table.currentSessionId && (
          <section className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{table.activeSession?.clientName || 'Cliente no identificado'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Sesión Activa</span>
            </div>
          </section>
        )}

        {/* Abas de Pedidos */}
        <section>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pending">Pendientes ({pendingItems.length})</TabsTrigger>
              <TabsTrigger value="delivered">Entregados ({deliveredItems.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3">
              {pendingItems.length > 0 ? (
                pendingItems.map(item => (
                  <OrderItem key={item.id} item={item} onUpdateStatus={handleDeliverOrder} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">Todo entregado por aquí.</div>
              )}
            </TabsContent>

            <TabsContent value="delivered" className="space-y-3">
              {deliveredItems.length > 0 ? (
                deliveredItems.map(item => (
                  <OrderItem key={item.id} item={item} onUpdateStatus={null} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">Ningún item entregado aún.</div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Footer: Ações e Total */}
      <footer className="p-4 border-t bg-white space-y-4 pb-8">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{totalAmount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Servicio (10%)</span>
            <span>{serviceFee.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span>
          </div>
          <div className="flex justify-between font-bold text-xl text-gray-900 pt-2 border-t border-gray-100 mt-2">
            <span>Total</span>
            <span>{finalTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="bg-gray-900 text-white hover:bg-black"
            onClick={() => router.push(`/mesas/${tableId}/novo-pedido`)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> Nuevo Pedido
          </Button>
          <Button
            size="lg"
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            disabled={!hasConsumption}
            onClick={() => router.push(`/mesas/${tableId}/fechar`)}
          >
            <CircleDollarSign className="mr-2 h-4 w-4" /> Cerrar
          </Button>
        </div>
      </footer>

      {/* MODAL DE GERENCIAMENTO DE TABLETS */}
      <DeviceManagerDialog
        table={table}
        isOpen={isDeviceManagerOpen}
        onClose={() => setIsDeviceManagerOpen(false)}
        onUnbind={handleUnbindDevice}
        onCopyCode={handleCopyCode}
      />
    </div>
  );
}