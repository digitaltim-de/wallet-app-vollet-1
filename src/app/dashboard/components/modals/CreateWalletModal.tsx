"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  createWalletForm: {
    name: string;
    network: "ethereum" | "bnb" | "tron" | "bitcoin";
    passphrase: string;
  };
  setCreateWalletForm: (form: any) => void;
  onCreateWallet: (e: React.FormEvent) => void;
  isCreatingWallet: boolean;
}

export const CreateWalletModal = ({
  isOpen,
  onClose,
  createWalletForm,
  setCreateWalletForm,
  onCreateWallet,
  isCreatingWallet
}: CreateWalletModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#2a2a2a] text-white border-[#3a3a3a] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Wallet</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new wallet to your portfolio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onCreateWallet}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Wallet Name</Label>
              <Input
                id="name"
                placeholder="My Wallet"
                value={createWalletForm.name}
                onChange={(e) => setCreateWalletForm({
                  ...createWalletForm,
                  name: e.target.value
                })}
                required
                className="bg-[#222222] border-[#3a3a3a] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="network" className="text-white">Network</Label>
              <Select
                value={createWalletForm.network}
                onValueChange={(value) => setCreateWalletForm({
                  ...createWalletForm,
                  network: value as "ethereum" | "bnb" | "tron" | "bitcoin"
                })}
              >
                <SelectTrigger id="network" className="bg-[#222222] border-[#3a3a3a] text-white">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                  <SelectItem value="ethereum" className="text-white hover:bg-[#333333]">Ethereum</SelectItem>
                  <SelectItem value="bnb" className="text-white hover:bg-[#333333]">BNB Chain</SelectItem>
                  <SelectItem value="tron" className="text-white hover:bg-[#333333]">Tron</SelectItem>
                  <SelectItem value="bitcoin" className="text-white hover:bg-[#333333]">Bitcoin</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              disabled={isCreatingWallet}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
              disabled={isCreatingWallet}
            >
              {isCreatingWallet ? "Creating..." : "Create Wallet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};