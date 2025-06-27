"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RouteGuard } from "@/components/route-guard";
import { CryptoWebApi } from "@/lib/cryptowebapi";
import { CryptoWebApiClient } from 'cryptowebapi-connector-js';
import { useAccountStore } from "@/store/account";
import { getAllWallets, saveWallet, Wallet as WalletType } from "@/lib/accountDb";
import { encryptPrivateKey } from "@/lib/crypto";
import { deriveDbName } from "@/lib/passphrase";

// Import components
import { Header } from "./components/header/Header";
import { WalletList } from "./components/wallet/WalletList";
import { WalletDetails } from "./components/wallet/WalletDetails";
import { TransactionList } from "./components/transactions/TransactionList";
import { EarnModal } from "./components/earn/EarnModal";
import { CreateWalletModal } from "./components/modals/CreateWalletModal";
import { SuccessModal } from "./components/modals/SuccessModal";

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
  network: "ethereum" | "bnb" | "tron" | "bitcoin";
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
  const { lock, db, dbName } = useAccountStore();

  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEarnModal, setShowEarnModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [supportedCoins, setSupportedCoins] = useState<any[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);
  const [existingWallets, setExistingWallets] = useState<WalletType[]>([]);
  const [useExistingWallet, setUseExistingWallet] = useState(false);
  const [selectedExistingWallet, setSelectedExistingWallet] = useState<string>("");
  const [newlyCreatedWallet, setNewlyCreatedWallet] = useState<{
    address: string;
    privateKey: string;
    mnemonic?: string;
    network: "ethereum" | "bnb" | "tron" | "bitcoin";
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
    network: "ethereum" as "ethereum" | "bnb" | "tron" | "bitcoin",
    balance: "",
    balanceUSD: "",
  });

  // Form state for creating wallets
  const [createWalletForm, setCreateWalletForm] = useState({
    name: "",
    network: "ethereum" as "ethereum" | "bnb" | "tron" | "bitcoin",
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

  // Event handlers
  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWalletForm.name || !newWalletForm.address || !newWalletForm.balance || !newWalletForm.balanceUSD || !db) {
      return;
    }

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
      toast("Error", {
        description: "Failed to fetch wallet transactions",
        style: { backgroundColor: "#f44336", color: "white" }
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
      toast("Error", {
        description: "Failed to fetch wallet balance",
        style: { backgroundColor: "#f44336", color: "white" }
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

  // Handle EARN button click
  const handleEarnClick = async () => {
    setIsLoadingCoins(true);
    setShowEarnModal(true);

    try {
      // Fetch supported coins
      const coins = await cryptoWebApiClient.getSupportedCoins(
        {
          "network": "ethereum", // Fetch all networks
        }
      );

      // Check if the response is in the new format (direct array) or old format (with success and data properties)
      if (Array.isArray(coins)) {
        // New format: direct array of CoinData
        setSupportedCoins(coins);
      } else if (coins.success && coins.data) {
        // Old format: {success, data} structure
        setSupportedCoins(coins.data);
      } else {
        toast("Error", {
          description: "Failed to fetch supported coins",
          style: { backgroundColor: "#f44336", color: "white" }
        });
      }
    } catch (error) {
      console.error("Error fetching supported coins:", error);
      toast("Error", {
        description: "Failed to fetch supported coins",
        style: { backgroundColor: "#f44336", color: "white" }
      });
    } finally {
      setIsLoadingCoins(false);
    }
  };

  // Handle coin selection
  const handleCoinSelect = (coin: any) => {
    setSelectedCoin(coin);

    if (!coin) return;

    // Get network from provider if network property is not available
    const network = coin.network || coin.provider?.toLowerCase() || "ethereum";

    // Check if there are existing wallets for this network
    const networkWallets = wallets.filter(wallet => wallet.network === network);
    setExistingWallets(networkWallets);

    // Reset wallet selection
    setUseExistingWallet(networkWallets.length > 0);
    if (networkWallets.length > 0) {
      setSelectedExistingWallet(networkWallets[0].id);
    }
  };

  // Handle wallet creation for selected coin
  const handleCreateWalletForCoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCoin || !createWalletForm.passphrase || !db || !dbName) {
      return;
    }

    setIsCreatingWallet(true);

    try {
      // Validate that the passphrase matches the login passphrase
      const derivedDbName = await deriveDbName(createWalletForm.passphrase);
      if (derivedDbName !== dbName) {
        toast("Passphrase Error", {
          description: "The passphrase must be the same as your login passphrase for security reasons.",
          style: { backgroundColor: "#f44336", color: "white" }
        });
        setIsCreatingWallet(false);
        return;
      }

      // Get network from provider if network property is not available
      const network = selectedCoin.network || selectedCoin.provider?.toLowerCase() || "ethereum";

      // Create wallet using CryptoWebApiClient
      const newWallet = await cryptoWebApiClient.createWallet({
        network: network
      });

      if (!newWallet.key) {
        throw new Error('Private key is missing in the wallet creation response');
      }

      // Encrypt private key and mnemonic with passphrase
      const encryptedPrivateKey = await encryptPrivateKey(newWallet.key, createWalletForm.passphrase);

      // Check if mnemonic exists in the response
      let encryptedMnemonic = undefined;
      if (newWallet.mnemonic) {
        encryptedMnemonic = await encryptPrivateKey(newWallet.mnemonic, createWalletForm.passphrase);
      }

      // Create wallet name based on network and coin
      const walletName = `${network} | ${selectedCoin.shortName}`;

      // Create wallet object
      const walletData: WalletType = {
        id: Date.now().toString(),
        name: walletName,
        address: newWallet.address,
        network: network,
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
        network: network,
        name: walletName
      });

      // Show success modal
      setShowEarnModal(false);
      setShowSuccessModal(true);

      // Reset form and selection
      setSelectedCoin(null);
      setUseExistingWallet(false);
      setSelectedExistingWallet("");

    } catch (error) {
      console.error("Error creating wallet for coin:", error);
      toast("Error", {
        description: `Error creating wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        style: { backgroundColor: "#f44336", color: "white" }
      });
    } finally {
      setIsCreatingWallet(false);
    }
  };

  // Handle using existing wallet for selected coin
  const handleUseExistingWallet = () => {
    if (!selectedCoin || !selectedExistingWallet) {
      return;
    }

    // Find the selected wallet
    const wallet = wallets.find(w => w.id === selectedExistingWallet);
    if (wallet) {
      // Select this wallet to view its details
      handleWalletSelect(wallet);
      // Close the EARN modal
      setShowEarnModal(false);

      toast("Success", {
        description: `Using existing ${wallet.name} wallet for ${selectedCoin.shortName}`,
        style: { backgroundColor: "#4caf50", color: "white" }
      });
    }
  };

  // Handle wallet creation
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createWalletForm.name || !createWalletForm.network || !createWalletForm.passphrase || !db || !dbName) {
      return;
    }

    setIsCreatingWallet(true);

    try {
      // Validate that the passphrase matches the login passphrase
      const derivedDbName = await deriveDbName(createWalletForm.passphrase);
      if (derivedDbName !== dbName) {
        toast("Passphrase Error", {
          description: "The passphrase must be the same as your login passphrase for security reasons.",
          style: { backgroundColor: "#f44336", color: "white" }
        });
        setIsCreatingWallet(false);
        return;
      }

      // Create wallet using CryptoWebApiClient
      const newWallet = await cryptoWebApiClient.createWallet({
        network: createWalletForm.network
      });

      // Check if privateKey exists in the response
      if (!newWallet.key) {
        throw new Error('Private key is missing in the wallet creation response');
      }

      // Encrypt private key and mnemonic with passphrase
      const encryptedPrivateKey = await encryptPrivateKey(newWallet.key, createWalletForm.passphrase);

      // Check if mnemonic exists in the response
      let encryptedMnemonic = undefined;
      if (newWallet.mnemonic) {
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
      toast("Error", {
        description: `Error creating wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        style: { backgroundColor: "#f44336", color: "white" }
      });
    } finally {
      setIsCreatingWallet(false);
    }
  };

  return (
    <RouteGuard>
      <div className="min-h-screen bg-[#222222] text-white">
        <Header 
          balanceVisible={balanceVisible} 
          setBalanceVisible={setBalanceVisible} 
          lock={lock} 
        />

        <main className="container mx-auto p-4 md:p-6">
          {!selectedWallet ? (
            <WalletList 
              wallets={wallets}
              totalBalance={totalBalance}
              totalChangePercent={totalChangePercent}
              balanceVisible={balanceVisible}
              onWalletSelect={handleWalletSelect}
              onCreateWalletClick={() => setShowCreateModal(true)}
              onEarnClick={handleEarnClick}
              formatCurrency={formatCurrency}
            />
          ) : (
            <WalletDetails
              wallet={selectedWallet}
              balanceVisible={balanceVisible}
              onBackClick={handleBackToList}
              formatCurrency={formatCurrency}
              walletBalances={walletBalances}
              isLoadingBalance={isLoadingBalance}
            >
              <TransactionList 
                transactions={walletTransactions}
                walletAddress={selectedWallet.address}
                isLoading={isLoadingTransactions}
                transactionTab={transactionTab}
                onTabChange={handleTabChange}
                currentPage={currentPage}
                totalTransactions={totalTransactions}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </WalletDetails>
          )}
        </main>

        {/* Modals */}
        <CreateWalletModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          createWalletForm={createWalletForm}
          setCreateWalletForm={setCreateWalletForm}
          onCreateWallet={handleCreateWallet}
          isCreatingWallet={isCreatingWallet}
        />

        <EarnModal 
          isOpen={showEarnModal}
          onClose={() => setShowEarnModal(false)}
          supportedCoins={supportedCoins}
          existingWallets={existingWallets}
          isLoading={isLoadingCoins}
          onCoinSelect={handleCoinSelect}
          onCreateWallet={handleCreateWalletForCoin}
          onUseExistingWallet={handleUseExistingWallet}
          selectedCoin={selectedCoin}
          useExistingWallet={useExistingWallet}
          setUseExistingWallet={setUseExistingWallet}
          selectedExistingWallet={selectedExistingWallet}
          setSelectedExistingWallet={setSelectedExistingWallet}
          createWalletForm={createWalletForm}
          setCreateWalletForm={setCreateWalletForm}
          isCreatingWallet={isCreatingWallet}
        />

        <SuccessModal 
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          wallet={newlyCreatedWallet}
        />
      </div>
    </RouteGuard>
  );
}
