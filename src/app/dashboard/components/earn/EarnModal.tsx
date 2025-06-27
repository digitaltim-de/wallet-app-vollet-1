"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  supportedCoins: any[];
  existingWallets: any[];
  isLoading: boolean;
  onCoinSelect: (coin: any) => void;
  onCreateWallet: (e: React.FormEvent) => void;
  onUseExistingWallet: () => void;
  selectedCoin: any;
  useExistingWallet: boolean;
  setUseExistingWallet: (use: boolean) => void;
  selectedExistingWallet: string;
  setSelectedExistingWallet: (id: string) => void;
  createWalletForm: {
    passphrase: string;
  };
  setCreateWalletForm: (form: any) => void;
  isCreatingWallet: boolean;
}

export const EarnModal = ({
  isOpen,
  onClose,
  supportedCoins,
  existingWallets,
  isLoading,
  onCoinSelect,
  onCreateWallet,
  onUseExistingWallet,
  selectedCoin,
  useExistingWallet,
  setUseExistingWallet,
  selectedExistingWallet,
  setSelectedExistingWallet,
  createWalletForm,
  setCreateWalletForm,
  isCreatingWallet
}: EarnModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#2a2a2a] text-white border-[#3a3a3a] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Earn Crypto</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select a coin to earn rewards through staking or other methods.
          </DialogDescription>
        </DialogHeader>

        {!selectedCoin ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coin" className="text-white">Select Coin</Label>
              {isLoading ? (
                <div className="py-4 text-center text-gray-400">Loading coins...</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {supportedCoins.map((coin) => (
                    <Button
                      key={coin.id || coin.shortName}
                      variant="outline"
                      className="flex items-center justify-start space-x-2 h-auto py-3 bg-[#222222] border-[#3a3a3a] hover:bg-[#333333] hover:border-[#a99fec]"
                      onClick={() => onCoinSelect(coin)}
                    >
                      {coin.logoUrl && (
                        <img
                          src={coin.logoUrl}
                          alt={coin.name}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <div className="text-left">
                        <div className="font-medium text-white">{coin.shortName}</div>
                        <div className="text-xs text-gray-400">{coin.name}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3 mb-4">
              {selectedCoin.logoUrl && (
                <img
                  src={selectedCoin.logoUrl}
                  alt={selectedCoin.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <div className="font-medium text-white">{selectedCoin.shortName}</div>
                <div className="text-xs text-gray-400">{selectedCoin.name}</div>
              </div>
            </div>

            {existingWallets.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useExisting"
                    checked={useExistingWallet}
                    onChange={(e) => setUseExistingWallet(e.target.checked)}
                    className="rounded bg-[#222222] border-[#3a3a3a] text-[#a99fec]"
                  />
                  <Label htmlFor="useExisting" className="text-white">Use existing wallet</Label>
                </div>

                {useExistingWallet && (
                  <Select
                    value={selectedExistingWallet}
                    onValueChange={setSelectedExistingWallet}
                  >
                    <SelectTrigger className="bg-[#222222] border-[#3a3a3a] text-white">
                      <SelectValue placeholder="Select wallet" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                      {existingWallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id} className="text-white hover:bg-[#333333]">
                          {wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {!useExistingWallet && (
              <form onSubmit={onCreateWallet}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passphrase" className="text-white">Your Passphrase</Label>
                    <Input
                      id="passphrase"
                      type="password"
                      placeholder="Enter your login passphrase"
                      value={createWalletForm.passphrase}
                      onChange={(e) => setCreateWalletForm({
                        ...createWalletForm,
                        passphrase: e.target.value
                      })}
                      required
                      className="bg-[#222222] border-[#3a3a3a] text-white"
                    />
                    <p className="text-xs text-gray-400">
                      Your passphrase is required to encrypt the wallet's private key.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    type="submit"
                    className="w-full bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
                    disabled={isCreatingWallet}
                  >
                    {isCreatingWallet ? "Creating Wallet..." : "Create New Wallet"}
                  </Button>
                </div>
              </form>
            )}

            {useExistingWallet && (
              <div className="mt-4">
                <Button
                  onClick={onUseExistingWallet}
                  className="w-full bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
                  disabled={!selectedExistingWallet}
                >
                  Use Selected Wallet
                </Button>
              </div>
            )}

            <div className="mt-2">
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                onClick={() => onCoinSelect(null)}
              >
                Back to Coin Selection
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};