"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Copy, Eye, EyeOff, LogOut, Plus, Settings, Shield, TrendingDown, TrendingUp, WalletIcon} from "lucide-react";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useToast} from "@/components/ui/use-toast";
import {RouteGuard} from "@/components/route-guard";
import {CryptoWebApi} from "@/lib/cryptowebapi";
import {CryptoWebApiClient} from 'cryptowebapi-connector-js';
import {useAccountStore} from "@/store/account";
import {getAllWallets, saveWallet, Wallet as WalletType} from "@/lib/accountDb";
import {encryptPrivateKey} from "@/lib/crypto";

// Initialize API clients
const apiClient = new CryptoWebApi(process.env.NEXT_PUBLIC_CRYPTOWEBAPI_KEY || "");
const cryptoWebApiClient = new CryptoWebApiClient({
    apiKey: process.env.NEXT_PUBLIC_CRYPTOWEBAPI_KEY || "",
});

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

// API response interfaces
interface BalanceData {
    name: string;
    symbol: string;
    balance: string;
    decimals: number;
    isToken: boolean;
    coin?: string;
    shortName?: string;
    tag?: string;
    type?: string;
    contractAddress?: string | null;
    balanceHex?: string;
}

interface TransactionData {
    hash: string;
    blockNumber: string;
    timestamp: string; // ISO date format
    fromAddress: string;
    toAddress: string;
    valueDecimal: string;
    feeDecimal: string;
    status: string; // "confirmed", "pending", "failed"
    tokenSymbol: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const {lock, db} = useAccountStore();
    const {toast} = useToast();

    const [wallets, setWallets] = useState<WalletType[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [balanceVisible, setBalanceVisible] = useState(true);
    const [newlyCreatedWallet, setNewlyCreatedWallet] = useState<{
        address: string;
        privateKey: string;
        mnemonic?: string;
        network: "ethereum" | "bnb";
        name: string;
    } | null>(null);

    // States for API data
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [walletBalances, setWalletBalances] = useState<BalanceData[]>([]);
    const [walletTransactions, setWalletTransactions] = useState<TransactionData[]>([]);
    const [transactionTab, setTransactionTab] = useState<'all' | 'incoming' | 'outgoing'>('all');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalTransactions, setTotalTransactions] = useState(0);

    // Load wallets from IndexedDB on component mount
    useEffect(() => {
        const loadWallets = async () => {
            if (db) {
                try {
                    const loadedWallets = await getAllWallets(db);
                    setWallets(loadedWallets);
                } catch (error) {
                    console.error("Error loading wallets:", error);
                }
            }
        };

        loadWallets();
    }, [db]);

    // Form state for adding wallets
    const [newWalletForm, setNewWalletForm] = useState({
        name: "",
        address: "",
        network: "ethereum" as "ethereum" | "bnb",
        balance: "",
        balanceUSD: "",
    });

    // Form state for creating wallets
    const [createWalletForm, setCreateWalletForm] = useState({
        name: "",
        network: "ethereum" as "ethereum" | "bnb",
        passphrase: "",
    });

