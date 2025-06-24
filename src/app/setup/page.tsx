"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, Wallet, Plus } from "lucide-react";
import { cryptowebapi } from "@/lib/cryptowebapi";
import { encryptPrivateKey } from "@/lib/crypto";
import { saveWallet } from "@/lib/db";
import { useWalletStore } from "@/lib/store";

export default function SetupPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(true);
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const unlock = useWalletStore((state) => state.unlock);

  // Handle wallet creation
  const handleCreateWallet = async () => {
    setError("");
    
    // Validate passphrase
    if (!passphrase) {
      setError("Passphrase is required");
      return;
    }
    
    if (passphrase !== confirmPassphrase) {
      setError("Passphrases do not match");
      return;
    }
    
    if (passphrase.length < 8) {
      setError("Passphrase must be at least 8 characters");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a new wallet using the API
      const network = "ethereum";
      const wallet = await cryptowebapi.createWallet(network);
      
      // Encrypt the private key
      const encryptedData = await encryptPrivateKey(wallet.privateKey, passphrase);
      
      // Extract the components from the encrypted data
      const encryptedBytes = new Uint8Array(atob(encryptedData).split("").map(c => c.charCodeAt(0)));
      const salt = encryptedBytes.slice(0, 16);
      const iv = encryptedBytes.slice(16, 28);
      const ciphertext = encryptedBytes.slice(28);
      
      // Save the wallet to IndexedDB
      await saveWallet({
        address: wallet.address,
        network,
        salt,
        iv,
        ciphertext
      });
      
      // Unlock the wallet
      await unlock(passphrase, wallet.address);
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to create wallet:", err);
      setError("Failed to create wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet import
  const handleImportWallet = async () => {
    setError("");
    
    // Validate inputs
    if (!passphrase) {
      setError("Passphrase is required");
      return;
    }
    
    if (passphrase !== confirmPassphrase) {
      setError("Passphrases do not match");
      return;
    }
    
    if (!privateKey) {
      setError("Private key is required");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Validate private key format
      if (!privateKey.match(/^(0x)?[0-9a-fA-F]{64}$/)) {
        setError("Invalid private key format");
        return;
      }
      
      // Remove 0x prefix if present
      const pkHex = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
      
      // Derive the address from the private key
      const network = "ethereum";
      const wallet = new ethers.Wallet(pkHex);
      const address = wallet.address;
      
      // Encrypt the private key
      const encryptedData = await encryptPrivateKey(pkHex, passphrase);
      
      // Extract the components from the encrypted data
      const encryptedBytes = new Uint8Array(atob(encryptedData).split("").map(c => c.charCodeAt(0)));
      const salt = encryptedBytes.slice(0, 16);
      const iv = encryptedBytes.slice(16, 28);
      const ciphertext = encryptedBytes.slice(28);
      
      // Save the wallet to IndexedDB
      await saveWallet({
        address,
        network,
        salt,
        iv,
        ciphertext
      });
      
      // Unlock the wallet
      await unlock(passphrase, address);
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to import wallet:", err);
      setError("Failed to import wallet. Please check your private key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <Wallet className="w-12 h-12 text-gray-700" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          {isCreating ? "Create New Wallet" : "Import Existing Wallet"}
        </h1>
        <p className="text-gray-600 text-xl">
          {isCreating 
            ? "Set up a secure passphrase to protect your wallet" 
            : "Import your wallet using your private key"}
        </p>
      </div>

      <Card className="max-w-md mx-auto border-2 border-blue-100 rounded-2xl shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-blue-500 mr-3" />
            <h3 className="font-semibold text-gray-900">Security First</h3>
          </div>
          <p className="text-sm text-gray-600">
            Your wallet will be encrypted and stored securely on your device. 
            We never store your passphrase or private key on our servers.
          </p>
        </CardContent>
      </Card>

      <div className="max-w-md mx-auto w-full">
        <div className="flex mb-6">
          <Button
            variant={isCreating ? "default" : "outline"}
            className={`flex-1 ${isCreating ? "bg-gray-900 text-white" : "border-2 border-gray-200 text-gray-700"}`}
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New
          </Button>
          <Button
            variant={!isCreating ? "default" : "outline"}
            className={`flex-1 ${!isCreating ? "bg-gray-900 text-white" : "border-2 border-gray-200 text-gray-700"}`}
            onClick={() => setIsCreating(false)}
          >
            <Key className="w-5 h-5 mr-2" />
            Import Existing
          </Button>
        </div>

        <div className="space-y-4">
          {!isCreating && (
            <div>
              <Label htmlFor="private-key" className="text-sm font-medium text-gray-700">
                Private Key
              </Label>
              <Input
                id="private-key"
                type="password"
                placeholder="Enter your private key (hex format)"
                className="mt-1 h-12 rounded-xl border-gray-200"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="passphrase" className="text-sm font-medium text-gray-700">
              Passphrase
            </Label>
            <Input
              id="passphrase"
              type="password"
              placeholder="Enter a strong passphrase"
              className="mt-1 h-12 rounded-xl border-gray-200"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="confirm-passphrase" className="text-sm font-medium text-gray-700">
              Confirm Passphrase
            </Label>
            <Input
              id="confirm-passphrase"
              type="password"
              placeholder="Confirm your passphrase"
              className="mt-1 h-12 rounded-xl border-gray-200"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={isCreating ? handleCreateWallet : handleImportWallet}
            className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-sm mt-4"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : isCreating ? "Create Wallet" : "Import Wallet"}
          </Button>
        </div>
      </div>
    </div>
  );
}