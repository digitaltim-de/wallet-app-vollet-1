"use client";

import { Copy, TrendingDown, TrendingUp, Eye } from "lucide-react";
import { toast } from "sonner";

interface WalletCardProps {
  wallet: {
    id: string;
    name: string;
    address: string;
    network: "ethereum" | "bnb" | "tron" | "bitcoin" | "solana";
    balance: number;
    balanceUSD: number;
    changePercent24h: number;
  };
  balanceVisible: boolean;
  onSelect: (wallet: any) => void;
  onAddressClick?: (address: string, walletName: string, coinSymbol?: string) => void;
}

// Network configurations
const networkConfig = {
  ethereum: {
    color: 'bg-blue-500',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '⟠'
  },
  solana: {
    color: 'bg-purple-500',
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎'
  },
  bitcoin: {
    color: 'bg-orange-500',
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿'
  },
  bnb: {
    color: 'bg-yellow-500',
    symbol: 'BNB',
    name: 'BNB Chain',
    icon: '🔶'
  },
  tron: {
    color: 'bg-red-500',
    symbol: 'TRX',
    name: 'Tron',
    icon: '🔺'
  }
};

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

  // Format crypto balance
  const formatCryptoBalance = (balance: number, decimals: number = 4) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    }).format(balance);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard");
  };

  const config = networkConfig[wallet.network] || networkConfig.ethereum;

  return (
    <div
      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/20 transition-all"
      onClick={() => onSelect(wallet)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${config.color} rounded-full flex items-center justify-center`}>
            <span className="text-white text-lg font-bold">{config.icon}</span>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{config.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-xs">{formatAddress(wallet.address)}</span>
              <button
                onClick={(e) => copyToClipboard(wallet.address, e)}
                className="text-gray-500 hover:text-white p-1"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Eye size={16} className="text-gray-400" />
          <Copy size={16} className="text-gray-400" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">{formatCryptoBalance(wallet.balance)} {config.symbol}</span>
          <div className="flex items-center space-x-1">
            {wallet.changePercent24h >= 0 ? (
              <TrendingUp size={14} className="text-green-400" />
            ) : (
              <TrendingDown size={14} className="text-red-400" />
            )}
            <span className={`text-sm ${
              wallet.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {wallet.changePercent24h >= 0 ? '+' : ''}{wallet.changePercent24h.toFixed(2)}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">
            {balanceVisible ? formatCurrency(wallet.balanceUSD) : "••••••"}
          </span>
          <span className={`text-sm ${
            wallet.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {balanceVisible ? (
              wallet.changePercent24h >= 0 ? '+$0.09' : '-$0.69'
            ) : '••••'}
          </span>
        </div>
      </div>
    </div>
  );
};