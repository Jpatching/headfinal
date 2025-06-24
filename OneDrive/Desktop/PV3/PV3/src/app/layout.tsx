import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PV3.FUN - Solana Gaming Platform",
  description: "The ultimate 1v1 skill gaming platform on Solana. Play, compete, and earn SOL.",
  keywords: ["solana", "gaming", "crypto", "1v1", "skill games", "blockchain"],
  authors: [{ name: "PV3 Team" }],
  openGraph: {
    title: "PV3.FUN - Solana Gaming Platform",
    description: "The ultimate 1v1 skill gaming platform on Solana",
    type: "website",
    url: "https://pv3.fun",
  },
  twitter: {
    card: "summary_large_image",
    title: "PV3.FUN - Solana Gaming Platform",
    description: "The ultimate 1v1 skill gaming platform on Solana",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-bg-main text-text-primary antialiased`}>
        <QueryProvider>
          <WalletProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar - Stake.com style */}
              <Sidebar />
              
              {/* Main content area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header />
                
                {/* Main content */}
                <main className="flex-1 overflow-y-auto bg-bg-main">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  );
} 