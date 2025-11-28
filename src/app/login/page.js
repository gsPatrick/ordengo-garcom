// src/app/login/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, ArrowRight, Loader2, Building2, Delete } from 'lucide-react';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = Restaurant ID, 2 = PIN
  const [restaurantId, setRestaurantId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verifica se já tem restaurante salvo
  useEffect(() => {
    const savedId = Cookies.get('ordengo_restaurant_id');
    if (savedId) {
      setRestaurantId(savedId);
      setStep(2);
    }
  }, []);

  // Passo 1: Salvar ID do Restaurante (Pode ser Slug ou UUID aqui)
  const handleSaveRestaurant = (e) => {
    e.preventDefault();
    if (restaurantId.length > 3) {
      Cookies.set('ordengo_restaurant_id', restaurantId, { expires: 365 });
      setStep(2);
    } else {
      setError('ID inválido.');
    }
  };

  // Passo 2: Login com PIN na API
  const handleLogin = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/waiter-login', {
        pin,
        restaurantId // Envia o que o usuário digitou (slug ou uuid)
      });

      const { token, data } = response.data;

      // Salva sessão
      Cookies.set('ordengo_token', token, { expires: 1 });
      Cookies.set('ordengo_user', JSON.stringify(data.user), { expires: 1 });
      
      // --- CORREÇÃO CRÍTICA AQUI ---
      // Atualiza o ID do restaurante com o UUID real retornado pelo backend
      // Isso garante que futuras chamadas usem o UUID e não o Slug "patrick"
      if (data.user.restaurantId) {
        Cookies.set('ordengo_restaurant_id', data.user.restaurantId, { expires: 365 });
      }

      router.push('/'); // Vai para o Dashboard (Mapa de Mesas)
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'PIN incorreto ou erro no servidor.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Teclado Numérico
  const handleNumClick = (num) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };
  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      
      {step === 1 ? (
        /* ETAPA 1: VINCULAR RESTAURANTE */
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-[#df0024]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Configurar Dispositivo</h1>
            <p className="text-gray-500 text-sm mt-2">Insira o ID do Restaurante para vincular este aparelho.</p>
          </div>

          <form onSubmit={handleSaveRestaurant} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ID do Restaurante</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#df0024] outline-none"
                placeholder="Cole o ID ou Slug aqui..."
                value={restaurantId}
                onChange={e => setRestaurantId(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors">
              Continuar
            </button>
          </form>
        </div>
      ) : (
        /* ETAPA 2: PIN PAD */
        <div className="flex flex-col items-center w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat size={32} className="text-white" />
            </div>
            <h2 className="text-white/50 text-xs uppercase tracking-widest mb-2">Acesso Restrito</h2>
            <button onClick={() => {setStep(1); Cookies.remove('ordengo_restaurant_id')}} className="text-xs text-[#df0024] underline">
              Trocar Restaurante
            </button>
          </div>

          {/* Dots do PIN */}
          <div className="flex justify-center gap-4 mb-8 h-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-[#df0024] scale-110' : 'bg-zinc-700'}`} />
            ))}
          </div>

          {error && <div className="mb-6 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg text-sm font-medium">{error}</div>}

          {/* Teclado */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumClick(num.toString())}
                className="h-20 rounded-2xl bg-zinc-800 text-white text-3xl font-bold hover:bg-zinc-700 active:scale-95 transition-all shadow-lg"
              >
                {num}
              </button>
            ))}
            <div className="h-20"></div>
            <button onClick={() => handleNumClick('0')} className="h-20 rounded-2xl bg-zinc-800 text-white text-3xl font-bold hover:bg-zinc-700 active:scale-95 transition-all shadow-lg">0</button>
            <button onClick={handleDelete} className="h-20 flex items-center justify-center rounded-2xl bg-red-900/20 text-red-500 hover:bg-red-900/40 active:scale-95 transition-all">
              <Delete size={28} />
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={pin.length < 4 || loading}
            className={`mt-8 w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              pin.length === 4 ? 'bg-[#df0024] text-white shadow-lg shadow-red-900/50 cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Acessar <ArrowRight size={20} /></>}
          </button>
        </div>
      )}
    </div>
  );
}