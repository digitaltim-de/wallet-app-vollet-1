"use client";

import { Plus, QrCode, Send, ArrowUpDown, ShoppingCart, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WalletCard } from "./WalletCard";

interface WalletListProps {
  wallets: any[];
  totalBalance: number;
  totalChangePercent: number;
  balanceVisible: boolean;
  onWalletSelect: (wallet: any) => void;
  onCreateWalletClick: () => void;
  onEarnClick: () => void;
  formatCurrency: (amount: number) => string;
}

export const WalletList = ({
  wallets,
  totalBalance,
  totalChangePercent,
  balanceVisible,
  onWalletSelect,
  onCreateWalletClick,
  onEarnClick,
  formatCurrency
}: WalletListProps) => {
  const totalChange = totalBalance * (totalChangePercent / 100);

  return (
    <div className="space-y-6">
      {/* Portfolio Balance Section */}
      <div className="text-center py-8">
        <div className="text-6xl font-light text-white mb-2">
          {balanceVisible ? formatCurrency(totalBalance) : "••••••"}
        </div>
        <div className="flex items-center justify-center space-x-2">
          <span className={`text-lg ${totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalChangePercent >= 0 ? '+' : ''}{formatCurrency(totalChange)}
          </span>
          <span className={`text-sm ${totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <button className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
            <QrCode className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-white text-sm font-medium">Receive</span>
        </button>
        
        <button className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
            <Send className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-white text-sm font-medium">Send</span>
        </button>
        
        <button className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
            <ArrowUpDown className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-white text-sm font-medium">Swap</span>
        </button>
        
        <button className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-2">
            <ShoppingCart className="w-6 h-6 text-orange-400" />
          </div>
          <span className="text-white text-sm font-medium">Buy</span>
        </button>
      </div>

      {/* Wallets Section */}
      <div className="space-y-4">
        {wallets.length > 0 ? (
          wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              balanceVisible={balanceVisible}
              onSelect={onWalletSelect}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No wallets yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Add your first wallet to start managing your crypto assets
            </p>
            <Button
              onClick={onCreateWalletClick}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 rounded-xl px-6 py-3"
            >
              <Plus className="w-4 h-4 mr-2"/>
              Create Wallet
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        <Button
          onClick={onCreateWalletClick}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 rounded-xl px-6 py-3 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2"/>
          Add Wallet
        </Button>
        <Button
          onClick={onEarnClick}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 rounded-xl px-6 py-3 shadow-lg"
        >
          <TrendingUp className="w-4 h-4 mr-2"/>
          EARN
        </Button>
      </div>
    </div>
  );
};
