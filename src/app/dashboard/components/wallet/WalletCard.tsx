"use client";

import { Copy, TrendingDown, TrendingUp, WalletIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface WalletCardProps {
  wallet: {
    id: string;
    name: string;
    address: string;
    network: "ethereum" | "bnb" | "tron" | "bitcoin";
    balance: number;
    balanceUSD: number;
    changePercent24h: number;
  };
  balanceVisible: boolean;
  onSelect: (wallet: any) => void;
  onAddressClick?: (address: string, walletName: string, coinSymbol?: string) => void;
}

export const WalletCard = ({ wallet, balanceVisible, onSelect, onAddressClick }: WalletCardProps) => {
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card
      key={wallet.id}
      className="bg-[#2a2a2a] border-[#2a2a2a] hover:border-[#a99fec] border transition-colors overflow-hidden cursor-pointer"
      onClick={() => onSelect(wallet)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            {wallet.network === "ethereum" ? (
              <div
                className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-500"
                     viewBox="0 0 784.37 1277.39" fill="none"
                     xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M392.07 0L383.5 29.11V873.74L392.07 882.29L784.13 650.54L392.07 0Z"
                    fill="#343434"/>
                  <path d="M392.07 0L0 650.54L392.07 882.29V472.33V0Z"
                        fill="#8C8C8C"/>
                  <path
                    d="M392.07 956.52L387.24 962.41V1263.28L392.07 1277.38L784.37 724.89L392.07 956.52Z"
                    fill="#3C3C3B"/>
                  <path
                    d="M392.07 1277.38V956.52L0 724.89L392.07 1277.38Z"
                    fill="#8C8C8C"/>
                  <path
                    d="M392.07 882.29L784.13 650.54L392.07 472.33V882.29Z"
                    fill="#141414"/>
                  <path d="M0 650.54L392.07 882.29V472.33L0 650.54Z"
                        fill="#393939"/>
                </svg>
              </div>
            ) : wallet.network === "bnb" ? (
              <div
                className="w-8 h-8 rounded-full bg-yellow-600/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-500"
                     viewBox="0 0 2500 2500" fill="none"
                     xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M764.48,1050.52,1250,565l485.75,485.73,282.5-282.5L1250,0,482,768l282.49,282.5"
                    fill="#F0B90B"/>
                  <path
                    d="M302.61,1250,585.11,967.52,302.61,685,20.11,967.52ZM764.48,1449.51l485.52-485.75,282.5,282.5-485.52,485.75L764.48,2014.5,481.76,1732"
                    fill="#F0B90B"/>
                  <path
                    d="M397.13,1267.42,1250,420.55l852.87,846.87L1733.16,1637,1250,1154l-483.45,483.44-369.42-369.42"
                    fill="#F0B90B"/>
                  <path
                    d="M1250,1733.76l483.16-483.44,282.49,282.5L1250,2500,482.48,1732.5,764.48,1450"
                    fill="#F0B90B"/>
                </svg>
              </div>
            ) : wallet.network === "tron" ? (
              <div
                className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-500"
                     viewBox="0 0 100 100" fill="none"
                     xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M50 0L10 30L20 40L50 20L80 40L90 30L50 0Z"
                    fill="#FF0013"/>
                  <path
                    d="M10 50L20 60L50 40L80 60L90 50L50 20L10 50Z"
                    fill="#FF0013"/>
                  <path
                    d="M10 70L20 80L50 60L80 80L90 70L50 40L10 70Z"
                    fill="#FF0013"/>
                  <path
                    d="M50 80L80 100L90 90L50 60L10 90L20 100L50 80Z"
                    fill="#FF0013"/>
                </svg>
              </div>
            ) : wallet.network === "bitcoin" ? (
              <div
                className="w-8 h-8 rounded-full bg-orange-600/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-orange-500"
                     viewBox="0 0 32 32" fill="none"
                     xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0z"
                    fill="#F7931A"/>
                  <path
                    d="M22.5 14.25c.375 2.5-1.5 3.875-4.125 4.75l.875 3.5-2 .5-.75-3.375c-.5.125-1.125.25-1.625.375l.75 3.375-2 .5-.875-3.5c-.5.125-1 .25-1.5.375l-2.75-1 1-2.25s1.5.5 1.5.375c.875-.25.875-1 .875-1.25l-1.5-6c-.125-.375-.5-.875-1.25-.625.25-.125-1.5-.375-1.5-.375l-.5-1.75 2.875.75c.5-.125.875-.25 1.375-.375l-.875-3.5 2-.5.875 3.5c.5-.125 1.125-.25 1.625-.375l-.875-3.5 2-.5.875 3.5c2.375-.375 4.125-.125 4.875 1.875.625 1.625 0 2.625-.875 3.25 1.25.25 2.125 1.125 2.25 2.875zM19 16.75c-.875-2.25-4.25-.875-5.25-.625l1 4c1-.25 4.375-1.25 4.25-3.375zm-1-5.75c-.75-2-3.375-.875-4.25-.625l.875 3.625c.875-.25 3.5-1 3.375-3z"
                    fill="#FFF"/>
                </svg>
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-full bg-gray-600/20 flex items-center justify-center mr-3">
                <WalletIcon className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div>
              <div className="font-semibold text-white">{wallet.name}</div>
              <div className="text-xs text-gray-400 flex items-center">
                {formatAddress(wallet.address)}
                <button
                  className="ml-1 text-gray-400 hover:text-[#a99fec]"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(wallet.address);
                    toast("Address copied", {
                      description: "Wallet address copied to clipboard"
                    });
                  }}
                >
                  <Copy size={12}/>
                </button>
              </div>
            </div>
          </div>
          <Badge className="bg-[#2a2a2a] text-[#a99fec] border border-[#3a3a3a]">
            {wallet.network === "ethereum" ? "Ethereum" : 
             wallet.network === "bnb" ? "BNB Chain" : 
             wallet.network === "tron" ? "Tron" : 
             wallet.network === "bitcoin" ? "Bitcoin" : wallet.network}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="font-bold text-xl text-white">
            {balanceVisible
              ? formatCurrency(wallet.balanceUSD || 0)
              : "••••••"
            }
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-400 mr-2">
              {balanceVisible
                ? `${wallet.balance || 0} ${
                    wallet.network === "ethereum" ? "ETH" : 
                    wallet.network === "bnb" ? "BNB" : 
                    wallet.network === "tron" ? "TRX" : 
                    wallet.network === "bitcoin" ? "BTC" : ""
                  }`
                : "••••••"
              }
            </span>
            <Badge
              className={`${wallet.changePercent24h >= 0 ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'} border-0 text-xs`}>
              {wallet.changePercent24h >= 0
                ? <TrendingUp className="w-3 h-3 mr-1"/>
                : <TrendingDown className="w-3 h-3 mr-1"/>
              }
              {wallet.changePercent24h.toFixed(2)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};