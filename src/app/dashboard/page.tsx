"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  WalletIcon,
  ExternalLink,
} from "lucide-react";
import { CryptoWebApi } from "@/lib/cryptowebapi";
import { useAccountStore } from "@/store/account";
import { RouteGuard } from "@/components/route-guard";

// Initialize API client
const apiClient = new CryptoWebApi(process.env.NEXT_PUBLIC_CRYPTOWEBAPI_KEY || "");

// Types
interface Token {
  symbol: string;
  name: string;
  balance: number;
  balanceUSD: number;
  price: number;
  change24h: number;
}

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  symbol: string;
  to?: string;
  from?: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  hash: string;
}

interface Wallet {
  id: string;
  name: string;
  address: string;
  network: "ethereum" | "bnb";
  balance: number;
  balanceUSD: number;
  change24h: number;
  changePercent24h: number;
  tokens: Token[];
  transactions: Transaction[];
}

// Default mock data
const defaultWallets: Wallet[] = [
  {
    id: "1",
    name: "Main Wallet",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    network: "ethereum",
    balance: 2.45,
    balanceUSD: 4892.5,
    change24h: 156.78,
    changePercent24h: 3.31,
    tokens: [
      {
        symbol: "ETH",
        name: "Ethereum",
        balance: 2.45,
        balanceUSD: 4892.5,
        price: 1997.96,
        change24h: 3.31,
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        balance: 1250.0,
        balanceUSD: 1250.0,
        price: 1.0,
        change24h: 0.01,
      },
    ],
    transactions: [
      {
        id: "tx1",
        type: "send",
        amount: 0.5,
        symbol: "ETH",
        to: "0xabcdef1234567890abcdef1234567890abcdef12",
        timestamp: Date.now() - 3600000,
        status: "confirmed",
        hash: "0x123...",
      },
      {
        id: "tx2",
        type: "receive",
        amount: 1.2,
        symbol: "ETH",
        from: "0xfedcba0987654321fedcba0987654321fedcba09",
        timestamp: Date.now() - 7200000,
        status: "confirmed",
        hash: "0x456...",
      },
    ],
  },
  {
    id: "2",
    name: "Trading Wallet",
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    network: "bnb",
    balance: 45.67,
    balanceUSD: 2834.15,
    change24h: -89.23,
    changePercent24h: -3.05,
    tokens: [
      {
        symbol: "BNB",
        name: "Binance Coin",
        balance: 45.67,
        balanceUSD: 2834.15,
        price: 62.05,
        change24h: -3.05,
      },
    ],
    transactions: [
      {
        id: "tx3",
        type: "send",
        amount: 10.0,
        symbol: "BNB",
        to: "0x9876543210abcdef9876543210abcdef98765432",
        timestamp: Date.now() - 1800000,
        status: "confirmed",
        hash: "0x789...",
      },
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { lock } = useAccountStore();

  const [wallets, setWallets] = useState<Wallet[]>(defaultWallets);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Form state for adding wallets
  const [newWalletForm, setNewWalletForm] = useState({
    name: "",
    address: "",
    network: "ethereum" as "ethereum" | "bnb",
    balance: "",
    balanceUSD: "",
  });

  // Calculations
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balanceUSD, 0);
  const totalChange = wallets.reduce((sum, wallet) => sum + wallet.change24h, 0);
  const totalChangePercent = totalBalance > 0 ? (totalChange / (totalBalance - totalChange)) * 100 : 0;

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format time for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Event handlers
  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWalletForm.name || !newWalletForm.address || !newWalletForm.balance || !newWalletForm.balanceUSD) {
      return;
    }

    const balanceNum = Number.parseFloat(newWalletForm.balance);
    const balanceUSDNum = Number.parseFloat(newWalletForm.balanceUSD);

    const newWallet: Wallet = {
      id: Date.now().toString(),
      name: newWalletForm.name,
      address: newWalletForm.address,
      network: newWalletForm.network,
      balance: balanceNum,
      balanceUSD: balanceUSDNum,
      change24h: 0,
      changePercent24h: 0,
      tokens: [],
      transactions: [],
    };

    setWallets([...wallets, newWallet]);
    setShowAddModal(false);
    setNewWalletForm({
      name: "",
      address: "",
      network: "ethereum",
      balance: "",
      balanceUSD: "",
    });
  };

  const handleWalletSelect = (wallet: Wallet) => {
    setSelectedWallet(wallet);
  };

  const handleBackToList = () => {
    setSelectedWallet(null);
  };

  // Render wallet list view or wallet detail view
  return (
    <RouteGuard>
      <div className="min-h-screen text-gray-900 bg-white">
        {selectedWallet ? (
          // Wallet Detail View
          <>
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-gray-200 bg-white">
              <Button variant="ghost" size="icon" onClick={handleBackToList} className="text-gray-600 hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{selectedWallet.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{formatAddress(selectedWallet.address)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-500 hover:text-gray-700"
                    onClick={() => copyToClipboard(selectedWallet.address)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`ml-auto ${
                  selectedWallet.network === "ethereum" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                }`}
              >
                {selectedWallet.network === "ethereum" ? "Ethereum" : "BNB Chain"}
              </Badge>
            </div>

            {/* Balance Section */}
            <div className="p-6 text-center bg-white">
              <div className="text-4xl font-bold mb-2 text-gray-900">{formatCurrency(selectedWallet.balanceUSD)}</div>
              <div
                className={`flex items-center justify-center gap-2 text-lg ${
                  selectedWallet.change24h >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {selectedWallet.change24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span>
                  {selectedWallet.change24h >= 0 ? "+" : ""}
                  {formatCurrency(selectedWallet.change24h)}
                </span>
                <span>
                  {selectedWallet.change24h >= 0 ? "+" : ""}
                  {selectedWallet.changePercent24h.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 mb-8">
              <div className="flex gap-3 justify-center">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 min-w-[80px]"
                  onClick={() => {}}
                >
                  Receive
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 min-w-[80px]"
                  onClick={() => {}}
                >
                  Buy
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 min-w-[80px]"
                  onClick={() => router.push("/send")}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6">
              <Tabs defaultValue="tokens" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="tokens" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Tokens
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Transactions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tokens" className="space-y-4 mt-6">
                  {selectedWallet.tokens.map((token, index) => (
                    <Card key={index} className="bg-white border-gray-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{token.symbol}</span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{token.name}</div>
                              <div className="text-sm text-gray-500">
                                {token.balance.toFixed(4)} {token.symbol}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{formatCurrency(token.balanceUSD)}</div>
                            <div className={`text-sm ${token.change24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {token.change24h >= 0 ? "+" : ""}
                              {token.change24h.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4 mt-6">
                  {selectedWallet.transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No transactions found</div>
                  ) : (
                    selectedWallet.transactions.map((tx) => (
                      <Card key={tx.id} className="bg-white border-gray-200 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  tx.type === "send" ? "bg-red-100" : "bg-green-100"
                                }`}
                              >
                                {tx.type === "send" ? (
                                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                                ) : (
                                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 capitalize">{tx.type}</div>
                                <div className="text-sm text-gray-500">
                                  {tx.type === "send" ? "To" : "From"}: {formatAddress(tx.to || tx.from || "")}
                                </div>
                                <div className="text-xs text-gray-400">{formatTime(tx.timestamp)}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-semibold ${tx.type === "send" ? "text-red-600" : "text-green-600"}`}>
                                {tx.type === "send" ? "-" : "+"}
                                {tx.amount} {tx.symbol}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Badge variant={tx.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                                  {tx.status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 text-gray-500 hover:text-gray-700"
                                  onClick={() => {}}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          // Wallet List View
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">BluePay Wallet</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:bg-gray-100"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:bg-gray-100"
                  onClick={() => {
                    lock();
                    router.push("/login-or-create");
                  }}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Total Portfolio Value */}
            <div className="p-6 text-center bg-white">
              <div className="text-5xl font-bold mb-2 text-gray-900">
                {balanceVisible ? formatCurrency(totalBalance) : "••••••••"}
              </div>
              <div
                className={`flex items-center justify-center gap-2 text-lg ${
                  totalChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {balanceVisible ? (
                  <>
                    <span>
                      {totalChange >= 0 ? "+" : ""}
                      {formatCurrency(totalChange)}
                    </span>
                    <span>
                      {totalChange >= 0 ? "+" : ""}
                      {totalChangePercent.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <span>••••••••</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 mb-8">
              <div className="flex gap-3 justify-center">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 min-w-[80px]"
                  onClick={() => {}}
                >
                  Receive
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 min-w-[80px]"
                  onClick={() => {}}
                >
                  Buy
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 min-w-[80px]"
                  onClick={() => router.push("/send")}
                >
                  Send
                </Button>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3 min-w-[80px]"
                >
                  Create
                </Button>
              </div>
            </div>

            {/* Wallets List */}
            <div className="px-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Your Wallets</h2>
              </div>

              {wallets.map((wallet) => (
                <Card
                  key={wallet.id}
                  className="bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                  onClick={() => handleWalletSelect(wallet)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-white">{wallet.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{wallet.name}</div>
                          <div className="text-sm text-gray-500">{formatAddress(wallet.address)}</div>
                          <Badge
                            variant="secondary"
                            className={`mt-1 text-xs ${
                              wallet.network === "ethereum" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {wallet.network === "ethereum" ? "Ethereum" : "BNB Chain"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {balanceVisible ? formatCurrency(wallet.balanceUSD) : "••••••••"}
                        </div>
                        <div
                          className={`text-sm flex items-center gap-1 ${
                            wallet.change24h >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {wallet.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {balanceVisible ? (
                            <span>
                              {wallet.change24h >= 0 ? "+" : ""}
                              {wallet.changePercent24h.toFixed(2)}%
                            </span>
                          ) : (
                            <span>••••</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Add Wallet Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="bg-white border-gray-200 text-gray-900">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Add New Wallet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddWallet} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-700">
                  Wallet Name
                </Label>
                <Input
                  id="name"
                  value={newWalletForm.name}
                  onChange={(e) => setNewWalletForm({ ...newWalletForm, name: e.target.value })}
                  placeholder="My Wallet"
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>

              <div>
                <Label htmlFor="network" className="text-gray-700">
                  Network
                </Label>
                <Select
                  value={newWalletForm.network}
                  onValueChange={(value: "ethereum" | "bnb") => setNewWalletForm({ ...newWalletForm, network: value })}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="bnb">BNB Chain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address" className="text-gray-700">
                  Wallet Address
                </Label>
                <Input
                  id="address"
                  value={newWalletForm.address}
                  onChange={(e) => setNewWalletForm({ ...newWalletForm, address: e.target.value })}
                  placeholder={
                    newWalletForm.network === "ethereum" ? "0x..." : "bnb..."
                  }
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="balance" className="text-gray-700">
                    Balance
                  </Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.0001"
                    value={newWalletForm.balance}
                    onChange={(e) => setNewWalletForm({ ...newWalletForm, balance: e.target.value })}
                    placeholder="0.0"
                    className="bg-white border-gray-300 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="balanceUSD" className="text-gray-700">
                    Balance (USD)
                  </Label>
                  <Input
                    id="balanceUSD"
                    type="number"
                    step="0.01"
                    value={newWalletForm.balanceUSD}
                    onChange={(e) => setNewWalletForm({ ...newWalletForm, balanceUSD: e.target.value })}
                    placeholder="0.00"
                    className="bg-white border-gray-300 text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  Add Wallet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
