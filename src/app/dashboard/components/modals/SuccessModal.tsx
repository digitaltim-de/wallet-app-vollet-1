"use client";

import { Copy, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: {
    address: string;
    privateKey: string;
    mnemonic?: string;
    network: "ethereum" | "bnb" | "tron" | "bitcoin";
    name: string;
  } | null;
}

export const SuccessModal = ({
  isOpen,
  onClose,
  wallet
}: SuccessModalProps) => {
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!wallet) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#2a2a2a] text-white border-[#3a3a3a] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Wallet Created Successfully</DialogTitle>
          <DialogDescription className="text-gray-400">
            Your new {wallet.name} wallet has been created. Please save your private key and mnemonic phrase securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-yellow-900/20 border border-yellow-900/30 rounded-md">
            <div className="flex items-center text-yellow-500 mb-2">
              <Shield className="w-5 h-5 mr-2" />
              <span className="font-medium">Security Warning</span>
            </div>
            <p className="text-sm text-gray-300">
              Never share your private key or mnemonic phrase with anyone. Store them securely offline. Anyone with access to these can control your wallet.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Wallet Address</label>
            <div className="flex items-center">
              <div className="bg-[#222222] text-gray-300 text-sm p-2 rounded-md flex-1 overflow-x-auto">
                {wallet.address}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 text-gray-400 hover:text-[#a99fec]"
                onClick={() => {
                  copyToClipboard(wallet.address);
                  toast("Address copied", {
                    description: "Wallet address copied to clipboard"
                  });
                }}
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Private Key</label>
            <div className="flex items-center">
              <div className="bg-[#222222] text-gray-300 text-sm p-2 rounded-md flex-1 overflow-x-auto">
                {wallet.privateKey}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 text-gray-400 hover:text-[#a99fec]"
                onClick={() => {
                  copyToClipboard(wallet.privateKey);
                  toast("Private key copied", {
                    description: "Private key copied to clipboard"
                  });
                }}
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>

          {wallet.mnemonic && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Mnemonic Phrase</label>
              <div className="flex items-center">
                <div className="bg-[#222222] text-gray-300 text-sm p-2 rounded-md flex-1 overflow-x-auto">
                  {wallet.mnemonic}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-gray-400 hover:text-[#a99fec]"
                  onClick={() => {
                    copyToClipboard(wallet.mnemonic || "");
                    toast("Mnemonic copied", {
                      description: "Mnemonic phrase copied to clipboard"
                    });
                  }}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            className="w-full bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
            onClick={onClose}
          >
            I've Saved My Keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};