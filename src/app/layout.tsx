import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { ToastProvider } from "../contexts/ToastContext";
import type { Metadata } from "next";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bodegapp Premium",
  description: "Sistema POS Avanzado",
};

import { TenantProvider } from "../contexts/TenantContext";
import { LowStockProvider } from "../contexts/LowStockContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-emerald-500/30">
        <ToastProvider>
          <AuthProvider>
            <TenantProvider>
              <SubscriptionProvider>
                <LowStockProvider>
                  <CartProvider>
                    {children}
                  </CartProvider>
                </LowStockProvider>
              </SubscriptionProvider>
            </TenantProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
