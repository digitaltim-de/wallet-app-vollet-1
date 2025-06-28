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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  createWalletForm: {
    name: string;
    network: "ethereum" | "bnb" | "tron" | "bitcoin";
    passphrase: string;
  };
  importWalletForm: {
    name: string;
    network: "ethereum" | "bnb" | "tron" | "bitcoin";
    mnemonic: string;
    passphrase: string;
  };
  setCreateWalletForm: (form: any) => void;
  setImportWalletForm: (form: any) => void;
  onCreateWallet: (e: React.FormEvent) => void;
  onImportWallet: (e: React.FormEvent) => void;
  isCreatingWallet: boolean;
  isImportingWallet: boolean;
}

export const CreateWalletModal = ({
  isOpen,
  onClose,
  createWalletForm,
  importWalletForm,
  setCreateWalletForm,
  setImportWalletForm,
  onCreateWallet,
  onImportWallet,
  isCreatingWallet,
  isImportingWallet
}: CreateWalletModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#2a2a2a] text-white border-[#3a3a3a] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Wallet Management</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new wallet or add an existing one to your portfolio.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-[#333333]">
            <TabsTrigger value="create" className="text-white data-[state=active]:bg-[#444444]">Create New</TabsTrigger>
            <TabsTrigger value="import" className="text-white data-[state=active]:bg-[#444444]">Add Existing</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
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
                  <Label htmlFor="create-passphrase" className="text-white">Your Passphrase</Label>
                  <Input
                    id="create-passphrase"
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
          </TabsContent>

          <TabsContent value="import">
            <form onSubmit={onImportWallet}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="import-name" className="text-white">Wallet Name</Label>
                  <Input
                    id="import-name"
                    placeholder="My Imported Wallet"
                    value={importWalletForm.name}
                    onChange={(e) => setImportWalletForm({
                      ...importWalletForm,
                      name: e.target.value
                    })}
                    required
                    className="bg-[#222222] border-[#3a3a3a] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-network" className="text-white">Network</Label>
                  <Select
                    value={importWalletForm.network}
                    onValueChange={(value) => setImportWalletForm({
                      ...importWalletForm,
                      network: value as "ethereum" | "bnb" | "tron" | "bitcoin"
                    })}
                  >
                    <SelectTrigger id="import-network" className="bg-[#222222] border-[#3a3a3a] text-white">
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
                  <Label htmlFor="mnemonic" className="text-white">Seed Phrase (Mnemonic)</Label>
                  <Input
                    id="mnemonic"
                    placeholder="Enter your seed phrase"
                    value={importWalletForm.mnemonic}
                    onChange={(e) => setImportWalletForm({
                      ...importWalletForm,
                      mnemonic: e.target.value
                    })}
                    required
                    className="bg-[#222222] border-[#3a3a3a] text-white"
                  />
                  <p className="text-xs text-gray-400">
                    Enter your seed phrase words separated by spaces.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-passphrase" className="text-white">Your Passphrase</Label>
                  <Input
                    id="import-passphrase"
                    type="password"
                    placeholder="Enter your login passphrase"
                    value={importWalletForm.passphrase}
                    onChange={(e) => setImportWalletForm({
                      ...importWalletForm,
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
                  disabled={isImportingWallet}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
                  disabled={isImportingWallet}
                >
                  {isImportingWallet ? "Importing..." : "Import Wallet"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
