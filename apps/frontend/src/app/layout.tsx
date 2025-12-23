import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

export const metadata: Metadata = {
  title: "Numatix Trading Platform",
  description: "Real-time cryptocurrency trading platform with event-driven architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <CurrencyProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}

