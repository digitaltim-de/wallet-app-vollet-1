"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { CryptoWebApi } from "@/lib/cryptowebapi";
import { getWallet } from "@/lib/db";
import { decryptPrivateKey, secureErase } from "@/lib/crypto";
import { createWalletClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, bsc } from "viem/chains";

// Initialize API client
const apiClient = new CryptoWebApi(process.env.NEXT_PUBLIC_CRYPTOWEBAPI_KEY || "");

export default function SendPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [selectedToken, setSelectedToken] = useState("native");
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState("");
  const [txHash, setTxHash] = useState("");
  
  // Get wallet address and network from session
  const address = session?.user?.address as string;
  const network = session?.user?.network as "ethereum" | "bnb";
  
  // Fetch wallet balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["balance", network, address],
    queryFn: () => apiClient.getBalance(network, address),
    enabled: !!address && !!network,
  });
  
  // Get chain configuration based on network
  const getChainConfig = () => {
    return network === "ethereum" ? mainnet : bsc;
  };
  
  // Validate recipient address
  const validateAddress = async () => {
    try {
      const validation = await apiClient.validateAddress(network, recipient);
      return validation.isValid;
    } catch (error) {
      console.error("Address validation error:", error);
      return false;
    }
  };
  
  // Estimate gas fee
  const estimateGasFee = async () => {
    try {
      // This would normally use viem's estimateGas function
      // For simplicity, we'll use a placeholder value
      const estimatedGasUnits = 21000; // Basic ETH transfer
      const gasPriceWei = parseEther(gasPrice || "0.000000005"); // Default to 5 Gwei
      const feeWei = BigInt(estimatedGasUnits) * gasPriceWei;
      
      setEstimatedFee(formatEther(feeWei));
      return true;
    } catch (error) {
      console.error("Gas estimation error:", error);
      setError("Failed to estimate gas fee. Please try again.");
      return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validate inputs
    if (!recipient || !amount) {
      setError("Please fill in all required fields");
      return;
    }
    
    // Validate recipient address
    const isValidAddress = await validateAddress();
    if (!isValidAddress) {
      setError("Invalid recipient address");
      return;
    }
    
    // Estimate gas fee
    const feeEstimated = await estimateGasFee();
    if (!feeEstimated) {
      return;
    }
    
    // Show confirmation modal
    setShowConfirmModal(true);
  };
  
  // Handle transaction confirmation
  const handleConfirm = () => {
    setShowConfirmModal(false);
    setShowPassphraseModal(true);
  };
  
  // Handle transaction signing and sending
  const handleSign = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Get wallet from IndexedDB
      const wallet = await getWallet(address);
      
      if (!wallet) {
        throw new Error("Wallet not found");
      }
      
      // Decrypt private key with passphrase
      const privateKeyHex = await decryptPrivateKey({
        salt: wallet.salt,
        iv: wallet.iv,
        ciphertext: wallet.ciphertext
      }, passphrase);
      
      if (!privateKeyHex) {
        throw new Error("Failed to decrypt private key");
      }
      
      // Create wallet client
      const account = privateKeyToAccount(`0x${privateKeyHex}`);
      const chain = getChainConfig();
      const client = createWalletClient({
        account,
        chain,
        transport: http()
      });
      
      // Prepare transaction
      const amountWei = parseEther(amount);
      const gasPriceWei = parseEther(gasPrice || "0.000000005"); // Default to 5 Gwei
      
      // Sign transaction
      const signedTx = await client.sendTransaction({
        to: recipient,
        value: amountWei,
        gasPrice: gasPriceWei
      });
      
      // Securely erase private key from memory
      secureErase(Buffer.from(privateKeyHex, 'hex'));
      
      // Send transaction to blockchain via API
      const result = await apiClient.sendRawTransaction(network, signedTx);
      
      // Show success message
      setTxHash(result.txHash);
      setSuccess(`Transaction sent successfully! Hash: ${result.txHash}`);
      
      // Reset form
      setRecipient("");
      setAmount("");
      setPassphrase("");
      
    } catch (error: any) {
      console.error("Transaction error:", error);
      setError(error.message || "Failed to send transaction. Please try again.");
    } finally {
      setIsLoading(false);
      setShowPassphraseModal(false);
    }
  };
  
  // Loading state
  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary p-4 text-white">
        <div className="container mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-primary/80 mr-2"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Send Transaction</h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <Card className="shadow-lg max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Send Funds</CardTitle>
            <CardDescription>
              Send crypto to another wallet address
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Token Selection */}
              <div className="space-y-2">
                <Label htmlFor="token">Select Token</Label>
                <select
                  id="token"
                  className="w-full p-2 border rounded-lg"
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                >
                  <option value="native">
                    {network === "ethereum" ? "ETH" : "BNB"} (Native)
                  </option>
                  {balanceData?.balances?.slice(1).map((token, index) => (
                    <option key={index} value={token.contractAddress || token.symbol}>
                      {token.symbol} - Balance: {token.balance}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Recipient Address */}
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>
              
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {selectedToken === "native" ? (network === "ethereum" ? "ETH" : "BNB") : selectedToken}
                  </div>
                </div>
                {balanceData?.balances && (
                  <div className="text-xs text-gray-500">
                    Balance: {
                      selectedToken === "native"
                        ? balanceData.balances[0]?.balance || "0"
                        : balanceData.balances.find(t => t.contractAddress === selectedToken || t.symbol === selectedToken)?.balance || "0"
                    }
                  </div>
                )}
              </div>
              
              {/* Gas Price */}
              <div className="space-y-2">
                <Label htmlFor="gas-price">Gas Price (ETH/BNB per gas unit)</Label>
                <Input
                  id="gas-price"
                  type="number"
                  step="0.000000001"
                  min="0.000000001"
                  placeholder="0.000000005"
                  value={gasPrice}
                  onChange={(e) => setGasPrice(e.target.value)}
                />
                <div className="text-xs text-gray-500">
                  Default: 5 Gwei (0.000000005 {network === "ethereum" ? "ETH" : "BNB"})
                </div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 p-3 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                  <span className="text-red-600">{error}</span>
                </div>
              )}
              
              {/* Success Message */}
              {success && (
                <div className="bg-green-50 p-3 rounded-lg flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                  <div className="text-green-600">
                    <p>{success}</p>
                    {txHash && (
                      <a
                        href={`https://${network === "ethereum" ? "etherscan.io" : "bscscan.com"}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline text-sm"
                      >
                        View on {network === "ethereum" ? "Etherscan" : "BscScan"}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Processing..." : "Continue"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">From</div>
                <div className="font-medium truncate">{address}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">To</div>
                <div className="font-medium truncate">{recipient}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Amount</div>
                <div className="font-medium">
                  {amount} {selectedToken === "native" ? (network === "ethereum" ? "ETH" : "BNB") : selectedToken}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Estimated Fee</div>
                <div className="font-medium">
                  {estimatedFee} {network === "ethereum" ? "ETH" : "BNB"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Total</div>
                <div className="font-medium">
                  {(parseFloat(amount) + parseFloat(estimatedFee)).toFixed(8)} {network === "ethereum" ? "ETH" : "BNB"}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                Confirm
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Passphrase Modal */}
      {showPassphraseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Enter Passphrase to Sign</CardTitle>
              <CardDescription>
                Your passphrase is needed to sign this transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passphrase">Wallet Passphrase</Label>
                  <Input
                    id="passphrase"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="bg-red-50 p-3 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <span className="text-red-600">{error}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPassphraseModal(false);
                  setPassphrase("");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleSign} disabled={isLoading}>
                {isLoading ? "Signing..." : "Sign & Send"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}