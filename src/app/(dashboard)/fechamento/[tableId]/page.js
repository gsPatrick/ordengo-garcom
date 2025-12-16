"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Minus, Plus } from "lucide-react";

// (Em uma aplicação real, estes dados viriam de uma API)
const mockTablesData = [
    { id: 3, status: "calling", clientName: "(34) 23123-1231", openSince: "1h 12min", orders: [{ id: 103, name: "Coca-Cola", quantity: 1, price: 7.00, origin: 'client', status: 'pending' }] },
];

const formatCurrency = (value) => value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function CloseAccountPage() {
    const router = useRouter();
    const params = useParams();
    const { tableId } = params;

    const table = mockTablesData.find(t => t.id.toString() === tableId);

    const [people, setPeople] = useState(1);

    if (!table) return <div>Mesa no encontrada.</div>;

    const subtotal = table.orders?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
    const serviceFee = subtotal * 0.1;
    const total = subtotal + serviceFee;
    const valuePerPerson = total / people;

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="flex items-center p-3 border-b sticky top-0 bg-white z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
                <h1 className="text-xl font-bold ml-4">Cierre - Mesa {table.id}</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <section>
                    <h4 className="font-semibold mb-4 text-lg">Items Consumidos</h4>
                    <ul className="space-y-4">
                        {table.orders?.map(item => (
                            <li key={item.id} className="flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">{item.quantity}x {item.name}</span>
                                    <p className="text-xs text-gray-500">{formatCurrency(item.price)} cada</p>
                                </div>
                                <span className="font-semibold text-gray-800">{formatCurrency(item.price * item.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                </section>
                <Separator />
                <section className="space-y-2 text-md">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Cargo por servicio (10%)</span><span>{formatCurrency(serviceFee)}</span></div>
                    <div className="flex justify-between font-bold text-xl text-gray-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </section>
                <Separator />
                <section className="text-center space-y-4 py-6">
                    <h4 className="font-medium">¿Dividir la cuenta?</h4>
                    <p className="text-sm text-gray-500">Número de personas</p>
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => setPeople(p => Math.max(1, p - 1))}><Minus className="h-4 w-4" /></Button>
                        <span className="text-4xl font-bold w-20 text-center">{people}</span>
                        <Button variant="outline" size="icon" onClick={() => setPeople(p => p + 1)}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <p className="text-sm text-gray-500">Valor por persona</p>
                    <p className="text-3xl font-bold">{formatCurrency(valuePerPerson)}</p>
                </section>
            </main>
            <footer className="p-4 border-t bg-white">
                <Button size="lg" className="w-full">Confirmar Pago</Button>
            </footer>
        </div>
    );
}