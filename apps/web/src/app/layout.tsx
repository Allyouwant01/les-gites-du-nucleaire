'use client';

import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <title>Les Gîtes du Nucléaire — Logements pour travailleurs du nucléaire</title>
        <meta
          name="description"
          content="Trouvez des logements vérifiés près des centrales nucléaires françaises. Paiement hebdomadaire, paiement partagé entre colocataires."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#fff',
              color: '#212529',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            },
          }}
        />
      </body>
    </html>
  );
}
