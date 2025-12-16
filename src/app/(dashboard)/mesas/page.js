'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, LogOut, Loader2, Tablet, Copy, Power, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableCard } from "@/components/dashboard/TableCard";
import { CallingNotificationDialog } from "@/components/dashboard/CallingNotificationDialog";
import api from '@/lib/api';
import Cookies from 'js-cookie';

// --- MODAL DE GERENCIAMENTO DE TABLET (RESPONSIVO) ---
function DeviceManagerModal({ table, isOpen, onClose }) {
  if (!table) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(table.qrCodeToken);
    alert("Código copiado!");
  };

  const handleUnbind = async () => {
    if (!confirm("Deseja desconectar o tablet desta mesa?")) return;
    try {
      // Implementação futura do endpoint de unbind
      console.log("Desvincular tablet da mesa", table.id);
      alert("Comando enviado para desvincular.");
      onClose();
    } catch (e) {
      alert("Erro ao desvincular");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Ajuste de largura e bordas para mobile */}
      <DialogContent className="w-[95%] max-w-md rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Tablet className="h-5 w-5 text-gray-700" />
            Configurar Tablet
            <span className="text-gray-400 font-normal ml-auto text-sm">Mesa {table.number}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {/* CÓDIGO DE PAREAMENTO */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">
              Código de Conexión
            </span>

            <div className="flex items-center justify-center gap-2 w-full">
              {/* Fonte responsiva: menor no celular, maior no desktop */}
              <code className="text-3xl sm:text-4xl font-mono font-black text-gray-900 tracking-widest break-all">
                {table.qrCodeToken || '----'}
              </code>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="mt-3 gap-2 text-xs h-8"
              onClick={copyCode}
            >
              <Copy className="h-3.5 w-3.5" /> Copiar Código
            </Button>

            <p className="text-[10px] sm:text-xs text-gray-400 mt-3 max-w-[220px]">
              Ingrese este código en la aplicación de la tablet para vincular.
            </p>
          </div>

          {/* STATUS DO DISPOSITIVO */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              Dispositivo Actual
              {table.isDeviceConnected && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
            </h4>

            {table.isDeviceConnected ? (
              <div className="bg-white border rounded-xl p-3 shadow-sm">
                {/* Layout flex-col no mobile para não espremer o texto */}
                <div className="flex flex-col sm:flex-row gap-3">

                  {/* Info do Tablet */}
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <div className="bg-green-100 p-2.5 rounded-full shrink-0">
                      <Wifi className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800">Tablet Conectado</p>
                      <p className="text-xs text-gray-500 truncate">
                        IP: {table.deviceIp}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5 max-w-[200px]">
                        {table.deviceAgent ? 'Android/Web Device' : 'Dispositivo Genérico'}
                      </p>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <div className="sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 mt-2 sm:mt-0">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto h-9 text-xs font-bold shadow-red-100 shadow-lg"
                      onClick={handleUnbind}
                    >
                      <Power className="h-3.5 w-3.5 mr-2" /> Desconectar
                    </Button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-400 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <Tablet className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-xs sm:text-sm">Ningún dispositivo conectado.</span>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- PÁGINA PRINCIPAL (DASHBOARD) ---
export default function DashboardPage() {
  const router = useRouter();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modais
  const [callingTable, setCallingTable] = useState(null);
  const [managingTable, setManagingTable] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [tablesRes, notifRes] = await Promise.all([
        api.get('/tables'),
        api.get('/notifications')
      ]);

      const tablesData = tablesRes.data.data.tables;
      const notificationsData = notifRes.data.data.notifications;

      const mergedTables = tablesData.map(table => {
        const billRequest = notificationsData.find(n => n.tableId === table.uuid && n.type === 'REQUEST_BILL');
        const waiterCall = notificationsData.find(n => n.tableId === table.uuid && n.type === 'CALL_WAITER');
        const activeNotif = billRequest || waiterCall;

        let visualStatus = table.status;
        if (activeNotif) {
          if (activeNotif.type === 'REQUEST_BILL') visualStatus = 'closing';
          else if (activeNotif.type === 'CALL_WAITER') visualStatus = 'calling';
        }

        return {
          ...table,
          status: visualStatus,
          activeNotification: activeNotif || null
        };
      });

      mergedTables.sort((a, b) => parseInt(a.number) - parseInt(b.number));

      setTables(mergedTables);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = () => {
    Cookies.remove('ordengo_token');
    Cookies.remove('ordengo_user');
    router.push('/login');
  };

  const handleTableClick = (table) => {
    if (table.activeNotification || table.status === 'calling' || table.status === 'closing') {
      setCallingTable(table);
    } else {
      router.push(`/mesas/${table.id}`);
    }
  };

  const handleConfirmCall = async () => {
    if (!callingTable) return;
    setResolving(true);
    try {
      const notification = callingTable.activeNotification;
      const isBillRequest = notification?.type === 'REQUEST_BILL' || callingTable.status === 'closing';
      const paymentMethod = notification?.paymentMethod || '';

      if (notification) {
        await api.patch(`/notifications/${notification.id}/resolve`);
      }
      await fetchData();

      if (isBillRequest) {
        router.push(`/mesas/${callingTable.id}/fechar?method=${paymentMethod}`);
      } else {
        router.push(`/mesas/${callingTable.id}`);
      }
    } catch (error) {
      console.error("Erro ao resolver:", error);
    } finally {
      setResolving(false);
      setCallingTable(null);
    }
  };

  const counts = {
    all: tables.length,
    occupied: tables.filter(t => t.status === 'occupied' || t.status === 'calling').length,
    free: tables.filter(t => t.status === 'free').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    closing: tables.filter(t => t.status === 'closing').length,
  };

  const filteredTables = tables.filter((table) => {
    const statusFilter = activeTab === 'all' ||
      (activeTab === 'occupied' && (table.status === 'occupied' || table.status === 'calling')) ||
      (activeTab === 'reserved' && table.status === 'reserved') ||
      (activeTab === 'closing' && table.status === 'closing') ||
      table.status === activeTab;

    if (!statusFilter) return false;

    const searchString = searchTerm.toLowerCase();
    const tableNumberMatch = table.number.toString().toLowerCase().includes(searchString);
    const clientNameMatch = table.activeSession?.clientName?.toLowerCase().includes(searchString);

    return searchString === "" || tableNumberMatch || clientNameMatch;
  });

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">

      <header className="bg-white dark:bg-gray-800 p-3 flex items-center justify-between shadow-sm gap-4">
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500">
          <LogOut className="h-5 w-5" />
        </Button>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="inline-flex min-w-full">
            <TabsList className="flex h-auto w-full justify-start">
              <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
              <TabsTrigger value="occupied">Ocupado ({counts.occupied})</TabsTrigger>
              <TabsTrigger value="free">Libre ({counts.free})</TabsTrigger>
              <TabsTrigger value="closing">Cierre ({counts.closing})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar por número o cliente..."
            className="pl-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <main className="flex-1 p-4 overflow-y-auto">
        {loading && tables.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[#df0024]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-20">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleTableClick(table)}
                onManage={(t) => setManagingTable(t)} // Abre o modal de gerenciamento
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal de Chamado (Pedido de Conta/Garçom) */}
      <CallingNotificationDialog
        table={callingTable}
        isOpen={!!callingTable}
        isResolving={resolving}
        onConfirm={handleConfirmCall}
        onCancel={() => setCallingTable(null)}
      />

      {/* Modal de Gerenciamento de Tablet (Agora Responsivo) */}
      <DeviceManagerModal
        table={managingTable}
        isOpen={!!managingTable}
        onClose={() => setManagingTable(null)}
      />

    </div>
  );
}