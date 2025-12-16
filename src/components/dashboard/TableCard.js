import { cn } from "@/lib/utils";
import { Tablet, Users } from "lucide-react";

export function TableCard({ table, onClick, onManage }) {
  // Cores Originais Mantidas
  const statusClasses = {
    free: "bg-green-600 hover:bg-green-700",
    occupied: "bg-amber-500 hover:bg-amber-600",
    calling: "bg-amber-500 hover:bg-amber-600 animate-pulse",
    reserved: "bg-blue-600 hover:bg-blue-700",
    closing: "bg-red-600 hover:bg-red-700",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center p-2 rounded-lg text-white font-bold aspect-square transition-colors shadow-md cursor-pointer select-none",
        statusClasses[table.status] || "bg-gray-500"
      )}
    >
      {/* --- ÍCONE DO TABLET (Canto Superior Esquerdo) --- */}
      {/* Ao clicar aqui, abre o modal de código/desvincular sem entrar na mesa */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (onManage) onManage(table);
        }}
        className="absolute top-2 left-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors cursor-pointer z-10"
        title={table.isDeviceConnected ? "Tablet Conectada" : "Conectar Tablet"}
      >
        <Tablet
          size={16}
          className={table.isDeviceConnected ? "text-green-300 fill-green-300" : "text-white/50"}
        />
      </div>

      {/* --- INDICADOR DE CHAMADO (Canto Superior Direito) --- */}
      {table.status === "calling" && (
        <span className="absolute top-2 right-2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
        </span>
      )}

      {/* --- NÚMERO DA MESA (Centro) --- */}
      {/* Exibe o número configurado (ex: "10") em vez do ID do banco */}
      <span className="text-5xl drop-shadow-md tracking-tighter">
        {table.number}
      </span>

      {/* --- NOME DO CLIENTE (Opcional - Rodapé) --- */}
      {table.activeSession?.clientName && (
        <div className="absolute bottom-2 flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded-full max-w-[90%]">
          <Users size={10} className="text-white/90" />
          <span className="text-[10px] font-normal truncate text-white/90">
            {table.activeSession.clientName}
          </span>
        </div>
      )}
    </div>
  );
}