    // Loading state for wallet creation
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);

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
    const handleAddWallet = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newWalletForm.name || !newWalletForm.address || !newWalletForm.balance || !newWalletForm.balanceUSD || !db) {
            return;
        }

        alert('test');
        const balanceNum = Number.parseFloat(newWalletForm.balance);
        const balanceUSDNum = Number.parseFloat(newWalletForm.balanceUSD);

        const newWallet: WalletType = {
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

        try {
            // Save to IndexedDB
            await saveWallet(db, newWallet);

            // Update state
            setWallets([...wallets, newWallet]);
            setNewWalletForm({
                name: "",
                address: "",
                network: "ethereum",
                balance: "",
                balanceUSD: "",
            });
        } catch (error) {
            console.error("Error saving wallet:", error);
        }
    };

    // Function to fetch transactions based on the selected tab
    const fetchTransactions = async (wallet: WalletType, tab: 'all' | 'incoming' | 'outgoing', page = 1, perPage = itemsPerPage) => {
        if (!wallet) return;

        setIsLoadingTransactions(true);
        try {
            const params: any = {
                network: wallet.network,
                limit: perPage,
                offset: (page - 1) * perPage, // Calculate offset based on page number
                sortBy: 'timestamp',
                sortOrder: 'desc',
            };

            // Set the appropriate address parameter based on the selected tab
            if (tab === 'all') {
                params.address = wallet.address;
            } else if (tab === 'incoming') {
                params.toAddress = wallet.address;
            } else if (tab === 'outgoing') {
                params.fromAddress = wallet.address;
            }

            const transactions = await cryptoWebApiClient.listTransactions(params);

            if (transactions.success && transactions.data) {
                setWalletTransactions(transactions.data);

                // Store total count if available in the response
                // The API might return total count in different ways, check both possibilities
                if (transactions.total !== undefined) {
                    setTotalTransactions(transactions.total);
                } else if (transactions.meta && transactions.meta.total !== undefined) {
                    setTotalTransactions(transactions.meta.total);
                } else {
                    // If no total count is available, use the length of the data array
                    // This is not ideal but provides a fallback
                    console.warn('No total count available in API response, using data length as fallback');
                    setTotalTransactions(Math.max(totalTransactions, (page - 1) * perPage + transactions.data.length));
                }

                // Update current page
                setCurrentPage(page);

                // Update items per page if it changed
                if (perPage !== itemsPerPage) {
                    setItemsPerPage(perPage);
                }
            }
        } catch (error) {
            console.error("Error fetching wallet transactions:", error);
            toast({
                title: "Error",
                description: "Failed to fetch wallet transactions",
                variant: "destructive",
            });
        } finally {
            setIsLoadingTransactions(false);
        }
    };

    const handleWalletSelect = async (wallet: WalletType) => {
        setSelectedWallet(wallet);
        setTransactionTab('all'); // Reset to 'all' tab when selecting a new wallet

        // Fetch wallet balance
        setIsLoadingBalance(true);
        try {
            const balance = await cryptoWebApiClient.getWalletBalance({
                network: wallet.network,
                address: wallet.address,
                mode: 'mainnet'
            });

            if (balance.success && balance.data) {
                setWalletBalances(balance.data);

                // Update wallet with main coin balance
                const mainCoin = balance.data.find(coin => !coin.isToken);
                if (mainCoin) {
                    const mainCoinBalance = parseFloat(mainCoin.balance);
                    // TODO: Update wallet balance in state and DB
                }
            }
        } catch (error) {
            console.error("Error fetching wallet balance:", error);
            toast({
                title: "Error",
                description: "Failed to fetch wallet balance",
                variant: "destructive",
            });
        } finally {
            setIsLoadingBalance(false);
        }

        // Fetch wallet transactions for the 'all' tab
        await fetchTransactions(wallet, 'all');
    };

    // Handle tab change
    const handleTabChange = async (tab: 'all' | 'incoming' | 'outgoing') => {
        if (!selectedWallet) return;

        setTransactionTab(tab);
        // Reset to first page when changing tabs
        await fetchTransactions(selectedWallet, tab, 1, itemsPerPage);
    };

    const handleBackToList = () => {
        setSelectedWallet(null);
    };

    // Handle page change
    const handlePageChange = async (page: number) => {
        if (!selectedWallet) return;
        await fetchTransactions(selectedWallet, transactionTab, page, itemsPerPage);
    };

    // Handle items per page change
    const handleItemsPerPageChange = async (perPage: number) => {
        if (!selectedWallet) return;
        // When changing items per page, reset to first page
        await fetchTransactions(selectedWallet, transactionTab, 1, perPage);
    };

    // Handle wallet creation
    const handleCreateWallet = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!createWalletForm.name || !createWalletForm.network || !createWalletForm.passphrase || !db) {
            return;
        }

        setIsCreatingWallet(true);

        try {
            // Create wallet using CryptoWebApiClient
            const newWallet = await cryptoWebApiClient.createWallet({
                network: createWalletForm.network
            });

            console.log('newwalletData', newWallet);

            // Check if privateKey exists in the response
            if (!newWallet.key) {
                console.log(newWallet);
                throw new Error('Private key is missing in the wallet creation response');
            }

            // Encrypt private key and mnemonic with passphrase
            const encryptedPrivateKey = await encryptPrivateKey(newWallet.key, createWalletForm.passphrase);

            // Check if mnemonic exists in the response
            let encryptedMnemonic = undefined;
            if (newWallet.mnemonic && true) {
                encryptedMnemonic = await encryptPrivateKey(newWallet.mnemonic, createWalletForm.passphrase);
            }

            // Create wallet object
            const walletData: WalletType = {
                id: Date.now().toString(),
                name: createWalletForm.name,
                address: newWallet.address,
                network: createWalletForm.network,
                balance: 0,
                balanceUSD: 0,
                change24h: 0,
                changePercent24h: 0,
                tokens: [],
                transactions: [],
                encryptedPrivateKey,
                encryptedMnemonic,
            };

            // Save to IndexedDB
            await saveWallet(db, walletData);

            // Update state
            setWallets([...wallets, walletData]);

            // Store the newly created wallet data for the success screen
            setNewlyCreatedWallet({
                address: newWallet.address,
                privateKey: newWallet.key,
                mnemonic: newWallet.mnemonic,
                network: createWalletForm.network,
                name: createWalletForm.name
            });

            // Show success modal instead of closing create modal
            setShowCreateModal(false);
            setShowSuccessModal(true);

            // Reset form
            setCreateWalletForm({
                name: "",
                network: "ethereum",
                passphrase: "",
            });
        } catch (error) {
            console.error("Error creating wallet:", error);
            // Show error message to the user
            alert(`Error creating wallet2: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsCreatingWallet(false);
        }
    };

    return (
        <RouteGuard>
            <div className="min-h-screen bg-[#222222] text-white">
                <header className="border-b border-[#2a2a2a] p-4">
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <WalletIcon className="h-5 w-5 text-[#a99fec]"/>
                            <span className="font-bold text-lg text-[#a99fec]">Wollet APP</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setBalanceVisible(!balanceVisible)}
                                className="text-gray-400 hover:text-[#a99fec]"
                            >
                                {balanceVisible ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-[#a99fec]"
                            >
                                <Settings size={18}/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    lock();
                                    router.push("/login-or-create");
                                }}
                                className="text-gray-400 hover:text-[#a99fec]"
                            >
                                <LogOut size={18}/>
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto p-4 md:p-6">
                    {!selectedWallet ? (
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
                                            onClick={() => setShowCreateModal(true)}
                                            className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
                                        >
                                            <Plus className="w-4 h-4 mr-2"/>
                                            Add Wallet
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
                                            <Card
                                                key={wallet.id}
                                                className="bg-[#2a2a2a] border-[#2a2a2a] hover:border-[#a99fec] border transition-colors overflow-hidden cursor-pointer"
                                                onClick={() => handleWalletSelect(wallet)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center">
                                                            {wallet.network === "ethereum" ? (
                                                                <div
                                                                    className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center mr-3">
                                                                    <svg className="w-5 h-5 text-blue-500"
                                                                         viewBox="0 0 784.37 1277.39" fill="none"
                                                                         xmlns="http://www.w3.org/2000/svg">
                                                                        <path
                                                                            d="M392.07 0L383.5 29.11V873.74L392.07 882.29L784.13 650.54L392.07 0Z"
                                                                            fill="#343434"/>
                                                                        <path d="M392.07 0L0 650.54L392.07 882.29V472.33V0Z"
                                                                              fill="#8C8C8C"/>
                                                                        <path
                                                                            d="M392.07 956.52L387.24 962.41V1263.28L392.07 1277.38L784.37 724.89L392.07 956.52Z"
                                                                            fill="#3C3C3B"/>
                                                                        <path
                                                                            d="M392.07 1277.38V956.52L0 724.89L392.07 1277.38Z"
                                                                            fill="#8C8C8C"/>
                                                                        <path
                                                                            d="M392.07 882.29L784.13 650.54L392.07 472.33V882.29Z"
                                                                            fill="#141414"/>
                                                                        <path d="M0 650.54L392.07 882.29V472.33L0 650.54Z"
                                                                              fill="#393939"/>
                                                                    </svg>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className="w-8 h-8 rounded-full bg-yellow-600/20 flex items-center justify-center mr-3">
                                                                    <svg className="w-5 h-5 text-yellow-500"
                                                                         viewBox="0 0 2500 2500" fill="none"
                                                                         xmlns="http://www.w3.org/2000/svg">
                                                                        <path
                                                                            d="M764.48,1050.52,1250,565l485.75,485.73,282.5-282.5L1250,0,482,768l282.49,282.5"
                                                                            fill="#F0B90B"/>
                                                                        <path
                                                                            d="M302.61,1250,585.11,967.52,302.61,685,20.11,967.52ZM764.48,1449.51l485.52-485.75,282.5,282.5-485.52,485.75L764.48,2014.5,481.76,1732"
                                                                            fill="#F0B90B"/>
                                                                        <path
                                                                            d="M397.13,1267.42,1250,420.55l852.87,846.87L1733.16,1637,1250,1154l-483.45,483.44-369.42-369.42"
                                                                            fill="#F0B90B"/>
                                                                        <path
                                                                            d="M1250,1733.76l483.16-483.44,282.49,282.5L1250,2500,482.48,1732.5,764.48,1450"
                                                                            fill="#F0B90B"/>
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-semibold text-white">{wallet.name}</div>
                                                                <div className="text-xs text-gray-400 flex items-center">
                                                                    {formatAddress(wallet.address)}
                                                                    <button
                                                                        className="ml-1 text-gray-400 hover:text-[#a99fec]"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            copyToClipboard(wallet.address);
                                                                            toast({
                                                                                title: "Address copied",
                                                                                description: "Wallet address copied to clipboard",
                                                                            });
                                                                        }}
                                                                    >
                                                                        <Copy size={12}/>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-[#2a2a2a] text-[#a99fec] border border-[#3a3a3a]">
                                                            {wallet.network === "ethereum" ? "Ethereum" : "BNB Chain"}
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="font-bold text-xl text-white">
                                                            {balanceVisible
                                                                ? formatCurrency(wallet.balanceUSD || 0)
                                                                : "••••••"
                                                            }
                                                        </div>
                                                        <div className="flex items-center text-sm">
                                  <span className="text-gray-400 mr-2">
                                    {balanceVisible
                                        ? `${wallet.balance || 0} ${wallet.network === "ethereum" ? "ETH" : "BNB"}`
                                        : "••••••"
                                    }
                                  </span>
                                                            <Badge
                                                                className={`${wallet.changePercent24h >= 0 ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'} border-0 text-xs`}>
                                                                {wallet.changePercent24h >= 0
                                                                    ? <TrendingUp className="w-3 h-3 mr-1"/>
                                                                    : <TrendingDown className="w-3 h-3 mr-1"/>
                                                                }
                                                                {wallet.changePercent24h.toFixed(2)}%
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
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
                                                onClick={() => setShowCreateModal(true)}
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
                    ) : (
                        // Wallet Details View
                        <div>
                            <div className="mb-6">
                                <Button 
                                    variant="ghost" 
                                    onClick={handleBackToList}
                                    className="text-gray-400 hover:text-[#a99fec] -ml-2 mb-4"
                                >
                                    ← Back to Wallets
                                </Button>

                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                                    <div className="flex items-center mb-4 md:mb-0">
                                        {selectedWallet.network === "ethereum" ? (
                                            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mr-4">
                                                <svg className="w-7 h-7 text-blue-500"
                                                     viewBox="0 0 784.37 1277.39" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M392.07 0L383.5 29.11V873.74L392.07 882.29L784.13 650.54L392.07 0Z"
                                                        fill="#343434"/>
                                                    <path d="M392.07 0L0 650.54L392.07 882.29V472.33V0Z"
                                                          fill="#8C8C8C"/>
                                                    <path
                                                        d="M392.07 956.52L387.24 962.41V1263.28L392.07 1277.38L784.37 724.89L392.07 956.52Z"
                                                        fill="#3C3C3B"/>
                                                    <path
                                                        d="M392.07 1277.38V956.52L0 724.89L392.07 1277.38Z"
                                                        fill="#8C8C8C"/>
                                                    <path
                                                        d="M392.07 882.29L784.13 650.54L392.07 472.33V882.29Z"
                                                        fill="#141414"/>
                                                    <path d="M0 650.54L392.07 882.29V472.33L0 650.54Z"
                                                          fill="#393939"/>
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center mr-4">
                                                <svg className="w-7 h-7 text-yellow-500"
                                                     viewBox="0 0 2500 2500" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M764.48,1050.52,1250,565l485.75,485.73,282.5-282.5L1250,0,482,768l282.49,282.5"
                                                        fill="#F0B90B"/>
                                                    <path
                                                        d="M302.61,1250,585.11,967.52,302.61,685,20.11,967.52ZM764.48,1449.51l485.52-485.75,282.5,282.5-485.52,485.75L764.48,2014.5,481.76,1732"
                                                        fill="#F0B90B"/>
                                                    <path
                                                        d="M397.13,1267.42,1250,420.55l852.87,846.87L1733.16,1637,1250,1154l-483.45,483.44-369.42-369.42"
                                                        fill="#F0B90B"/>
                                                    <path
                                                        d="M1250,1733.76l483.16-483.44,282.49,282.5L1250,2500,482.48,1732.5,764.48,1450"
                                                        fill="#F0B90B"/>
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <h1 className="text-2xl font-bold text-white">{selectedWallet.name}</h1>
                                            <div className="flex items-center text-gray-400">
                                                <Badge className="mr-2 bg-[#2a2a2a] text-[#a99fec] border border-[#3a3a3a]">
                                                    {selectedWallet.network === "ethereum" ? "Ethereum" : "BNB Chain"}
                                                </Badge>
                                                <span className="text-sm flex items-center">
                                                    {selectedWallet.address}
                                                    <button
                                                        className="ml-1 text-gray-400 hover:text-[#a99fec]"
                                                        onClick={() => {
                                                            copyToClipboard(selectedWallet.address);
                                                            toast({
                                                                title: "Address copied",
                                                                description: "Wallet address copied to clipboard",
                                                            });
                                                        }}
                                                    >
                                                        <Copy size={14}/>
                                                    </button>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
                                        <CardContent className="p-6">
                                            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Balance</h3>
                                            {isLoadingBalance ? (
                                                <div className="text-gray-400">Loading balance...</div>
                                            ) : (
                                                <>
                                                    <div className="text-2xl font-bold text-white mb-1">
                                                        {balanceVisible
                                                            ? formatCurrency(selectedWallet.balanceUSD || 0)
                                                            : "••••••"
                                                        }
                                                    </div>
                                                    <div className="flex items-center text-sm">
                                                        <span className="text-gray-400 mr-2">
                                                            {balanceVisible && walletBalances.length > 0
                                                                ? `${parseFloat(walletBalances.find(b => !b.isToken)?.balance || "0")} ${selectedWallet.network === "ethereum" ? "ETH" : "BNB"}`
                                                                : "••••••"
                                                            }
                                                        </span>
                                                        <Badge
                                                            className={`${selectedWallet.changePercent24h >= 0 ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'} border-0 text-xs`}>
                                                            {selectedWallet.changePercent24h >= 0
                                                                ? <TrendingUp className="w-3 h-3 mr-1"/>
                                                                : <TrendingDown className="w-3 h-3 mr-1"/>
                                                            }
                                                            {selectedWallet.changePercent24h.toFixed(2)}%
                                                        </Badge>
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
                                        <CardContent className="p-6">
                                            <h3 className="text-sm font-medium text-gray-400 mb-2">Tokens</h3>
                                            {isLoadingBalance ? (
                                                <div className="text-gray-400">Loading tokens...</div>
                                            ) : (
                                                <>
                                                    <div className="text-2xl font-bold text-white mb-1">
                                                        {walletBalances.filter(token => token.isToken).length}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        Different assets in this wallet
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
                                        <CardContent className="p-6">
                                            <h3 className="text-sm font-medium text-gray-400 mb-2">Transactions</h3>
                                            {isLoadingTransactions ? (
                                                <div className="text-gray-400">Loading transactions...</div>
                                            ) : (
                                                <>
                                                    <div className="text-2xl font-bold text-white mb-1">
                                                        {walletTransactions.length}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        Total transactions
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Tokens Section */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-white mb-4">Tokens</h2>
                                    <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
                                        <div className="p-4">
                                            <div className="grid grid-cols-12 text-sm font-medium text-gray-400 border-b border-[#3a3a3a] pb-2">
                                                <div className="col-span-4">Asset</div>
                                                <div className="col-span-3 text-right">Balance</div>
                                                <div className="col-span-3 text-right">Value</div>
                                                <div className="col-span-2 text-right">Type</div>
                                            </div>

                                            {isLoadingBalance ? (
                                                <div className="py-8 text-center text-gray-400">
                                                    Loading token balances...
                                                </div>
                                            ) : walletBalances.length > 0 ? (
                                                <div className="divide-y divide-[#3a3a3a]">
                                                    {walletBalances.map((token, index) => (
                                                        <div key={index} className="grid grid-cols-12 py-4 text-sm">
                                                            <div className="col-span-4 flex items-center">
                                                                <div className="font-medium text-white">{token.coin || token.name}</div>
                                                                <div className="text-gray-400 ml-2">{token.symbol}</div>
                                                            </div>
                                                            <div className="col-span-3 text-right text-white">
                                                                {balanceVisible ? parseFloat(token.balance).toFixed(6) : "••••••"} {token.symbol}
                                                            </div>
                                                            <div className="col-span-3 text-right text-white">
                                                                {balanceVisible ? formatCurrency(0) : "••••••"}
                                                            </div>
                                                            <div className="col-span-2 text-right">
                                                                <Badge
                                                                    className={`${token.isToken ? 'bg-blue-900/20 text-blue-500' : 'bg-green-900/20 text-green-500'} border-0 text-xs`}>
                                                                    {token.isToken ? 'Token' : 'Coin'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-gray-400">
                                                    No tokens found in this wallet
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>

                                {/* Transactions Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-white">Transaction History</h2>
                                        <div className="flex space-x-2">
                                            <Button 
                                                variant={transactionTab === 'all' ? 'default' : 'outline'} 
                                                size="sm"
                                                onClick={() => handleTabChange('all')}
                                                className={transactionTab === 'all' ? 'bg-[#a99fec] text-[#222222] hover:bg-[#9888db]' : 'text-gray-400 hover:text-[#a99fec]'}
                                            >
                                                All Transactions
                                            </Button>
                                            <Button 
                                                variant={transactionTab === 'incoming' ? 'default' : 'outline'} 
                                                size="sm"
                                                onClick={() => handleTabChange('incoming')}
                                                className={transactionTab === 'incoming' ? 'bg-[#a99fec] text-[#222222] hover:bg-[#9888db]' : 'text-gray-400 hover:text-[#a99fec]'}
                                            >
                                                Incoming
                                            </Button>
                                            <Button 
                                                variant={transactionTab === 'outgoing' ? 'default' : 'outline'} 
                                                size="sm"
                                                onClick={() => handleTabChange('outgoing')}
                                                className={transactionTab === 'outgoing' ? 'bg-[#a99fec] text-[#222222] hover:bg-[#9888db]' : 'text-gray-400 hover:text-[#a99fec]'}
                                            >
                                                Outgoing
                                            </Button>
                                        </div>
                                    </div>
                                    <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
                                        <div className="p-4">
                                            <div className="grid grid-cols-12 text-sm font-medium text-gray-400 border-b border-[#3a3a3a] pb-2">
                                                <div className="col-span-2">Hash</div>
                                                <div className="col-span-2">Amount</div>
                                                <div className="col-span-3">From</div>
                                                <div className="col-span-3">To</div>
                                                <div className="col-span-2 text-right">Status</div>
                                            </div>

                                            {isLoadingTransactions ? (
                                                <div className="py-8 text-center text-gray-400">
                                                    Loading transactions...
                                                </div>
                                            ) : walletTransactions.length > 0 ? (
                                                <div className="divide-y divide-[#3a3a3a]">
                                                    {walletTransactions.map((tx, index) => {
                                                        const isReceived = tx.toAddress.toLowerCase() === selectedWallet?.address.toLowerCase();
                                                        const date = new Date(tx.timestamp);

                                                        return (
                                                            <div key={index} className="grid grid-cols-12 py-4 text-sm">
                                                                <div className="col-span-2 text-gray-400">
                                                                    {formatAddress(tx.hash)}
                                                                </div>
                                                                <div className="col-span-2 text-white">
                                                                    {balanceVisible ? parseFloat(tx.valueDecimal).toFixed(6) : "••••••"} {tx.tokenSymbol || (selectedWallet?.network === "ethereum" ? "ETH" : "BNB")}
                                                                </div>
                                                                <div className="col-span-3 text-gray-400">
                                                                    {formatAddress(tx.fromAddress)}
                                                                </div>
                                                                <div className="col-span-3 text-gray-400">
                                                                    {formatAddress(tx.toAddress)}
                                                                </div>
                                                                <div className="col-span-2 text-right">
                                                                    <Badge className={`
                                                                        ${!tx.status ? 'bg-gray-900/20 text-gray-500' :
                                                                          tx.status === 'confirmed' ? 'bg-green-900/20 text-green-500' : 
                                                                          tx.status === 'pending' ? 'bg-yellow-900/20 text-yellow-500' : 
                                                                          'bg-red-900/20 text-red-500'} 
                                                                        border-0
                                                                    `}>
                                                                        {tx.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1) : 'Unknown'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-gray-400">
                                                    No transactions found for this wallet
                                                </div>
                                            )}

                                            {/* Pagination */}
                                            {!isLoadingTransactions && walletTransactions.length > 0 && (
                                                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center border-t border-[#3a3a3a] pt-4">
                                                    <div className="flex items-center mb-4 sm:mb-0">
                                                        <span className="text-sm text-gray-400 mr-2">Items per page:</span>
                                                        <Select
                                                            value={String(itemsPerPage)}
                                                            onValueChange={(value) => handleItemsPerPageChange(Number(value))}
                                                        >
                                                            <SelectTrigger className="w-20 h-8 bg-[#333333] border-[#444444] text-white text-sm">
                                                                <SelectValue placeholder="50" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#333333] border-[#444444] text-white">
                                                                <SelectItem value="50">50</SelectItem>
                                                                <SelectItem value="100">100</SelectItem>
                                                                <SelectItem value="200">200</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <div className="flex space-x-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePageChange(1)}
                                                                disabled={currentPage === 1}
                                                                className="h-8 w-8 p-0 text-gray-400 hover:text-[#a99fec]"
                                                            >
                                                                <span>«</span>
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePageChange(currentPage - 1)}
                                                                disabled={currentPage === 1}
                                                                className="h-8 w-8 p-0 text-gray-400 hover:text-[#a99fec]"
                                                            >
                                                                <span>‹</span>
                                                            </Button>

                                                            {/* Page numbers */}
                                                            {(() => {
                                                                const totalPages = Math.ceil(totalTransactions / itemsPerPage);
                                                                const pages = [];

                                                                // Logic to show limited page numbers with ellipsis
                                                                if (totalPages <= 7) {
                                                                    // Show all pages if 7 or fewer
                                                                    for (let i = 1; i <= totalPages; i++) {
                                                                        pages.push(i);
                                                                    }
                                                                } else {
                                                                    // Always show first page
                                                                    pages.push(1);

                                                                    // Show ellipsis if current page is > 3
                                                                    if (currentPage > 3) {
                                                                        pages.push(-1); // -1 represents ellipsis
                                                                    }

                                                                    // Show pages around current page
                                                                    const startPage = Math.max(2, currentPage - 1);
                                                                    const endPage = Math.min(totalPages - 1, currentPage + 1);

                                                                    for (let i = startPage; i <= endPage; i++) {
                                                                        pages.push(i);
                                                                    }

                                                                    // Show ellipsis if current page is < totalPages - 2
                                                                    if (currentPage < totalPages - 2) {
                                                                        pages.push(-2); // -2 represents ellipsis
                                                                    }

                                                                    // Always show last page
                                                                    pages.push(totalPages);
                                                                }

                                                                return pages.map((page, index) => {
                                                                    if (page < 0) {
                                                                        // Render ellipsis
                                                                        return (
                                                                            <span key={`ellipsis-${index}`} className="h-8 w-8 flex items-center justify-center text-gray-400">
                                                                                …
                                                                            </span>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <Button
                                                                            key={page}
                                                                            variant={currentPage === page ? "default" : "outline"}
                                                                            size="sm"
                                                                            onClick={() => handlePageChange(page)}
                                                                            className={`h-8 w-8 p-0 ${
                                                                                currentPage === page 
                                                                                    ? 'bg-[#a99fec] text-[#222222] hover:bg-[#9888db]' 
                                                                                    : 'text-gray-400 hover:text-[#a99fec]'
                                                                            }`}
                                                                        >
                                                                            <span>{page}</span>
                                                                        </Button>
                                                                    );
                                                                });
                                                            })()}

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePageChange(currentPage + 1)}
                                                                disabled={currentPage === Math.ceil(totalTransactions / itemsPerPage)}
                                                                className="h-8 w-8 p-0 text-gray-400 hover:text-[#a99fec]"
                                                            >
                                                                <span>›</span>
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePageChange(Math.ceil(totalTransactions / itemsPerPage))}
                                                                disabled={currentPage === Math.ceil(totalTransactions / itemsPerPage)}
                                                                className="h-8 w-8 p-0 text-gray-400 hover:text-[#a99fec]"
                                                            >
                                                                <span>»</span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </main>


                {/* Success Modal for Wallet Creation */}
                {showSuccessModal && newlyCreatedWallet && (
                    <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                        <DialogContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-white">Wallet Created Successfully!</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Your new wallet has been created and added to your account. Please save your private
                                    key and mnemonic phrase securely.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label className="text-white">Wallet Address</Label>
                                    <div className="mt-1 p-3 bg-[#333333] rounded-md flex justify-between items-center">
                                        <code
                                            className="text-sm text-[#a99fec] break-all">{newlyCreatedWallet.address}</code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                copyToClipboard(newlyCreatedWallet.address);
                                                toast({
                                                    title: "Address copied",
                                                    description: "Wallet address copied to clipboard",
                                                });
                                            }}
                                            className="text-gray-400 hover:text-[#a99fec]"
                                        >
                                            <Copy size={16}/>
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-white flex items-center">
                                        <Shield className="w-4 h-4 mr-1 text-[#a99fec]"/> Private Key (Keep Secret!)
                                    </Label>
                                    <div className="mt-1 p-3 bg-[#333333] rounded-md flex justify-between items-center">
                                        <code
                                            className="text-sm text-[#a99fec] break-all">{newlyCreatedWallet.privateKey}</code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                copyToClipboard(newlyCreatedWallet.privateKey);
                                                toast({
                                                    title: "Private key copied",
                                                    description: "Private key copied to clipboard",
                                                });
                                            }}
                                            className="text-gray-400 hover:text-[#a99fec]"
                                        >
                                            <Copy size={16}/>
                                        </Button>
                                    </div>
                                </div>
                                {newlyCreatedWallet.mnemonic && (
                                    <div>
                                        <Label className="text-white flex items-center">
                                            <Shield className="w-4 h-4 mr-1 text-[#a99fec]"/> Mnemonic Phrase (Keep
                                            Secret!)
                                        </Label>
                                        <div
                                            className="mt-1 p-3 bg-[#333333] rounded-md flex justify-between items-center">
                                            <code
                                                className="text-sm text-[#a99fec] break-all">{newlyCreatedWallet.mnemonic}</code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    copyToClipboard(newlyCreatedWallet.mnemonic || "");
                                                    toast({
                                                        title: "Mnemonic copied",
                                                        description: "Mnemonic phrase copied to clipboard",
                                                    });
                                                }}
                                                className="text-gray-400 hover:text-[#a99fec]"
                                            >
                                                <Copy size={16}/>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db] w-full"
                                >
                                    I've Saved My Details
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Create Wallet Modal */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                        <DialogHeader>
                            <DialogTitle className="text-white">Create New Wallet</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Create a new wallet to securely store your crypto assets.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateWallet}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="new-wallet-name" className="text-white">Wallet Name</Label>
                                    <Input
                                        id="new-wallet-name"
                                        placeholder="My New Wallet"
                                        value={createWalletForm.name}
                                        onChange={(e) => setCreateWalletForm({
                                            ...createWalletForm,
                                            name: e.target.value
                                        })}
                                        className="bg-[#333333] border-[#444444] text-white"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new-wallet-network" className="text-white">Network</Label>
                                    <Select
                                        value={createWalletForm.network}
                                        onValueChange={(value) => setCreateWalletForm({
                                            ...createWalletForm,
                                            network: value as "ethereum" | "bnb"
                                        })}
                                    >
                                        <SelectTrigger className="bg-[#333333] border-[#444444] text-white">
                                            <SelectValue placeholder="Select network"/>
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#333333] border-[#444444] text-white">
                                            <SelectItem value="ethereum">Ethereum</SelectItem>
                                            <SelectItem value="bnb">BNB Chain</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new-wallet-passphrase" className="text-white">Encryption
                                        Passphrase</Label>
                                    <Input
                                        id="new-wallet-passphrase"
                                        type="password"
                                        placeholder="Secure passphrase"
                                        value={createWalletForm.passphrase}
                                        onChange={(e) => setCreateWalletForm({
                                            ...createWalletForm,
                                            passphrase: e.target.value
                                        })}
                                        className="bg-[#333333] border-[#444444] text-white"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isCreatingWallet}
                                    className="bg-[#a99fec] text-[#222222] hover:bg-[#9888db]"
                                >
                                    {isCreatingWallet ? "Creating..." : "Create Wallet"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </RouteGuard>
    );
}
