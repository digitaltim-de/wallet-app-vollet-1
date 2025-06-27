"use client";

import { Plus, TrendingUp, WalletIcon } from "lucide-react";
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
  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-white">Portfolio</h1>
            <div className="flex items-center space-x-2">
              <div className="text-3xl font-bold text-[#a99fec]">
                {balanceVisible
                  ? formatCurrency(totalBalance)
                  : "••••••"
                }
              </div>
              <Badge
                className={`${totalChangePercent >= 0 ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'} border-0`}>
                {totalChangePercent >= 0
                  ? <TrendingUp className="w-3 h-3 mr-1"/>
                  : <TrendingDown className="w-3 h-3 mr-1"/>
                }
                {totalChangePercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Button
              onClick={onCreateWalletClick}
              className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
            >
              <Plus className="w-4 h-4 mr-2"/>
              Add Wallet
            </Button>
            <Button
              onClick={onEarnClick}
              className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
            >
              <TrendingUp className="w-4 h-4 mr-2"/>
              EARN
            </Button>
          </div>
        </div>
      </div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Your Wallets</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div
              className="col-span-full py-10 flex flex-col items-center justify-center bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-center">
              <WalletIcon className="h-12 w-12 text-[#a99fec] opacity-50 mb-4"/>
              <h3 className="text-lg font-medium text-white mb-2">No wallets yet</h3>
              <p className="text-gray-400 max-w-md mb-6">
                Add your first wallet to start managing your crypto assets
              </p>
              <Button
                onClick={onCreateWalletClick}
                className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
              >
                <Plus className="w-4 h-4 mr-2"/>
                Create New Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
