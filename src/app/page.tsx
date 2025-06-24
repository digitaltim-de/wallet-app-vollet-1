"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Plus,
  QrCode,
  Scan,
  Settings,
  Shield,
  Wallet,
  Zap,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Lock,
  Key,
} from "lucide-react"

export default function Component() {
  const [currentView, setCurrentView] = useState("welcome")
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState(null)

  const assets = [
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: "2.45",
      value: "$4,890.50",
      change: "+5.2%",
      positive: true,
      icon: "⟠",
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: "0.125",
      value: "$5,250.00",
      change: "+2.1%",
      positive: true,
      icon: "₿",
    },
    { symbol: "SOL", name: "Solana", balance: "45.8", value: "$1,832.00", change: "-1.8%", positive: false, icon: "◎" },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: "1,250.00",
      value: "$1,250.00",
      change: "0.0%",
      positive: true,
      icon: "$",
    },
  ]

  const nfts = [
    { name: "Bored Ape #1234", collection: "BAYC", image: "/placeholder.svg?height=100&width=100" },
    { name: "CryptoPunk #5678", collection: "CryptoPunks", image: "/placeholder.svg?height=100&width=100" },
    { name: "Azuki #9012", collection: "Azuki", image: "/placeholder.svg?height=100&width=100" },
  ]

  const transactions = [
    { type: "received", asset: "ETH", amount: "+0.5", value: "+$1,000.00", from: "0x1234...5678", time: "2 hours ago" },
    { type: "sent", asset: "USDC", amount: "-250.00", value: "-$250.00", to: "0x9876...5432", time: "1 day ago" },
    { type: "swap", asset: "SOL → ETH", amount: "10 → 0.25", value: "$400.00", time: "3 days ago" },
  ]

  const dapps = [
    { name: "Uniswap", category: "DEX", icon: "🦄", description: "Decentralized Exchange" },
    { name: "OpenSea", category: "NFT", icon: "🌊", description: "NFT Marketplace" },
    { name: "Compound", category: "DeFi", icon: "🏦", description: "Lending Protocol" },
    { name: "Aave", category: "DeFi", icon: "👻", description: "Liquidity Protocol" },
  ]

  const WelcomeScreen = () => (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center">
      <div className="text-center mb-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <Wallet className="w-12 h-12 text-gray-700" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to BlueWallet</h1>
        <p className="text-gray-600 text-xl">Your secure gateway to the decentralized world</p>
      </div>

      <div className="space-y-6">
        <Button
          onClick={() => setCurrentView("create-wallet")}
          className="w-full h-16 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-sm text-lg"
        >
          <Plus className="w-6 h-6 mr-3" />
          Create New Wallet
        </Button>

        <Button
          onClick={() => setCurrentView("import-wallet")}
          variant="outline"
          className="w-full h-16 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 text-lg"
        >
          <Key className="w-6 h-6 mr-3" />
          Import Existing Wallet
        </Button>
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-gray-500 mb-6">Trusted by millions worldwide</p>
        <div className="flex justify-center space-x-6">
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-base">
            🔒 Bank-level Security
          </Badge>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-base">
            ⚡ Lightning Fast
          </Badge>
        </div>
      </div>
    </div>
  )

  const CreateWalletScreen = () => (
    <div className="min-h-screen bg-white p-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => setCurrentView("welcome")} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Wallet</h1>
        <p className="text-gray-600 mt-2">Secure your wallet with a strong password</p>
      </div>

      <div className="space-y-6">
        <Card className="border-2 border-blue-100 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="font-semibold text-gray-900">Security First</h3>
            </div>
            <p className="text-sm text-gray-600">
              Your wallet will be encrypted and stored securely on your device. Make sure to backup your recovery
              phrase.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a strong password"
              className="mt-1 h-12 rounded-xl border-gray-200"
            />
          </div>

          <div>
            <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              className="mt-1 h-12 rounded-xl border-gray-200"
            />
          </div>
        </div>

        <Button
          onClick={() => setCurrentView("backup-phrase")}
          className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-sm mt-8"
        >
          Continue
        </Button>
      </div>
    </div>
  )

  const ImportWalletScreen = () => (
    <div className="min-h-screen bg-white p-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => setCurrentView("welcome")} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Import Wallet</h1>
        <p className="text-gray-600 mt-2">Enter your recovery phrase to restore your wallet</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="recovery-phrase" className="text-sm font-medium text-gray-700">
            Recovery Phrase
          </Label>
          <textarea
            id="recovery-phrase"
            placeholder="Enter your 12 or 24 word recovery phrase separated by spaces"
            className="mt-1 w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <Label htmlFor="wallet-password" className="text-sm font-medium text-gray-700">
            New Password
          </Label>
          <Input
            id="wallet-password"
            type="password"
            placeholder="Create a password for this wallet"
            className="mt-1 h-12 rounded-xl border-gray-200"
          />
        </div>

        <Button
          onClick={() => setCurrentView("dashboard")}
          className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-sm"
        >
          Import Wallet
        </Button>
      </div>
    </div>
  )

  const DashboardScreen = () => (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white p-8 rounded-b-3xl shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Avatar className="w-12 h-12 mr-4">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-blue-100 text-blue-600">BW</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-gray-600">Good morning</p>
              <p className="font-semibold text-gray-900 text-lg">Alex</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("settings")} className="rounded-full">
            <Settings className="w-6 h-6" />
          </Button>
        </div>

        {/* Portfolio Balance */}
        <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-lg">Total Portfolio</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-gray-600 hover:bg-gray-100"
              >
                {balanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>
            </div>
            <p className="text-4xl font-bold mb-2 text-gray-900">{balanceVisible ? "$13,222.50" : "••••••••"}</p>
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              <p className="text-base text-green-500">+$234.50 (1.8%) today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="p-8">
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Button
            onClick={() => setCurrentView("send")}
            variant="outline"
            className="h-24 flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50"
          >
            <ArrowUpRight className="w-8 h-8 text-gray-700 mb-3" />
            <span className="text-sm text-gray-600 font-medium">Send</span>
          </Button>
          <Button
            onClick={() => setCurrentView("receive")}
            variant="outline"
            className="h-24 flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50"
          >
            <ArrowDownLeft className="w-8 h-8 text-green-500 mb-3" />
            <span className="text-sm text-gray-700 font-medium">Receive</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50"
          >
            <Scan className="w-8 h-8 text-purple-500 mb-3" />
            <span className="text-sm text-gray-700 font-medium">Scan</span>
          </Button>
          <Button
            onClick={() => setCurrentView("dapps")}
            variant="outline"
            className="h-24 flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50"
          >
            <Globe className="w-8 h-8 text-orange-500 mb-3" />
            <span className="text-sm text-gray-700 font-medium">dApps</span>
          </Button>
        </div>

        {/* Assets */}
        <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Assets</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-500">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {assets.map((asset, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-xl">{asset.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{asset.symbol}</p>
                      <p className="text-sm text-gray-500">
                        {asset.balance} {asset.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-lg">{asset.value}</p>
                    <p className={`text-sm ${asset.positive ? "text-green-500" : "text-red-500"}`}>{asset.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const AssetsScreen = () => (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-white p-8 rounded-b-3xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Assets</h1>

        <Tabs defaultValue="tokens" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl">
            <TabsTrigger value="tokens" className="rounded-lg">
              Tokens
            </TabsTrigger>
            <TabsTrigger value="nfts" className="rounded-lg">
              NFTs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="mt-6">
            <div className="space-y-4">
              {assets.map((asset, index) => (
                <Card key={index} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-xl">{asset.icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{asset.name}</p>
                          <p className="text-sm text-gray-500">
                            {asset.balance} {asset.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{asset.value}</p>
                        <div className="flex items-center">
                          {asset.positive ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          <p className={`text-sm ${asset.positive ? "text-green-500" : "text-red-500"}`}>
                            {asset.change}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nfts" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {nfts.map((nft, index) => (
                <Card key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    <img src={nft.image || "/placeholder.svg"} alt={nft.name} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm text-gray-900 truncate">{nft.name}</p>
                    <p className="text-xs text-gray-500">{nft.collection}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  const SendScreen = () => (
    <div className="min-h-screen bg-white">
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("dashboard")} className="mr-4">
            ←
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Send</h1>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700">To</Label>
            <div className="mt-2 flex">
              <Input
                placeholder="Enter address or ENS name"
                className="flex-1 h-12 rounded-l-xl border-gray-200 focus:border-gray-400 focus:ring-gray-400"
              />
              <Button variant="outline" className="h-12 rounded-r-xl border-l-0 px-3">
                <QrCode className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Asset</Label>
            <Card className="mt-2 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-blue-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span>⟠</span>
                  </div>
                  <div>
                    <p className="font-semibold">Ethereum</p>
                    <p className="text-sm text-gray-500">Balance: 2.45 ETH</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Amount</Label>
            <div className="mt-2">
              <Input placeholder="0.00" className="h-16 text-2xl text-center rounded-xl" />
              <div className="flex justify-between mt-2">
                <Button variant="ghost" size="sm" className="text-blue-500">
                  25%
                </Button>
                <Button variant="ghost" size="sm" className="text-blue-500">
                  50%
                </Button>
                <Button variant="ghost" size="sm" className="text-blue-500">
                  75%
                </Button>
                <Button variant="ghost" size="sm" className="text-blue-500">
                  Max
                </Button>
              </div>
            </div>
          </div>

          <Card className="bg-gray-50 border-gray-200 rounded-xl">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Network Fee</span>
                <span className="text-sm font-semibold text-gray-900">$2.50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">$1,002.50</span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-sm">
            Review Transaction
          </Button>
        </div>
      </div>
    </div>
  )

  const ReceiveScreen = () => (
    <div className="min-h-screen bg-white">
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("dashboard")} className="mr-4">
            ←
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Receive</h1>
        </div>

        <div className="text-center">
          <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-sm">
            <div className="w-48 h-48 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-white text-xs">QR Code</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">Your Ethereum Address</p>

          <Card className="bg-gray-50 rounded-xl mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-gray-700 flex-1 mr-3">
                  0x1234567890abcdef1234567890abcdef12345678
                </p>
                <Button variant="ghost" size="icon" className="text-blue-500">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl">Copy Address</Button>
            <Button variant="outline" className="w-full h-12 border-2 border-blue-200 text-blue-600 rounded-xl">
              Share QR Code
            </Button>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Only send Ethereum and ERC-20 tokens to this address. Sending other
              cryptocurrencies may result in permanent loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const DAppsScreen = () => (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-white p-8 rounded-b-3xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">dApps</h1>
        <p className="text-gray-600">Discover and connect to decentralized applications</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 gap-4">
          {dapps.map((dapp, index) => (
            <Card
              key={index}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-4 text-center">
                <div className="text-4xl mb-3">{dapp.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{dapp.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{dapp.description}</p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  {dapp.category}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl border border-gray-200">
          <CardContent className="p-6 text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="font-bold text-lg mb-2 text-gray-900">Built-in Browser</h3>
            <p className="text-sm text-gray-600 mb-4">Access any dApp directly through our secure browser</p>
            <Button className="bg-gray-900 text-white hover:bg-gray-800">Open Browser</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const ActivityScreen = () => (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-white p-8 rounded-b-3xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
      </div>

      <div className="p-8">
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <Card key={index} className="bg-white rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        tx.type === "received" ? "bg-green-100" : tx.type === "sent" ? "bg-red-100" : "bg-blue-100"
                      }`}
                    >
                      {tx.type === "received" ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      ) : tx.type === "sent" ? (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      ) : (
                        <Zap className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{tx.type}</p>
                      <p className="text-sm text-gray-500">{tx.asset}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === "received" ? "text-green-600" : "text-gray-900"}`}>
                      {tx.amount}
                    </p>
                    <p className="text-sm text-gray-500">{tx.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const SettingsScreen = () => (
    <div className="min-h-screen bg-white">
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("dashboard")} className="mr-4">
            ←
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center">
                  <Lock className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="font-medium">Security</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center">
                  <Key className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="font-medium">Recovery Phrase</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="font-medium">Networks</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Your wallet is secure</h3>
                <p className="text-sm text-gray-600">
                  All transactions are encrypted and your private keys never leave your device.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const renderCurrentView = () => {
    switch (currentView) {
      case "welcome":
        return <WelcomeScreen />
      case "create-wallet":
        return <CreateWalletScreen />
      case "import-wallet":
        return <ImportWalletScreen />
      case "dashboard":
        return <DashboardScreen />
      case "assets":
        return <AssetsScreen />
      case "send":
        return <SendScreen />
      case "receive":
        return <ReceiveScreen />
      case "dapps":
        return <DAppsScreen />
      case "activity":
        return <ActivityScreen />
      case "settings":
        return <SettingsScreen />
      default:
        return <WelcomeScreen />
    }
  }

  return <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-xl">{renderCurrentView()}</div>
}
