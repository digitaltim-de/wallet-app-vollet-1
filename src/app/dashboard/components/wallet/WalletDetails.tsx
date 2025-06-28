"use client";

import React, { ReactNode } from 'react';
import { ArrowLeft, ExternalLink, Copy, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet as WalletType } from '@/lib/accountDb';
import { toast } from "sonner";

interface BalanceData {
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
  isToken: boolean;
  coin?: string;
  shortName?: string;
  tag?: string;
  type?: string;
  contractAddress?: string | null;
  balanceHex?: string;
}

interface WalletDetailsProps {
  wallet: WalletType;
  balanceVisible: boolean;
  onBackClick: () => void;
  formatCurrency: (amount: number) => string;
  walletBalances: BalanceData[];
  isLoadingBalance: boolean;
  children?: ReactNode;
}

export const WalletDetails: React.FC<WalletDetailsProps> = ({
  wallet,
  balanceVisible,
  onBackClick,
  formatCurrency,
  walletBalances,
  isLoadingBalance,
  children
}) => {
  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  // Get network display name
  const getNetworkDisplayName = (network: string) => {
    const networkNames: Record<string, string> = {
      ethereum: 'Ethereum',
      bnb: 'BNB Chain',
      tron: 'Tron',
      bitcoin: 'Bitcoin'
    };
    return networkNames[network] || network.charAt(0).toUpperCase() + network.slice(1);
  };

  // Network configurations
  const networkConfig: Record<string, { color: string, symbol: string, name: string, icon: string }> = {
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

  // Get network config
  const config = networkConfig[wallet.network] || networkConfig.ethereum;

  // Copy address to clipboard
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast.success("Address copied to clipboard");
  };

  // Open address in explorer
  const openInExplorer = () => {
    const explorers: Record<string, string> = {
      ethereum: 'etherscan.io',
      bnb: 'bscscan.com',
      tron: 'tronscan.org',
      bitcoin: 'blockchair.com/bitcoin',
      solana: 'solscan.io'
    };

    const explorer = explorers[wallet.network] || explorers.ethereum;
    window.open(`https://${explorer}/address/${wallet.address}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-2 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBackClick} 
          className="text-white hover:text-purple-400 hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold text-white">{wallet.name}</h2>
      </div>

      {/* Wallet Card */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${config.color} rounded-full flex items-center justify-center`}>
              <span className="text-white text-lg font-bold">{config.icon}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">{config.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-gray-400 text-xs">{formatAddress(wallet.address)}</span>
                <button
                  onClick={handleCopyAddress}
                  className="text-gray-500 hover:text-white p-1"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={openInExplorer}
                  className="text-gray-500 hover:text-white p-1"
                >
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mb-2">
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Wallet Balance</p>
            <p className="text-3xl font-semibold text-white">
              {balanceVisible ? formatCurrency(wallet.balanceUSD) : "••••••"}
            </p>
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Assets</h3>

        {isLoadingBalance ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : walletBalances.length > 0 ? (
          <div className="space-y-4">
            {walletBalances.map((token, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-mono">
                    {token.symbol.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{token.name || token.symbol}</p>
                    <p className="text-xs text-gray-400">{token.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {balanceVisible ? token.balance : "••••••"}
                  </p>
                  <p className="text-xs text-gray-400">{token.symbol}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white/5 rounded-xl">
            <p className="text-gray-400">No assets found</p>
          </div>
        )}
      </div>

      {/* Transactions and other content */}
      {children}
    </div>
  );
};

export default WalletDetails;