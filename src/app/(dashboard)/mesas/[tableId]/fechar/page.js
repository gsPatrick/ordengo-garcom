"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import {
    ArrowLeft, Minus, Plus, Loader2,
    CreditCard, Banknote, QrCode, Wallet,
    Receipt, Users, CheckCircle2, Image as ImageIcon, Check
} from "lucide-react";
import api from '@/lib/api';

const BASE_IMG_URL = 'https://geral-ordengoapi.r954jc.easypanel.host';
const formatCurrency = (value) => value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function CloseAccountPage() {
    const router = useRouter();
    const { tableId } = useParams();
    const searchParams = useSearchParams();
    const initialMethod = searchParams.get('method');

    // Dados
    const [table, setTable] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Controle de UI
    const [people, setPeople] = useState(1);
    const [includeServiceFee, setIncludeServiceFee] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState(initialMethod || 'credit');

    // Estados dos Modais
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const tablesRes = await api.get('/tables');
                const currentTable = tablesRes.data.data.tables.find(t => String(t.id) === String(tableId));

                if (!currentTable) {
                    alert("Mesa no encontrada");
                    return router.push('/');
                }
                setTable(currentTable);

                if (currentTable.currentSessionId) {
                    const sessionRes = await api.get(`/orders/session/${currentTable.currentSessionId}`);
                    const allItems = [];
                    sessionRes.data.data.orders.forEach(order => {
                        if (order.status !== 'cancelled' && order.items) {
                            order.items.forEach(item => {
                                allItems.push({
                                    id: item.id,
                                    name: item.Product?.name?.pt || 'Item',
                                    quantity: item.quantity,
                                    price: Number(item.unitPrice),
                                    image: item.Product?.imageUrl
                                });
                            });
                        }
                    });
                    setOrders(allItems);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [tableId, router]);

    const { subtotal, serviceFee, total, valuePerPerson } = useMemo(() => {
        const sub = orders.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const fee = includeServiceFee ? sub * 0.1 : 0;
        const tot = sub + fee;
        const perPerson = tot / Math.max(1, people);
        return { subtotal: sub, serviceFee: fee, total: tot, valuePerPerson: perPerson };
    }, [orders, includeServiceFee, people]);

    // Passo 1: Abrir Modal de Confirmação
    const handleInitiatePayment = () => {
        setIsConfirmOpen(true);
    };

    // Passo 2: Executar Pagamento
    const handleConfirmPayment = async () => {
        if (!table?.currentSessionId) return;

        setProcessing(true);
        try {
            await api.post(`/orders/session/${table.currentSessionId}/close`, {
                paymentMethod: selectedMethod
            });

            setIsConfirmOpen(false);
            setIsSuccessOpen(true); // Abre modal de sucesso
        } catch (error) {
            console.error(error);
            alert("Error al cerrar cuenta. Intente nuevamente.");
            setIsConfirmOpen(false);
        } finally {
            setProcessing(false);
        }
    };

    // Passo 3: Finalizar e Sair (Voltar para Mesas)
    const handleFinish = () => {
        router.push('/'); // Volta para o Dashboard (Mesas)
    };

    const getMethodLabel = (method) => {
        const map = { credit: 'Crédito', debit: 'Débito', pix: 'Pix', cash: 'Efectivo' };
        return map[method] || 'Otro';
    }

    const PaymentButton = ({ method, icon: Icon, label }) => (
        <button
            onClick={() => setSelectedMethod(method)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedMethod === method
                    ? 'border-[#df0024] bg-red-50 text-[#df0024]'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
                }`}
        >
            <Icon className={`mb-1 h-6 w-6 ${selectedMethod === method ? 'text-[#df0024]' : 'text-gray-400'}`} />
            <span className="text-xs font-bold">{label}</span>
            {selectedMethod === method && <div className="mt-1 w-2 h-2 bg-[#df0024] rounded-full" />}
        </button>
    );

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#df0024]" /></div>;

    return (
        <div className="flex flex-col h-screen bg-gray-50">

            <header className="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="ml-4">
                    <h1 className="text-lg font-bold text-gray-900">Cierre</h1>
                    <p className="text-xs text-gray-500">Mesa {table?.number}</p>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-36">

                {/* TOTALIZADOR */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-1">Valor Total</p>
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-2">{formatCurrency(total)}</h2>
                    {people > 1 && (
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold mt-2">
                            <Users size={14} />
                            {formatCurrency(valuePerPerson)} / pessoa
                        </div>
                    )}
                </div>

                {/* CONTROLES */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-100 p-2 rounded-lg text-yellow-700">
                                <Receipt size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Cargo por Servicio (10%)</p>
                                <p className="text-xs text-gray-500">{includeServiceFee ? 'Cobrar cargo' : 'Remover cargo'}</p>
                            </div>
                        </div>
                        <Switch checked={includeServiceFee} onCheckedChange={setIncludeServiceFee} className="data-[state=checked]:bg-[#df0024]" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Dividir Cuenta</p>
                                <p className="text-xs text-gray-500">{people} pagadores</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white shadow-sm" onClick={() => setPeople(p => Math.max(1, p - 1))}><Minus className="h-4 w-4" /></Button>
                            <span className="font-bold w-6 text-center">{people}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white shadow-sm" onClick={() => setPeople(p => p + 1)}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                {/* MÉTODO DE PAGAMENTO */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Wallet size={18} className="text-gray-400" /> Método de Pago
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        <PaymentButton method="credit" label="Crédito" icon={CreditCard} />
                        <PaymentButton method="debit" label="Débito" icon={CreditCard} />
                        <PaymentButton method="pix" label="Pix" icon={QrCode} />
                        <PaymentButton method="cash" label="Efectivo" icon={Banknote} />
                    </div>
                </div>

                {/* RECIBO DETALHADO */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Receipt size={18} className="text-gray-400" /> Detalles del Consumo
                    </h3>
                    <div className="space-y-4">
                        {orders.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                <div className="h-12 w-12 rounded-lg bg-gray-100 relative overflow-hidden flex-shrink-0 border border-gray-200">
                                    {item.image ? (
                                        <Image
                                            src={`${BASE_IMG_URL}${item.image}`}
                                            alt={item.name}
                                            layout="fill"
                                            objectFit="cover"
                                            unoptimized={true}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full text-gray-300"><ImageIcon size={20} /></div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900 text-sm">{item.quantity}x {item.name}</span>
                                        <span className="font-bold text-gray-900 text-sm">{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.price)} unit.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-100 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600"><span>Subtotal Items</span><span>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Servicio (10%)</span><span>{formatCurrency(serviceFee)}</span></div>
                        <div className="flex justify-between font-bold text-lg text-gray-900 pt-2"><span>Total Final</span><span>{formatCurrency(total)}</span></div>
                    </div>
                </div>

            </main>

            {/* FOOTER FIXO */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                <div className="flex justify-between items-end mb-3 px-1">
                    <div>
                        <p className="text-xs text-gray-500">Total a Pagar</p>
                        <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(total)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Método</p>
                        <p className="font-bold text-[#df0024]">{getMethodLabel(selectedMethod)}</p>
                    </div>
                </div>
                <Button
                    size="lg"
                    className="w-full h-14 text-lg font-bold bg-[#df0024] hover:bg-red-700 shadow-lg shadow-red-100"
                    onClick={handleInitiatePayment}
                >
                    Confirmar Pago
                </Button>
            </footer>

            {/* --- MODAL DE CONFIRMAÇÃO --- */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="max-w-xs rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-xl">¿Confirmar Recepción?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            ¿Confirma la recepción de <strong>{formatCurrency(total)}</strong> vía <strong>{getMethodLabel(selectedMethod)}</strong>?
                            <br /><br />
                            La mesa será liberada automáticamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2">
                        <AlertDialogAction
                            onClick={handleConfirmPayment}
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-bold text-lg"
                            disabled={processing}
                        >
                            {processing ? <Loader2 className="animate-spin" /> : "Sí, Confirmar"}
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full mt-0">Cancelar</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- MODAL DE SUCESSO --- */}
            <Dialog
                open={isSuccessOpen}
                onOpenChange={(isOpen) => {
                    if (!isOpen) handleFinish(); // Redireciona se fechar clicando fora
                }}
            >
                <DialogContent className="max-w-xs rounded-3xl text-center flex flex-col items-center py-10 [&>button]:hidden">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                        <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h2>
                    <p className="text-gray-500 mb-8 text-sm">La mesa {table?.number} fue liberada y está lista para el próximo cliente.</p>

                    <Button
                        onClick={handleFinish}
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold rounded-xl py-6 text-lg"
                    >
                        Volver al Inicio
                    </Button>
                </DialogContent>
            </Dialog>

        </div>
    );
}