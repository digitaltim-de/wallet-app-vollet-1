"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Plus,
  QrCode,
  Settings,
  Shield,
  Wallet,
  Zap,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  LogOut,
  Send,
} from "lucide-react";
import { CryptoWebApi } from "@/lib/cryptowebapi";

// Initialize API client
const apiClient = new CryptoWebApi(process.env.NEXT_PUBLIC_CRYPTOWEBAPI_KEY || "");

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });
  
  const [balanceVisible, setBalanceVisible] = useState(true);
  
  // Get wallet address and network from session
  const address = session?.user?.address as string;
  const network = session?.user?.network as "ethereum" | "bnb";
  
  // Fetch wallet balance
  const { data: balanceData, isLoading: balanceLoading, error: balanceError } = useQuery({
    queryKey: ["balance", network, address],
    queryFn: () => apiClient.getBalance(network, address),
    enabled: !!address && !!network,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Fetch transaction history
  const { data: txData, isLoading: txLoading, error: txError } = useQuery({
    queryKey: ["transactions", network, address],
    queryFn: () => apiClient.listTransactions(network, address, { limit: 10 }),
    enabled: !!address && !!network,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Handle navigation to send page
  const handleSend = () => {
    router.push("/send");
  };
  
  // Handle navigation to settings page
  const handleSettings = () => {
    router.push("/settings");
  };
  
  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };
  
  // Loading state
  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wallet...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Wallet className="w-6 h-6 mr-2" />
            <h1 className="text-xl font-bold">BluePay Wallet</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-primary/80"
              onClick={handleSettings}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-primary/80"
              onClick={() => router.push("/login")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 space-y-6">
        {/* Wallet Info */}
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Wallet Balance</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBalanceVisible(!balanceVisible)}
              >
                {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
            <CardDescription>
              {network === "ethereum" ? "Ethereum Network" : "BNB Chain"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col">
                <div className="text-3xl font-bold">
                  {balanceVisible
                    ? balanceLoading
                      ? "Loading..."
                      : balanceData?.balances?.[0]
                      ? formatCurrency(
                          parseFloat(balanceData.balances[0].balance) *
                            parseFloat(balanceData.balances[0].price || "0")
                        )
                      : "$0.00"
                    : "••••••••"}
                </div>
                <div className="text-sm text-gray-500">
                  {balanceVisible
                    ? balanceLoading
                      ? "Loading..."
                      : balanceData?.balances?.[0]
                      ? `${balanceData.balances[0].balance} ${balanceData.balances[0].symbol}`
                      : "0 ETH"
                    : "••••••••"}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 space-x-1">
                <div className="truncate flex-1">{address}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 w-full">
              <Button onClick={handleSend} className="flex items-center justify-center">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
              <Button variant="outline" onClick={handleSettings} className="flex items-center justify-center">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Token Balances */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Token Balances</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading tokens...</p>
              </div>
            ) : balanceError ? (
              <div className="text-center py-4 text-red-500">
                Failed to load token balances
              </div>
            ) : balanceData?.balances && balanceData.balances.length > 0 ? (
              <div className="space-y-4">
                {balanceData.balances.map((token, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-lg font-bold">{token.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-gray-500">
                          {balanceVisible ? token.balance : "••••••••"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {balanceVisible
                          ? formatCurrency(parseFloat(token.balance) * parseFloat(token.price || "0"))
                          : "••••••••"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No tokens found</div>
            )}
          </CardContent>
        </Card>
        
        {/* Transaction History */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading transactions...</p>
              </div>
            ) : txError ? (
              <div className="text-center py-4 text-red-500">
                Failed to load transaction history
              </div>
            ) : txData?.transactions && txData.transactions.length > 0 ? (
              <div className="space-y-3">
                {txData.transactions.map((tx, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 mr-3">
                      {tx.from.toLowerCase() === address.toLowerCase() ? (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="font-medium">
                          {tx.from.toLowerCase() === address.toLowerCase() ? "Sent" : "Received"}
                        </div>
                        <div className="font-medium">
                          {tx.from.toLowerCase() === address.toLowerCase() ? "-" : "+"}
                          {tx.valueDecimal} {tx.symbol}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <div className="truncate" style={{ maxWidth: "150px" }}>
                          {tx.from.toLowerCase() === address.toLowerCase()
                            ? `To: ${tx.to}`
                            : `From: ${tx.from}`}
                        </div>
                        <div>
                          {new Date(tx.timestamp * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No transactions found</div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button variant="outline" className="w-full">
              View All Transactions
            </Button>
          </CardFooter>
        </Card>
        
        {/* Security Tips */}
        <Card className="shadow-lg bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center mr-2 mt-0.5">
                  1
                </div>
                <span>Never share your private key or passphrase with anyone.</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center mr-2 mt-0.5">
                  2
                </div>
                <span>Always verify transaction details before sending.</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center mr-2 mt-0.5">
                  3
                </div>
                <span>Backup your wallet information in a secure location.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}