'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Download,
    Share,
    PlusSquare,
    Smartphone,
    CheckCircle,
    ArrowRight,
    Loader2,
} from 'lucide-react';

export default function DownloadPage() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Detect if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true);
        }

        // Detect iOS (cannot trigger install prompt)
        const ua = window.navigator.userAgent.toLowerCase();
        const iPhone = /iphone|ipad|ipod/.test(ua);
        setIsIOS(iPhone);

        // Capture beforeinstallprompt event (Android/Chrome)
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        setIsReady(true);

        // Cleanup
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (!isReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center p-4">
            {/* Header */}
            <div className="w-full max-w-2xl mt-8 text-center">
                <Image src="/logocerta.png" alt="OrdenGo" width={120} height={100} className="mx-auto" unoptimized />
                <h1 className="text-3xl font-bold mt-4">
                    OrdenGo <br />
                    <span className="text-red-600">Garçom</span>
                </h1>
                <p className="mt-2 text-gray-300">
                    Instale o aplicativo oficial para transformar este dispositivo em um terminal de autoatendimento rápido e seguro.
                </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full max-w-4xl">
                <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
                    <CheckCircle size={24} className="text-green-400" />
                    <span className="mt-2">Modo Tela Cheia (Kiosk)</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
                    <CheckCircle size={24} className="text-green-400" />
                    <span className="mt-2">Notificações em Tempo Real</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
                    <CheckCircle size={24} className="text-green-400" />
                    <span className="mt-2">Maior Performance</span>
                </div>
            </div>

            {/* Action Section */}
            <div className="mt-10 w-full max-w-xl bg-gray-800 p-6 rounded-lg">
                {isStandalone ? (
                    <div className="text-center">
                        <CheckCircle size={48} className="mx-auto text-green-400" />
                        <h2 className="text-xl font-semibold mt-4">Aplicativo Ativo!</h2>
                        <p className="mt-2">Você já está utilizando a versão aplicativo do OrdenGo.</p>
                        <button
                            onClick={() => (window.location.href = '/')}
                            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                        >
                            Acessar Sistema
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Android Install */}
                        {deferredPrompt && (
                            <div className="text-center mb-6">
                                <Download size={40} className="mx-auto" />
                                <h2 className="text-xl font-semibold mt-2">Instalar Agora</h2>
                                <p className="mt-1">Clique abaixo para baixar e instalar o App automaticamente.</p>
                                <button
                                    onClick={handleInstallClick}
                                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded flex items-center mx-auto"
                                >
                                    BAIXAR APP <ArrowRight size={18} className="ml-2" />
                                </button>
                            </div>
                        )}
                        {/* iOS Manual */}
                        {isIOS && (
                            <div className="text-center mb-6">
                                <Smartphone size={32} className="mx-auto" />
                                <h3 className="text-lg font-semibold mt-2">Instalação no iOS</h3>
                                <p className="mt-1">A Apple exige instalação manual. Siga os passos:</p>
                                <ol className="list-decimal list-inside mt-2 text-left">
                                    <li>
                                        Toque no botão <strong>Compartilhar</strong> <Share size={16} className="inline" /> na barra do navegador.
                                    </li>
                                    <li>
                                        Role para baixo e toque em <strong>Adicionar à Tela de Início</strong> <PlusSquare size={16} className="inline" />.
                                    </li>
                                    <li>
                                        Confirme clicando em <strong>Adicionar</strong> no canto superior.
                                    </li>
                                </ol>
                            </div>
                        )}
                        {/* Fallback */}
                        {!deferredPrompt && !isIOS && (
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Não foi possível instalar automaticamente</h3>
                                <p className="mt-1">
                                    Verifique se você já tem o App instalado ou use o menu do navegador e clique em "Instalar Aplicativo" ou "Adicionar à Tela Inicial".
                                </p>
                                <button
                                    onClick={() => (window.location.href = '/')}
                                    className="mt-3 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                                >
                                    Continuar no Navegador
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
