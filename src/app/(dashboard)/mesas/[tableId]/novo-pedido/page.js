'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Search, Plus, Minus, 
  ShoppingCart, Loader2, CheckCircle, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import api from '@/lib/api';
import Cookies from 'js-cookie';

// --- Componente Auxiliar: Modal de Produto ---
function ProductModal({ product, isOpen, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [obs, setObs] = useState('');

  useEffect(() => {
    if (isOpen) { setQty(1); setObs(''); }
  }, [isOpen]);

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{product.name.pt}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="flex items-center justify-center gap-6">
            <Button variant="outline" size="icon" onClick={() => setQty(q => Math.max(1, q - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-4xl font-bold w-16 text-center">{qty}</span>
            <Button variant="outline" size="icon" onClick={() => setQty(q => q + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Observação (Opcional)</label>
            <Input 
              placeholder="Ex: Sem cebola, Bem passado..." 
              value={obs}
              onChange={e => setObs(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onConfirm(product, qty, obs)} className="w-full bg-[#df0024] hover:bg-red-700">
            Adicionar {Number(product.price * qty).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const { tableId } = useParams();

  // Dados
  const [menu, setMenu] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [tableSessionId, setTableSessionId] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  
  // UI
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);

  // Carrinho
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const tablesRes = await api.get('/tables');
        const currentTable = tablesRes.data.data.tables.find(t => String(t.id) === String(tableId));
        
        if (!currentTable) {
          alert("Mesa não encontrada");
          return router.back();
        }
        
        setTableSessionId(currentTable.currentSessionId);
        setTableNumber(currentTable.number);

        const menuRes = await api.get('/menu'); 
        const menuTree = menuRes.data.data.menu;
        
        const flats = [];
        const cats = [{ id: 'all', name: 'Todos' }];

        const processCategory = (cat) => {
          cats.push({ id: cat.id, name: cat.name.pt });
          if (cat.Products) {
            cat.Products.forEach(p => {
              flats.push({ ...p, categoryId: cat.id });
            });
          }
          if (cat.subcategories) {
            cat.subcategories.forEach(sub => processCategory(sub));
          }
        };

        menuTree.forEach(cat => processCategory(cat));
        setMenu(flats);
        setCategories(cats);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tableId, router]);

  const filteredProducts = useMemo(() => {
    return menu.filter(p => {
      const matchesSearch = p.name.pt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchTerm, activeCategory]);

  const handleAddToCart = (product, quantity, obs) => {
    const item = {
      tempId: Date.now(),
      product,
      quantity,
      obs,
      total: product.price * quantity
    };
    setCart(prev => [...prev, item]);
    setSelectedProduct(null);
  };

  const handleRemoveFromCart = (tempId) => {
    setCart(prev => prev.filter(i => i.tempId !== tempId));
  };

  // 4. Enviar Pedido (COM PROTEÇÃO DE UUID)
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setSending(true);

    // --- MUDANÇA AQUI: Priorizar o ID do objeto de usuário ---
    let restaurantId = null;
    
    // Tenta pegar do usuário logado (Garçom)
    const userCookie = Cookies.get('ordengo_user');
    if (userCookie) {
        try {
            const user = JSON.parse(userCookie);
            restaurantId = user.restaurantId; // Isso é sempre UUID
        } catch (e) {}
    }

    // Se não achou (Modo Tablet/Cliente), pega do cookie direto
    if (!restaurantId) {
        restaurantId = Cookies.get('ordengo_restaurant_id');
    }

    if (!restaurantId) {
        alert("Erro de sessão. Faça login novamente.");
        router.push('/login');
        return;
    }

    try {
      let sessionId = tableSessionId;

      if (!sessionId) {
        const sessionRes = await api.post('/orders/session/start', {
          tableId: tableId,
          restaurantId: restaurantId 
        });
        sessionId = sessionRes.data.data.session.id;
      }

      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        observation: item.obs,
        modifiers: [] 
      }));

      await api.post('/orders', {
        tableSessionId: sessionId,
        restaurantId: restaurantId,
        items: itemsPayload
      });

      router.push(`/mesas/${tableId}`); 
      
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      // Se o erro for UUID inválido (caso raro onde o cookie ainda está sujo e não é garçom)
      if (error.response?.data?.error?.code === '22P02') {
         alert("Erro crítico: ID do restaurante inválido. Por favor, refaça o login.");
         Cookies.remove('ordengo_restaurant_id');
         router.push('/login');
      } else {
         alert(error.response?.data?.message || "Erro ao enviar pedido.");
      }
    } finally {
      setSending(false);
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      <header className="bg-white p-4 border-b shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Novo Pedido</h1>
          <p className="text-xs text-gray-500">Mesa {tableNumber}</p>
        </div>
        {cart.length > 0 && (
          <Badge className="bg-red-600 text-white px-3 py-1">
            {cart.length} itens
          </Badge>
        )}
      </header>

      <div className="p-4 bg-white border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Buscar produto..." 
            className="pl-9 bg-gray-50"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat.id 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3 pb-20">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div>
                <h3 className="font-bold text-gray-800">{product.name.pt}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{product.description?.pt}</p>
                <p className="text-sm font-semibold text-[#df0024] mt-1">
                  {Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <Button size="icon" variant="secondary" className="rounded-full h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <AlertCircle className="mx-auto h-10 w-10 mb-2 opacity-20" />
              <p>Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      </main>

      {cart.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-500">{cart.length} itens adicionados</span>
            <span className="text-xl font-bold text-gray-900">
              {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
            {cart.map(item => (
              <div key={item.tempId} className="flex-shrink-0 bg-gray-50 px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs">
                <span className="font-bold">{item.quantity}x</span>
                <span className="truncate max-w-[80px]">{item.product.name.pt}</span>
                <button onClick={() => handleRemoveFromCart(item.tempId)} className="text-red-500 ml-1"><Minus className="h-3 w-3" /></button>
              </div>
            ))}
          </div>

          <Button 
            className="w-full bg-[#df0024] hover:bg-red-700 h-12 text-lg font-bold"
            onClick={handleSubmitOrder}
            disabled={sending}
          >
            {sending ? <Loader2 className="animate-spin" /> : (
              <>Enviar para Cozinha <CheckCircle className="ml-2 h-5 w-5" /></>
            )}
          </Button>
        </div>
      )}

      <ProductModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)}
        onConfirm={handleAddToCart}
      />

    </div>
  );
}