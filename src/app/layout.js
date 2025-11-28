// src/app/layout.js

import { useEffect } from 'react';
import "./globals.css";

export default function RootLayout({ children }) {
  
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => console.log('Scope: ', registration.scope))
        .catch((err) => console.log('Service Worker Registration Failed: ', err));
    }
  }, []);

  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#df0024" />
      </head>
      <body>{children}</body>
    </html>
  );
}